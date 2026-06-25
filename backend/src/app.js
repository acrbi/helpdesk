const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes       = require('./routes/auth.routes');
const ticketRoutes     = require('./routes/ticket.routes');
const clientRoutes     = require('./routes/client.routes');
const projectRoutes    = require('./routes/project.routes');
const technicianRoutes = require('./routes/technician.routes');
const reportRoutes     = require('./routes/report.routes');
const aiRoutes         = require('./routes/ai.routes');

const { errorHandler } = require('./middleware/error.middleware');
const { notFound }     = require('./middleware/notFound.middleware');

const app = express();

// ─── Security ─────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// ─── Rate Limiting ─────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: 'Demasiadas solicitudes. Intente en 15 minutos.' },
});
app.use('/api/', limiter);

// ─── General Middleware ────────────────────
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check ──────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: process.env.npm_package_version || '1.0.0',
}));

// ─── API Routes ────────────────────────────
const v1 = '/api/v1';
app.use(`${v1}/auth`,        authRoutes);
app.use(`${v1}/tickets`,     ticketRoutes);
app.use(`${v1}/clients`,     clientRoutes);
app.use(`${v1}/projects`,    projectRoutes);
app.use(`${v1}/technicians`, technicianRoutes);
app.use(`${v1}/reports`,     reportRoutes);
app.use(`${v1}/ai`,          aiRoutes);

// ─── Error Handlers ────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
