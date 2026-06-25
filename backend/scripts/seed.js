require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../src/config/database');
const { User, Client, Project, Ticket, TicketComment } = require('../src/models');

async function seed() {
  console.log('🌱 Iniciando seed de datos...');
  await sequelize.sync({ force: true });

  // ── Users ──────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('Admin123!', 12);
  const techPwd  = await bcrypt.hash('Tech123!', 12);

  const admin = await User.create({ id: uuidv4(), name: 'Jorge Mamani', email: 'admin@helpdesk.pe',
    password: adminPwd, role: 'admin', skills: [], isActive: true });

  const techs = await User.bulkCreate([
    { id: uuidv4(), name: 'Ana Quispe',    email: 'ana@helpdesk.pe',    password: techPwd, role: 'technician', skills: ['network','hardware','windows'], isActive: true },
    { id: uuidv4(), name: 'Carlos Vera',   email: 'carlos@helpdesk.pe', password: techPwd, role: 'technician', skills: ['database','servers'],          isActive: true },
    { id: uuidv4(), name: 'María Torres',  email: 'maria@helpdesk.pe',  password: techPwd, role: 'technician', skills: ['software','api','web'],         isActive: true },
    { id: uuidv4(), name: 'Luis Flores',   email: 'luis@helpdesk.pe',   password: techPwd, role: 'technician', skills: ['network','servers','cloud'],    isActive: true },
    { id: uuidv4(), name: 'Sofía Mamani',  email: 'sofia@helpdesk.pe',  password: techPwd, role: 'technician', skills: ['security'],                    isActive: true },
  ]);

  // ── Clients ────────────────────────────────────────────
  const clients = await Client.bulkCreate([
    { id: uuidv4(), name: 'Banco Nacional SA',  contactName: 'Roberto Paz',  email: 'r.paz@bnsa.com.pe',       phone: '+51 1 612-3000', plan: 'enterprise', city: 'Lima',     isActive: true },
    { id: uuidv4(), name: 'Minera Yacimientos', contactName: 'Carla Ríos',   email: 'c.rios@minera.com',        phone: '+51 54 210-800', plan: 'pro',        city: 'Arequipa', isActive: true },
    { id: uuidv4(), name: 'Municipalidad Lima', contactName: 'Pedro Huanca', email: 'p.huanca@muni.gob.pe',     phone: '+51 1 632-1300', plan: 'gobierno',   city: 'Lima',     isActive: true },
    { id: uuidv4(), name: 'Farmacia Salud+',    contactName: 'Ana Gómez',    email: 'a.gomez@salud.com',        phone: '+51 1 345-6789', plan: 'basico',     city: 'Trujillo', isActive: false },
  ]);

  // ── Projects ───────────────────────────────────────────
  const projects = await Project.bulkCreate([
    { id: uuidv4(), name: 'Migración Core Bancario', clientId: clients[0].id, status: 'in_progress', progress: 72, deadline: '2025-09-30', budget: 120000, managerId: admin.id },
    { id: uuidv4(), name: 'ERP Minero v2',           clientId: clients[1].id, status: 'active',      progress: 45, deadline: '2025-12-15', budget: 85000,  managerId: admin.id },
    { id: uuidv4(), name: 'Portal Ciudadano',        clientId: clients[2].id, status: 'review',      progress: 88, deadline: '2025-07-20', budget: 45000,  managerId: admin.id },
    { id: uuidv4(), name: 'Seguridad Perimetral',    clientId: clients[0].id, status: 'planning',    progress: 10, deadline: '2026-01-10', budget: 68000,  managerId: admin.id },
  ]);

  // ── Tickets ────────────────────────────────────────────
  const tks = [
    { title: 'No se puede acceder al sistema bancario desde VPN', description: 'El equipo de operaciones (12 personas) no puede conectarse al sistema principal del banco mediante la VPN corporativa. Error: Connection timeout desde las 8:00 AM.', priority: 'critical', status: 'open',   category: 'network',   clientId: clients[0].id, projectId: projects[0].id, slaDeadline: new Date(Date.now()+2*3600000) },
    { title: 'Error 500 en exportación de reportes PDF',          description: 'El módulo de reportes del ERP devuelve error 500 al generar PDFs con más de 100 registros. Falla de forma intermitente.',                                             priority: 'high',     status: 'in_progress', category: 'software',  clientId: clients[1].id, projectId: projects[1].id, assignedToId: techs[2].id, slaDeadline: new Date(Date.now()+4*3600000) },
    { title: 'Servidor de pruebas fuera de línea',                description: 'El servidor de staging del portal ciudadano no responde desde las 23:45. Afecta pruebas de QA.',                                                                     priority: 'high',     status: 'in_progress', category: 'servers',   clientId: clients[2].id, projectId: projects[2].id, assignedToId: techs[3].id, slaDeadline: new Date(Date.now()+1*3600000) },
    { title: 'Crear usuario en Active Directory — Juan Pérez',    description: 'Solicitar creación de usuario Juan Pérez (Analista Senior) en AD. Necesita acceso a SAP, correo, VPN y carpetas de finanzas.',                                       priority: 'medium',   status: 'open',        category: 'windows',   clientId: clients[0].id, projectId: projects[0].id },
    { title: 'Configurar firewall para nuevo proveedor externo',  description: 'Agregar reglas para Datacentros SAC (IP: 190.232.xx.xx) al puerto 8443 en el servidor de aplicaciones.',                                                              priority: 'medium',   status: 'resolved',    category: 'security',  clientId: clients[0].id, projectId: projects[3].id, assignedToId: techs[4].id, resolvedAt: new Date() },
  ];

  for (const t of tks) {
    await Ticket.create({ id: uuidv4(), ticketNumber: `TK-${1000 + tks.indexOf(t) + 42}`, createdById: admin.id, ...t });
  }

  console.log('✅ Seed completado exitosamente');
  console.log(`   → Admin: admin@helpdesk.pe / Admin123!`);
  console.log(`   → Técnico: ana@helpdesk.pe / Tech123!`);
  await sequelize.close();
}

seed().catch(err => { console.error('❌ Seed falló:', err); process.exit(1); });
