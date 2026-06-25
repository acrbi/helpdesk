// ── client.routes.js ──────────────────────────────────
const express = require('express');
const { Client, Ticket, Project } = require('../models');
const { authenticate } = require('../middleware/auth.middleware');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

const clientRouter = express.Router();
clientRouter.use(authenticate);

clientRouter.get('/', async (req, res, next) => {
  try {
    const { search, active } = req.query;
    const where = {};
    if (active !== undefined) where.isActive = active === 'true';
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    const clients = await Client.findAll({ where, order: [['name', 'ASC']] });
    res.json({ success: true, data: clients });
  } catch (e) { next(e); }
});

clientRouter.get('/:id', async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [{ model: Project, as: 'projects' }],
    });
    if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    res.json({ success: true, data: client });
  } catch (e) { next(e); }
});

clientRouter.post('/', async (req, res, next) => {
  try {
    const client = await Client.create({ id: uuidv4(), ...req.body });
    res.status(201).json({ success: true, data: client });
  } catch (e) { next(e); }
});

clientRouter.put('/:id', async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'No encontrado' });
    await client.update(req.body);
    res.json({ success: true, data: client });
  } catch (e) { next(e); }
});

clientRouter.delete('/:id', async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'No encontrado' });
    await client.destroy();
    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (e) { next(e); }
});

// ── project.routes.js ─────────────────────────────────
const projectRouter = express.Router();
projectRouter.use(authenticate);
const { Project: ProjModel, User } = require('../models');

projectRouter.get('/', async (req, res, next) => {
  try {
    const projects = await ProjModel.findAll({
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        { model: User, as: 'technicians', attributes: ['id', 'name', 'skills'], through: { attributes: [] } },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: projects });
  } catch (e) { next(e); }
});

projectRouter.get('/:id', async (req, res, next) => {
  try {
    const p = await ProjModel.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'technicians', attributes: { exclude: ['password', 'refreshToken'] }, through: { attributes: [] } },
        { model: Ticket, as: 'tickets', attributes: ['id','ticketNumber','title','status','priority'] },
      ],
    });
    if (!p) return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
});

projectRouter.post('/', async (req, res, next) => {
  try {
    const { technicianIds, ...data } = req.body;
    const project = await ProjModel.create({ id: uuidv4(), ...data });
    if (technicianIds?.length) await project.setTechnicians(technicianIds);
    res.status(201).json({ success: true, data: project });
  } catch (e) { next(e); }
});

projectRouter.put('/:id', async (req, res, next) => {
  try {
    const p = await ProjModel.findByPk(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'No encontrado' });
    const { technicianIds, ...data } = req.body;
    await p.update(data);
    if (technicianIds) await p.setTechnicians(technicianIds);
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
});

// ── technician.routes.js ──────────────────────────────
const techRouter = express.Router();
techRouter.use(authenticate);

techRouter.get('/', async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { role: 'technician' },
      attributes: { exclude: ['password', 'refreshToken'] },
      order: [['name', 'ASC']],
    });
    // Enrich with active ticket count
    const enriched = await Promise.all(users.map(async u => {
      const activeTickets = await Ticket.count({
        where: { assignedToId: u.id, status: { [Op.in]: ['open','assigned','in_progress','pending'] } },
      });
      return { ...u.toJSON(), activeTickets };
    }));
    res.json({ success: true, data: enriched });
  } catch (e) { next(e); }
});

techRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'refreshToken'] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Técnico no encontrado' });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

techRouter.put('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'No encontrado' });
    const allowed = ['name','phone','skills','department','isActive'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    await user.update(updates);
    const { password: _, refreshToken: __, ...safe } = user.toJSON();
    res.json({ success: true, data: safe });
  } catch (e) { next(e); }
});

// ── report.routes.js ──────────────────────────────────
const reportRouter = express.Router();
reportRouter.use(authenticate);
const { sequelize } = require('../config/database');

reportRouter.get('/summary', async (req, res, next) => {
  try {
    const [open, inProgress, resolved, closed, critical] = await Promise.all([
      Ticket.count({ where: { status: 'open' } }),
      Ticket.count({ where: { status: { [Op.in]: ['assigned','in_progress','pending'] } } }),
      Ticket.count({ where: { status: 'resolved' } }),
      Ticket.count({ where: { status: 'closed' } }),
      Ticket.count({ where: { priority: 'critical', status: { [Op.notIn]: ['closed','cancelled'] } } }),
    ]);
    res.json({ success: true, data: { open, inProgress, resolved, closed, critical, total: open+inProgress+resolved+closed } });
  } catch (e) { next(e); }
});

reportRouter.get('/technician-performance', async (req, res, next) => {
  try {
    const techs = await User.findAll({ where: { role: 'technician' }, attributes: ['id','name','skills'] });
    const perf = await Promise.all(techs.map(async t => {
      const [total, resolved, breached] = await Promise.all([
        Ticket.count({ where: { assignedToId: t.id } }),
        Ticket.count({ where: { assignedToId: t.id, status: { [Op.in]: ['resolved','closed'] } } }),
        Ticket.count({ where: { assignedToId: t.id, slaBreached: true } }),
      ]);
      return {
        id: t.id, name: t.name, skills: t.skills,
        total, resolved,
        resolutionRate: total ? Math.round(resolved/total*100) : 0,
        slaBreaches: breached,
      };
    }));
    res.json({ success: true, data: perf });
  } catch (e) { next(e); }
});

// ── ai.routes.js ──────────────────────────────────────
const { rankTechnicians, detectCategory } = require('../services/ai.service');
const aiRouter = express.Router();
aiRouter.use(authenticate);

aiRouter.post('/analyze', async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'title y description son requeridos' });
    }
    const result = await rankTechnicians(title, description, category);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

aiRouter.post('/detect-category', async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const result = detectCategory(title, description);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

module.exports = { clientRouter, projectRouter, techRouter, reportRouter, aiRouter };
