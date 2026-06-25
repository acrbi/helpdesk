const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No autorizado'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET || 'helpdesk_secret_change_in_prod');
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket conectado: ${socket.id} (user: ${socket.user?.id})`);
    socket.join(`user:${socket.user?.id}`);  // personal room

    socket.on('join:ticket', (ticketId) => socket.join(`ticket:${ticketId}`));
    socket.on('leave:ticket', (ticketId) => socket.leave(`ticket:${ticketId}`));

    socket.on('disconnect', () => logger.info(`Socket desconectado: ${socket.id}`));
  });

  logger.info('🔌 Socket.IO inicializado');
  return io;
}

function notifyAssignment(ticketId, technicianId, aiResult) {
  if (!io) return;
  // Notify the assigned technician
  io.to(`user:${technicianId}`).emit('ticket:assigned', { ticketId, aiResult });
  // Notify admins (room 'admins')
  io.to('admins').emit('ticket:auto_assigned', { ticketId, technicianId, aiResult });
  logger.info(`Socket: ticket ${ticketId} asignado a técnico ${technicianId}`);
}

function notifyTicketUpdate(ticketId, event, data) {
  if (!io) return;
  io.to(`ticket:${ticketId}`).emit(`ticket:${event}`, data);
}

function notifyAll(event, data) {
  if (!io) return;
  io.emit(event, data);
}

module.exports = { initSocket, notifyAssignment, notifyTicketUpdate, notifyAll };
