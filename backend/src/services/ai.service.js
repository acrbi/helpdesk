/**
 * AI Auto-Assignment Service
 * Analiza tickets y asigna automáticamente al técnico más adecuado
 * Score = 60% habilidades + 30% carga + 10% disponibilidad
 */

const { User, Ticket } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// ─── Keyword → Skill mapping ─────────────────────────────────────────────────
const SKILL_KEYWORD_MAP = {
  network:   ['red', 'vpn', 'conexión', 'ip', 'ping', 'switch', 'router', 'dns', 'dhcp', 'latencia', 'bandwidth', 'ethernet', 'wifi', 'inalámbrico', 'tcp', 'firewall'],
  hardware:  ['hardware', 'impresora', 'disco', 'memoria', 'pantalla', 'teclado', 'mouse', 'cpu', 'temperatura', 'físico', 'periférico', 'monitor', 'ups', 'batería'],
  software:  ['software', 'error', 'aplicación', 'app', 'instalar', 'actualizar', 'parche', 'bug', 'crash', 'lento', 'cuelga', 'falla', 'excepción', 'licencia'],
  database:  ['base de datos', 'query', 'sql', 'tabla', 'índice', 'lento', 'timeout', 'postgresql', 'mysql', 'oracle', 'mongodb', 'backup', 'restore', 'stored'],
  servers:   ['servidor', 'server', 'linux', 'apache', 'nginx', 'caída', 'reiniciar', 'servicio', 'proceso', 'ram', 'cpu', 'disco', 'espacio', 'log', 'daemon'],
  security:  ['seguridad', 'firewall', 'antivirus', 'acceso', 'contraseña', 'phishing', 'certificado', 'ssl', 'tls', 'intrusión', 'vulnerabilidad', 'ransomware', 'malware'],
  windows:   ['windows', 'active directory', 'ad', 'dominio', 'gpo', 'grupo', 'permisos', 'outlook', 'exchange', 'office', 'azure ad', 'directiva'],
  cloud:     ['cloud', 'aws', 'azure', 'gcp', 'nube', 'storage', 'blob', 's3', 'instancia', 'escalado', 'kubernetes', 'docker', 'container'],
  api:       ['api', 'endpoint', 'request', 'webhook', 'json', 'rest', 'http', 'token', 'autenticación', 'oauth', 'jwt', 'microservicio'],
  web:       ['web', 'html', 'css', 'página', 'portal', 'sitio', 'navegador', 'frontend', 'javascript', 'react', 'angular', 'cargando'],
};

// ─── Category auto-detection ──────────────────────────────────────────────────
function detectCategory(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  let best = { category: 'other', score: 0 };

  for (const [cat, keywords] of Object.entries(SKILL_KEYWORD_MAP)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > best.score) best = { category: cat, score };
  }
  const confidence = Math.min(1, best.score / 4);
  return { category: best.category, confidence };
}

// ─── Score a single technician ────────────────────────────────────────────────
async function scoreTechnician(tech, ticketText, category) {
  const text = ticketText.toLowerCase();

  // 1. Skill score (60%)
  const techSkills = (tech.skills || []).map(s => s.toLowerCase());
  let skillScore = 0;
  for (const skill of techSkills) {
    const keywords = SKILL_KEYWORD_MAP[skill] || [skill];
    const hits = keywords.filter(kw => text.includes(kw)).length;
    skillScore += hits * 15;
    if (skill === category) skillScore += 25; // exact category match bonus
  }
  skillScore = Math.min(100, skillScore);

  // 2. Load score (30%) — fewer active tickets = higher score
  const activeTickets = await Ticket.count({
    where: {
      assignedToId: tech.id,
      status: { [Op.in]: ['open', 'assigned', 'in_progress', 'pending'] },
    },
  });
  const loadScore = Math.max(0, 100 - activeTickets * 15);

  // 3. Availability score (10%)
  const availScore = tech.isActive ? 100 : 0;

  const total = Math.round(skillScore * 0.6 + loadScore * 0.3 + availScore * 0.1);

  return {
    technicianId:   tech.id,
    technicianName: tech.name,
    role:           tech.role,
    skills:         tech.skills,
    activeLoad:     activeTickets,
    scores: {
      skill:        skillScore,
      load:         loadScore,
      availability: availScore,
      total,
    },
  };
}

// ─── Main: rank all available technicians ─────────────────────────────────────
async function rankTechnicians(title, description, categoryOverride = null) {
  const { category, confidence } = detectCategory(title, description);
  const effectiveCategory = categoryOverride || category;
  const fullText = `${title} ${description}`;

  const technicians = await User.findAll({
    where: { role: 'technician', isActive: true },
    attributes: ['id', 'name', 'email', 'role', 'skills', 'isActive'],
  });

  if (!technicians.length) {
    logger.warn('No hay técnicos disponibles para asignación');
    return { rankings: [], detectedCategory: effectiveCategory, confidence };
  }

  const rankings = await Promise.all(
    technicians.map(t => scoreTechnician(t, fullText, effectiveCategory))
  );

  rankings.sort((a, b) => b.scores.total - a.scores.total);

  logger.info(`AI Assignment: category=${effectiveCategory} confidence=${confidence.toFixed(2)} top=${rankings[0]?.technicianName}`);

  return {
    rankings,
    detectedCategory: effectiveCategory,
    confidence,
    recommended: rankings[0] || null,
  };
}

// ─── Auto-assign a ticket (side-effect: updates DB) ──────────────────────────
async function autoAssign(ticket) {
  const result = await rankTechnicians(ticket.title, ticket.description, ticket.category);

  if (!result.recommended) return null;

  const top = result.recommended;
  await ticket.update({
    assignedToId: top.technicianId,
    status:       'assigned',
    aiScore:      result.rankings.slice(0, 3),
    aiCategory:   result.detectedCategory,
    aiConfidence: result.confidence,
  });

  return result;
}

module.exports = { rankTechnicians, autoAssign, detectCategory };
