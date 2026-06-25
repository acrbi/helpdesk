const { v4: uuidv4 } = require('uuid');
const { Ticket, Client, Project, User, TicketComment, TicketHistory } = require('../models');
const { autoAssign, rankTechnicians } = require('../services/ai.service');
const { notifyAssignment } = require('../services/socket.service');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// ─── Generate ticket number ────────────────────────────────────────────────────
async function generateTicketNumber() {
  const count = await Ticket.count({ paranoid: false });
  return `TK-${String(count + 1001).padStart(4, '0')}`;
}

// ─── SLA deadline calculator ──────────────────────────────────────────────────
function calcSlaDeadline(priority, clientSla = {}) {
  const slaHours = clientSla[priority] || { critical: 2, high: 4, medium: 8, low: 24 }[priority] || 8;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + slaHours);
  return deadline;
}

// ═══════════════════════════════════════
// GET /tickets
// ═══════════════════════════════════════
exports.getAll = async (req, res, next) => {
  try {
    const {
      status, priority, category, clientId,
      projectId, assignedToId, search,
      page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'DESC',
    } = req.query;

    const where = {};
    if (status)       where.status   = { [Op.in]: status.split(',') };
    if (priority)     where.priority = priority;
    if (category)     where.category = category;
    if (clientId)     where.clientId = clientId;
    if (projectId)    where.projectId = projectId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where[Op.or] = [
        { title:        { [Op.iLike]: `%${search}%` } },
        { description:  { [Op.iLike]: `%${search}%` } },
        { ticketNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Ticket.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'skills'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
      ],
      order: [[sortBy, sortDir]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════
// GET /tickets/:id
// ═══════════════════════════════════════
exports.getOne = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Project, as: 'project' },
        { model: User, as: 'assignedTo', attributes: { exclude: ['password', 'refreshToken'] } },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        {
          model: TicketComment, as: 'comments',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
          order: [['createdAt', 'ASC']],
        },
        {
          model: TicketHistory, as: 'history',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
          order: [['createdAt', 'ASC']],
        },
      ],
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════
// POST /tickets
// ═══════════════════════════════════════
exports.create = async (req, res, next) => {
  try {
    const {
      title, description, priority = 'medium',
      category, clientId, projectId, tags, autoAssignAI = true,
    } = req.body;

    const client = await Client.findByPk(clientId);
    if (!client) return res.status(400).json({ success: false, message: 'Cliente no encontrado' });

    const ticketNumber = await generateTicketNumber();
    const slaDeadline  = calcSlaDeadline(priority, client.slaPriority);

    const ticket = await Ticket.create({
      id: uuidv4(),
      ticketNumber,
      title,
      description,
      priority,
      category: category || 'other',
      clientId,
      projectId: projectId || null,
      createdById: req.user?.id || null,
      slaDeadline,
      tags: tags || [],
    });

    // Record creation in history
    await TicketHistory.create({
      ticketId: ticket.id,
      userId:   req.user?.id,
      action:   'created',
      metadata: { priority, category },
    });

    // AI Auto-assignment
    let aiResult = null;
    if (autoAssignAI) {
      try {
        aiResult = await autoAssign(ticket);
        if (aiResult?.recommended) {
          await TicketHistory.create({
            ticketId:  ticket.id,
            userId:    null,
            action:    'auto_assigned',
            newValue:  aiResult.recommended.technicianName,
            metadata:  { aiScore: aiResult.recommended.scores, confidence: aiResult.confidence },
          });
          notifyAssignment(ticket.id, aiResult.recommended.technicianId, aiResult);
        }
      } catch (aiErr) {
        logger.warn('AI assignment failed, ticket remains unassigned:', aiErr.message);
      }
    }

    await ticket.reload({
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'skills'] },
      ],
    });

    res.status(201).json({ success: true, data: ticket, aiResult });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════
// PUT /tickets/:id
// ═══════════════════════════════════════
exports.update = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

    const allowed = ['title', 'description', 'status', 'priority', 'category',
                     'assignedToId', 'projectId', 'resolution', 'tags'];
    const updates = {};
    const historyRecords = [];

    for (const field of allowed) {
      if (req.body[field] !== undefined && req.body[field] !== ticket[field]) {
        historyRecords.push({
          ticketId:  ticket.id,
          userId:    req.user?.id,
          action:    'updated',
          fieldName: field,
          oldValue:  String(ticket[field]),
          newValue:  String(req.body[field]),
        });
        updates[field] = req.body[field];
      }
    }

    // Auto-set timestamps
    if (updates.status === 'resolved' && ticket.status !== 'resolved') {
      updates.resolvedAt = new Date();
    }
    if (updates.status === 'closed' && ticket.status !== 'closed') {
      updates.closedAt = new Date();
    }

    await ticket.update(updates);
    if (historyRecords.length) await TicketHistory.bulkCreate(historyRecords);

    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════
// DELETE /tickets/:id (soft delete)
// ═══════════════════════════════════════
exports.remove = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    await ticket.destroy();
    res.json({ success: true, message: 'Ticket eliminado' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════
// POST /tickets/:id/comments
// ═══════════════════════════════════════
exports.addComment = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

    const comment = await TicketComment.create({
      id:         uuidv4(),
      content:    req.body.content,
      isInternal: req.body.isInternal || false,
      ticketId:   ticket.id,
      userId:     req.user?.id,
    });

    // If first response, record it
    if (!ticket.firstResponseAt) {
      await ticket.update({ firstResponseAt: new Date() });
    }

    res.status(201).json({ success: true, data: comment });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════
// POST /tickets/ai/analyze
// ═══════════════════════════════════════
exports.aiAnalyze = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    const result = await rankTechnicians(title, description, category);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
