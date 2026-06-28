<div align="center">

<img src="https://img.shields.io/badge/HelpDesk_Pro-v1.0.0-1A56DB?style=for-the-badge&logo=headset&logoColor=white" alt="HelpDesk Pro">

# 🎧 HelpDesk Pro
### Sistema de Mesa de Ayuda ITIL v4 con Auto-Asignación por Inteligencia Artificial

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)](/.github/workflows)

**Plataforma completa de gestión de incidencias con motor IA que auto-asigna tickets al técnico más adecuado, optimizando tiempos de respuesta y cumplimiento de SLAs.**

 · [Reportar bug](../../issues) · [Solicitar feature](../../issues)

---

</div>

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Stack Tecnológico](#-stack-tecnológico)
- [Motor de Auto-Asignación IA](#-motor-de-auto-asignación-ia)
- [Flujo de Trabajo ITIL v4](#-flujo-de-trabajo-itil-v4)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Variables de Entorno](#-variables-de-entorno)
- [API REST — Endpoints](#-api-rest--endpoints)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Roadmap](#-roadmap)
- [Para Evaluadores (Workana)](#-para-evaluadores-workana)
- [Licencia](#-licencia)

---

## 🎯 Descripción del Proyecto

**HelpDesk Pro** es una solución empresarial de gestión de mesa de ayuda diseñada bajo los principios de **ITIL v4** e **ISO 20000**. Su característica diferencial es el **Motor de Auto-Asignación por IA** que analiza semánticamente cada ticket y determina automáticamente qué técnico del equipo debe atenderlo, basándose en:

- Coincidencia de habilidades técnicas con el problema reportado
- Carga de trabajo actual de cada técnico
- Disponibilidad y rendimiento histórico

El sistema permite gestionar el ciclo de vida completo de una incidencia: desde la recepción multi-canal hasta el cierre y retroalimentación del cliente, con trazabilidad completa y notificaciones en tiempo real vía WebSockets.

### ¿Para quién es?

| Perfil | Uso principal |
|--------|---------------|
| **Empresas de TI / MSPs** | Gestión centralizada de soporte a múltiples clientes |
| **Departamentos IT internos** | Mesa de ayuda interna con SLAs por área |
| **Municipalidades y gobierno** | Atención ciudadana y gestión de incidencias de sistemas |
| **Integradores de sistemas** | Seguimiento de proyectos de implementación |

---

## ✨ Características Principales

### 🤖 Auto-Asignación por IA
- Análisis semántico del título y descripción del ticket
- Detección automática de categoría técnica (red, hardware, software, seguridad, etc.)
- Ranking de técnicos con score de compatibilidad visible
- Posibilidad de sobrescribir asignación manualmente
- Registro del proceso de decisión para auditoría

### 🎫 Gestión de Tickets
- Creación con campos ITIL: impacto, urgencia, prioridad, categoría
- Cálculo automático de SLA según plan del cliente y prioridad
- Historial completo de cambios y comentarios
- Adjuntos y evidencias
- Vista Kanban y lista con filtros avanzados

### 👥 Gestión de Equipos Técnicos
- Perfiles con habilidades técnicas etiquetadas
- Dashboard de carga de trabajo en tiempo real
- Métricas individuales de rendimiento
- Configuración por roles: Admin, Manager, Técnico

### 🏢 Gestión de Clientes y Proyectos
- CRM básico integrado con historial de incidencias
- Proyectos multi-técnico con avance y presupuesto
- SLAs personalizados por cliente y plan de servicio
- Seguimiento de tickets por proyecto

### 📊 Reportes y KPIs
- Tiempo promedio de primera respuesta
- Tasa de cumplimiento de SLAs
- Satisfacción del cliente (CSAT)
- Precisión de asignación por IA
- Exportación CSV/PDF

### 🔔 Tiempo Real
- Notificaciones push vía Socket.IO
- Actualizaciones de estado sin recarga de página
- Alertas de SLA próximos a vencer

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                         │
│              React 18 + Zustand + React Query                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / WSS
                    ┌───────▼────────┐
                    │   Nginx Proxy  │
                    └───────┬────────┘
              ┌─────────────┴──────────────┐
        ┌─────▼──────┐              ┌──────▼─────┐
        │  REST API  │              │ Socket.IO  │
        │ Express.js │              │  Real-time │
        └─────┬──────┘              └──────┬─────┘
              │                           │
        ┌─────▼──────────────────────────▼─────┐
        │              Business Logic           │
        │   Auth · Tickets · AI Engine · SLA   │
        └─────┬──────────────────┬─────────────┘
        ┌─────▼──────┐    ┌──────▼──────┐
        │ PostgreSQL │    │    Redis    │
        │  (Sequelize│    │  (Cache +   │
        │     ORM)   │    │  Sessions)  │
        └────────────┘    └─────────────┘
```

### Diagrama de Base de Datos

```
users ──────────────────────────────────────────────────────────
 id, name, email, password, role, skills[], isActive, lastLogin

clients ───────────────────────────────────────────────────────
 id, name, email, phone, plan, slaPriority{}, isActive

projects ──────────────────────────────────────────────────────
 id, name, status, progress, deadline, budget, clientId → clients

tickets ───────────────────────────────────────────────────────
 id, ticketNumber, title, description, status, priority,
 category, slaDeadline, slaBreached, aiScore{}, aiCategory,
 aiConfidence, clientId → clients, projectId → projects,
 assignedToId → users, createdById → users

ticket_comments ───────────────────────────────────────────────
 id, content, isInternal, ticketId → tickets, userId → users

ticket_history ────────────────────────────────────────────────
 id, action, fieldName, oldValue, newValue, metadata{},
 ticketId → tickets, userId → users

project_technicians ───────────────────────────────────────────
 projectId → projects, userId → users, role
```

---

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Node.js** | 20.x LTS | Runtime |
| **Express.js** | 4.x | Framework HTTP |
| **PostgreSQL** | 16 | Base de datos principal |
| **Sequelize** | 6.x | ORM con soporte paranoid (soft delete) |
| **Socket.IO** | 4.x | WebSockets para tiempo real |
| **JWT** | 9.x | Autenticación stateless |
| **bcryptjs** | 2.x | Hash de contraseñas |
| **Winston** | 3.x | Logging estructurado |
| **express-validator** | 7.x | Validación de inputs |

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **React** | 18.x | UI Framework |
| **React Router** | 6.x | Enrutamiento SPA |
| **Zustand** | 4.x | Estado global |
| **React Query** | 3.x | Cache y sincronización de servidor |
| **Axios** | 1.x | Cliente HTTP con interceptores |
| **Recharts** | 2.x | Gráficas y visualizaciones |
| **Tailwind CSS** | 3.x | Utilidades CSS |
| **Lucide React** | - | Iconografía |
| **React Hook Form** | 7.x | Formularios con validación |

### DevOps
| Herramienta | Uso |
|------------|-----|
| **Docker + Compose** | Contenerización y orquestación local |
| **GitHub Actions** | CI/CD automatizado |
| **Nginx** | Reverse proxy y serving de estáticos |

---

## 🤖 Motor de Auto-Asignación IA

El motor analiza cada ticket mediante tres factores ponderados:

```
Score Final = (Skill Score × 0.60) + (Load Score × 0.30) + (Availability × 0.10)
```

### 1. Skill Score (60%) — Coincidencia de habilidades
```javascript
// Para cada habilidad del técnico, se buscan keywords en el texto del ticket
// Ejemplo: técnico con habilidad "database" busca:
// ['base de datos', 'query', 'sql', 'tabla', 'índice', 'timeout', 'postgresql'...]
// Cada coincidencia suma +15 puntos; coincidencia exacta de categoría suma +25
```

### 2. Load Score (30%) — Carga de trabajo actual
```javascript
// Técnico con 0 tickets activos → 100 puntos
// Cada ticket activo resta 15 puntos
loadScore = Math.max(0, 100 - activeTickets * 15)
```

### 3. Availability Score (10%) — Disponibilidad
```javascript
// Técnico activo → 100 pts | Inactivo → 0 pts
// (Se puede extender con turnos y calendario)
```

### Ejemplo de respuesta del motor
```json
{
  "rankings": [
    {
      "technicianId": "uuid-xxx",
      "technicianName": "Carlos Vera",
      "role": "Soporte L2",
      "skills": ["database", "servers"],
      "activeLoad": 1,
      "scores": { "skill": 85, "load": 85, "availability": 100, "total": 87 }
    }
  ],
  "detectedCategory": "database",
  "confidence": 0.85,
  "recommended": { ... }
}
```

---

## 🔄 Flujo de Trabajo ITIL v4

```
CLIENTE reporta
      │
      ▼
RECEPCIÓN (Portal / Email / Teléfono)
      │
      ▼
CLASIFICACIÓN
  ├─ Prioridad: Crítica (2h SLA) / Alta (4h) / Media (8h) / Baja (24h)
  ├─ Categoría: Red / Hardware / Software / BD / Servidores / Seguridad
  └─ Impacto + Urgencia → Prioridad final
      │
      ▼
MOTOR IA AUTO-ASIGNACIÓN ──→ Score ranking de técnicos
      │
      ▼
TÉCNICO ASIGNADO ──→ Notificación push
      │
      ├──→ SOPORTE L1: Incidentes básicos / rutinarios
      │         │
      │         ▼
      │    DIAGNÓSTICO → RESOLUCIÓN → CIERRE
      │
      └──→ SOPORTE L2/L3: Problemas complejos / escalamientos
                │
                ▼ (si SLA en riesgo)
           ALERTA SLA ──→ Escalamiento automático
                │
                ▼
           RESOLUCIÓN
                │
                ▼
           CONFIRMACIÓN CLIENTE
                │
                ▼
           CIERRE + DOCUMENTACIÓN CMDB
                │
                ▼
           RETROALIMENTACIÓN → Base de Conocimiento
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** 20.x o superior → [nodejs.org](https://nodejs.org)
- **PostgreSQL** 15+ → [postgresql.org](https://postgresql.org) o usar Docker
- **npm** 9+ o **pnpm** (incluido con Node.js)
- **Git**

### Opción A — Con Docker (recomendado) 🐳

```bash
# 1. Clonar repositorio
git clone https://github.com/TU_USUARIO/helpdesk-pro.git
cd helpdesk-pro

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores

# 3. Levantar todos los servicios
docker compose up -d

# 4. Ejecutar seed de datos demo
docker compose exec backend node scripts/seed.js

# 5. Abrir en navegador
open http://localhost:3000
```

### Opción B — Instalación Local

```bash
# ─── BACKEND ─────────────────────────────────────────────
cd backend
npm install
cp .env.example .env
# Editar .env con tu configuración de PostgreSQL

# Crear base de datos
psql -U postgres -c "CREATE DATABASE helpdesk_pro;"

# Sincronizar modelos y cargar datos demo
npm run seed

# Iniciar en modo desarrollo
npm run dev
# → API disponible en http://localhost:4000

# ─── FRONTEND (nueva terminal) ───────────────────────────
cd frontend
npm install
cp .env.example .env.local
# Verificar que VITE_API_URL=http://localhost:4000/api/v1

npm run dev
# → App disponible en http://localhost:3000
```

### Credenciales de acceso (datos demo)

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Administrador** | `admin@helpdesk.pe` | `Admin123!` |
| **Técnico L1** | `ana@helpdesk.pe` | `Tech123!` |
| **Técnico L2** | `carlos@helpdesk.pe` | `Tech123!` |
| **Desarrolladora** | `maria@helpdesk.pe` | `Tech123!` |

---

## 🔧 Variables de Entorno

### Backend (`backend/.env`)

```env
# Servidor
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=helpdesk_pro
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_LOGGING=false

# JWT — CAMBIAR EN PRODUCCIÓN
JWT_SECRET=cadena_aleatoria_minimo_32_caracteres
JWT_REFRESH=otra_cadena_aleatoria_diferente
JWT_EXPIRES=8h

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_app_password
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

---

## 📡 API REST — Endpoints

> Base URL: `http://localhost:4000/api/v1`
> Todos los endpoints requieren header: `Authorization: Bearer <token>`

### Autenticación
```
POST   /auth/login          Iniciar sesión
POST   /auth/register       Registrar usuario
POST   /auth/refresh        Renovar token
POST   /auth/logout         Cerrar sesión
GET    /auth/me             Usuario actual
```

### Tickets
```
GET    /tickets             Listar tickets (paginado, filtros)
POST   /tickets             Crear ticket + auto-asignación IA
GET    /tickets/:id         Detalle completo con historial
PUT    /tickets/:id         Actualizar ticket
DELETE /tickets/:id         Eliminar (soft delete)
POST   /tickets/:id/comments   Agregar comentario
POST   /tickets/ai/analyze     Analizar ticket sin crear
```

### Clientes
```
GET    /clients             Listar clientes
POST   /clients             Crear cliente
GET    /clients/:id         Detalle + proyectos + tickets
PUT    /clients/:id         Actualizar
DELETE /clients/:id         Eliminar
```

### Proyectos
```
GET    /projects            Listar proyectos
POST   /projects            Crear proyecto
GET    /projects/:id        Detalle + técnicos + tickets
PUT    /projects/:id        Actualizar + reasignar técnicos
```

### Técnicos
```
GET    /technicians         Listar técnicos con carga actual
GET    /technicians/:id     Detalle
PUT    /technicians/:id     Actualizar perfil y habilidades
```

### Reportes
```
GET    /reports/summary                KPIs generales
GET    /reports/technician-performance Métricas por técnico
```

### Motor IA
```
POST   /ai/analyze          Rankear técnicos para un ticket
POST   /ai/detect-category  Detectar categoría automáticamente
```

### Ejemplo de petición
```bash
# Crear ticket con auto-asignación IA
curl -X POST http://localhost:4000/api/v1/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Servidor de base de datos muy lento en producción",
    "description": "Las queries SQL tardan más de 30 segundos. Afecta a 50 usuarios.",
    "priority": "high",
    "clientId": "uuid-del-cliente",
    "autoAssignAI": true
  }'

# Respuesta incluye el ticket creado + ranking de técnicos del motor IA
```

---

## 📁 Estructura del Proyecto

```
helpdesk-pro/
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── app.js                    # Express app config
│   │   ├── index.js                  # Entry point + server
│   │   ├── 📁 config/
│   │   │   └── database.js           # Sequelize + PostgreSQL
│   │   ├── 📁 controllers/
│   │   │   ├── auth.controller.js    # Login, register, JWT
│   │   │   └── ticket.controller.js  # CRUD + AI trigger
│   │   ├── 📁 models/
│   │   │   └── index.js              # User, Client, Project, Ticket...
│   │   ├── 📁 routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── ticket.routes.js
│   │   │   ├── client.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── technician.routes.js
│   │   │   ├── report.routes.js
│   │   │   └── ai.routes.js
│   │   ├── 📁 services/
│   │   │   ├── ai.service.js         # 🤖 Motor de auto-asignación
│   │   │   └── socket.service.js     # WebSocket events
│   │   ├── 📁 middleware/
│   │   │   ├── auth.middleware.js    # JWT verify + role check
│   │   │   ├── error.middleware.js   # Error handler global
│   │   │   ├── validate.middleware.js
│   │   │   └── notFound.middleware.js
│   │   └── 📁 utils/
│   │       └── logger.js             # Winston logger
│   ├── 📁 scripts/
│   │   └── seed.js                   # Datos de demostración
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── App.jsx                   # Router + QueryClient
│   │   ├── main.jsx                  # React entry point
│   │   ├── 📁 pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TicketsPage.jsx
│   │   │   ├── NewTicketPage.jsx     # Formulario + panel IA
│   │   │   ├── ClientsPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── TeamPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   └── FlowPage.jsx          # Diagrama ITIL
│   │   ├── 📁 components/
│   │   │   └── common/
│   │   │       └── AppLayout.jsx     # Sidebar + Topbar
│   │   ├── 📁 services/
│   │   │   └── api.js                # Axios + todos los endpoints
│   │   ├── 📁 store/
│   │   │   └── index.js              # Zustand stores
│   │   └── 📁 styles/
│   │       └── globals.css
│   ├── Dockerfile
│   └── package.json
│
├── 📁 docker/
│   └── nginx.conf
├── 📁 docs/
│   ├── API.md
│   └── DEPLOYMENT.md
├── 📁 .github/
│   └── workflows/
│       └── ci-cd.yml                 # GitHub Actions pipeline
├── docker-compose.yml
├── .gitignore
└── README.md                         ← este archivo
```

---

## 📜 Scripts Disponibles

```bash
# ── Backend ──────────────────────────────────────────────
npm run dev          # Servidor con hot-reload (nodemon)
npm start            # Servidor producción
npm test             # Jest con coverage
npm run seed         # Poblar DB con datos demo

# ── Frontend ─────────────────────────────────────────────
npm run dev          # Vite dev server (HMR)
npm run build        # Build optimizado para producción
npm run preview      # Previsualizar build

# ── Docker ───────────────────────────────────────────────
docker compose up -d              # Levantar todo en background
docker compose logs -f backend    # Ver logs del backend
docker compose down               # Detener servicios
docker compose exec backend node scripts/seed.js  # Seed
```

---

## 🗺️ Roadmap

### v1.1 (Próximo)
- [ ] Módulo de base de conocimiento (KB) vinculado a resoluciones
- [ ] Notificaciones por email automáticas en cambios de estado
- [ ] Dashboard de SLA con alertas preventivas (X% del tiempo)
- [ ] API para portal de autoservicio del cliente

### v1.2
- [ ] Integración con Microsoft Teams / Slack para notificaciones
- [ ] Módulo de cambios y liberaciones (ITIL Change Management)
- [ ] App móvil React Native para técnicos
- [ ] Exportación de reportes en PDF y Excel

### v2.0
- [ ] Motor IA mejorado con modelo de ML entrenado con histórico
- [ ] Predicción de tiempo de resolución
- [ ] Chatbot de primer contacto con resolución automática
- [ ] Multi-tenant con subdominios por empresa

---

## 💼 Para Evaluadores (Workana)

### Lo que encontrarás en este repositorio

Este proyecto demuestra competencia en el **stack completo MERN/PERN** y buenas prácticas de ingeniería de software:

| Aspecto | Implementación |
|---------|---------------|
| **Arquitectura** | MVC en backend, separación clara de capas |
| **Base de datos** | Modelado relacional con Sequelize ORM, soft delete, paranoid |
| **Seguridad** | JWT + refresh tokens, bcrypt, helmet, rate limiting, CORS |
| **Validación** | express-validator en cada endpoint |
| **Tiempo real** | Socket.IO con autenticación |
| **Código limpio** | Funciones pequeñas, nombres descriptivos, sin código muerto |
| **Escalabilidad** | Docker, variables de entorno, configuración por ambiente |
| **Testing** | Estructura para Jest + Supertest lista |
| **CI/CD** | GitHub Actions con build, test y deploy automatizado |
| **Documentación** | README completo, .env.example, seed de datos |

### Módulos funcionales incluidos

✅ Autenticación JWT completa  
✅ CRUD completo de Tickets, Clientes, Proyectos, Técnicos  
✅ Motor de auto-asignación por IA (sin dependencias externas)  
✅ WebSockets para notificaciones en tiempo real  
✅ Soft delete (paranoid) en todos los modelos  
✅ Historial de auditoría en tickets  
✅ Cálculo automático de SLA  
✅ Reportes y métricas de rendimiento  
✅ Docker Compose con todos los servicios  
✅ Pipeline CI/CD completo  

### Tecnologías principales solicitadas

`Node.js` `Express` `PostgreSQL` `Sequelize` `React` `Zustand` `Axios` `Socket.IO` `JWT` `Docker` `GitHub Actions` `ITIL v4`

---

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver [`LICENSE`](LICENSE) para más información.

---

<div align="center">

**Desarrollado con ❤️ para el mercado peruano y latinoamericano**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Contactar-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com)
[![Workana](https://img.shields.io/badge/Workana-Perfil-00B0FF?style=flat-square)](https://workana.com)

*HelpDesk Pro © 2025 — Sistema de Mesa de Ayuda ITIL v4 con IA*

</div>
