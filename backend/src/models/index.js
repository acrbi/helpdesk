const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ═══════════════════════════════════════
// USER (Técnicos y Admins)
// ═══════════════════════════════════════
const User = sequelize.define('User', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:         { type: DataTypes.STRING(100), allowNull: false },
  email:        { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
  password:     { type: DataTypes.STRING(255), allowNull: false },
  role:         { type: DataTypes.ENUM('admin', 'manager', 'technician', 'client'), defaultValue: 'technician' },
  avatar:       { type: DataTypes.STRING(255) },
  phone:        { type: DataTypes.STRING(20) },
  department:   { type: DataTypes.STRING(100) },
  skills:       { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  isActive:     { type: DataTypes.BOOLEAN, defaultValue: true },
  lastLogin:    { type: DataTypes.DATE },
  refreshToken: { type: DataTypes.TEXT },
}, { tableName: 'users' });

// ═══════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════
const Client = sequelize.define('Client', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  email:       { type: DataTypes.STRING(150), validate: { isEmail: true } },
  phone:       { type: DataTypes.STRING(20) },
  address:     { type: DataTypes.TEXT },
  city:        { type: DataTypes.STRING(80) },
  country:     { type: DataTypes.STRING(80), defaultValue: 'Perú' },
  plan:        { type: DataTypes.ENUM('basico', 'pro', 'enterprise', 'gobierno'), defaultValue: 'basico' },
  contactName: { type: DataTypes.STRING(100) },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  notes:       { type: DataTypes.TEXT },
  slaPriority: {
    type: DataTypes.JSONB,
    defaultValue: { critical: 2, high: 4, medium: 8, low: 24 }, // hours
  },
}, { tableName: 'clients' });

// ═══════════════════════════════════════
// PROJECT
// ═══════════════════════════════════════
const Project = sequelize.define('Project', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  status:      { type: DataTypes.ENUM('planning', 'active', 'in_progress', 'review', 'completed', 'on_hold'), defaultValue: 'active' },
  priority:    { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
  startDate:   { type: DataTypes.DATEONLY },
  deadline:    { type: DataTypes.DATEONLY },
  budget:      { type: DataTypes.DECIMAL(12, 2) },
  progress:    { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0, max: 100 } },
  clientId:    { type: DataTypes.UUID, allowNull: false },
  managerId:   { type: DataTypes.UUID },
  tags:        { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
}, { tableName: 'projects' });

// ═══════════════════════════════════════
// TICKET
// ═══════════════════════════════════════
const Ticket = sequelize.define('Ticket', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ticketNumber:  { type: DataTypes.STRING(20), unique: true },
  title:         { type: DataTypes.STRING(300), allowNull: false },
  description:   { type: DataTypes.TEXT, allowNull: false },
  status:        { type: DataTypes.ENUM('open', 'assigned', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled'), defaultValue: 'open' },
  priority:      { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
  category:      { type: DataTypes.ENUM('network', 'hardware', 'software', 'database', 'servers', 'security', 'windows', 'cloud', 'api', 'web', 'other'), defaultValue: 'other' },
  impact:        { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
  urgency:       { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
  slaDeadline:   { type: DataTypes.DATE },
  slaBreached:   { type: DataTypes.BOOLEAN, defaultValue: false },
  resolvedAt:    { type: DataTypes.DATE },
  closedAt:      { type: DataTypes.DATE },
  firstResponseAt:{ type: DataTypes.DATE },
  resolution:    { type: DataTypes.TEXT },
  tags:          { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  attachments:   { type: DataTypes.JSONB, defaultValue: [] },
  aiScore:       { type: DataTypes.JSONB, defaultValue: null },   // AI assignment scores
  aiCategory:    { type: DataTypes.STRING(50) },                  // AI-detected category
  aiConfidence:  { type: DataTypes.FLOAT },                       // 0-1
  satisfactionScore: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
  clientId:      { type: DataTypes.UUID, allowNull: false },
  projectId:     { type: DataTypes.UUID },
  assignedToId:  { type: DataTypes.UUID },
  createdById:   { type: DataTypes.UUID },
}, { tableName: 'tickets' });

// ═══════════════════════════════════════
// TICKET COMMENT
// ═══════════════════════════════════════
const TicketComment = sequelize.define('TicketComment', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  content:  { type: DataTypes.TEXT, allowNull: false },
  isInternal: { type: DataTypes.BOOLEAN, defaultValue: false },
  ticketId: { type: DataTypes.UUID, allowNull: false },
  userId:   { type: DataTypes.UUID, allowNull: false },
  attachments: { type: DataTypes.JSONB, defaultValue: [] },
}, { tableName: 'ticket_comments' });

// ═══════════════════════════════════════
// TICKET HISTORY (Audit Log)
// ═══════════════════════════════════════
const TicketHistory = sequelize.define('TicketHistory', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ticketId:  { type: DataTypes.UUID, allowNull: false },
  userId:    { type: DataTypes.UUID },
  action:    { type: DataTypes.STRING(50), allowNull: false },
  fieldName: { type: DataTypes.STRING(50) },
  oldValue:  { type: DataTypes.TEXT },
  newValue:  { type: DataTypes.TEXT },
  metadata:  { type: DataTypes.JSONB, defaultValue: {} },
}, { tableName: 'ticket_history', paranoid: false });

// ═══════════════════════════════════════
// PROJECT_TECHNICIANS (junction)
// ═══════════════════════════════════════
const ProjectTechnician = sequelize.define('ProjectTechnician', {
  projectId: { type: DataTypes.UUID, allowNull: false },
  userId:    { type: DataTypes.UUID, allowNull: false },
  role:      { type: DataTypes.STRING(50), defaultValue: 'member' },
}, { tableName: 'project_technicians' });

// ═══════════════════════════════════════
// ASSOCIATIONS
// ═══════════════════════════════════════
Client.hasMany(Project,       { foreignKey: 'clientId', as: 'projects' });
Project.belongsTo(Client,     { foreignKey: 'clientId', as: 'client' });

Client.hasMany(Ticket,        { foreignKey: 'clientId', as: 'tickets' });
Ticket.belongsTo(Client,      { foreignKey: 'clientId', as: 'client' });

Project.hasMany(Ticket,       { foreignKey: 'projectId', as: 'tickets' });
Ticket.belongsTo(Project,     { foreignKey: 'projectId', as: 'project' });

User.hasMany(Ticket,          { foreignKey: 'assignedToId', as: 'assignedTickets' });
Ticket.belongsTo(User,        { foreignKey: 'assignedToId', as: 'assignedTo' });

User.hasMany(Ticket,          { foreignKey: 'createdById', as: 'createdTickets' });
Ticket.belongsTo(User,        { foreignKey: 'createdById', as: 'createdBy' });

Ticket.hasMany(TicketComment, { foreignKey: 'ticketId', as: 'comments' });
TicketComment.belongsTo(Ticket,{ foreignKey: 'ticketId', as: 'ticket' });
TicketComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Ticket.hasMany(TicketHistory, { foreignKey: 'ticketId', as: 'history' });
TicketHistory.belongsTo(Ticket,{ foreignKey: 'ticketId', as: 'ticket' });
TicketHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.belongsToMany(User,   { through: ProjectTechnician, as: 'technicians', foreignKey: 'projectId' });
User.belongsToMany(Project,   { through: ProjectTechnician, as: 'projects', foreignKey: 'userId' });

module.exports = {
  User, Client, Project, Ticket,
  TicketComment, TicketHistory, ProjectTechnician,
};
