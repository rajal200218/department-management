const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase, getDbMode } = require('./db/database');

const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const programRoutes = require('./routes/programRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const studentRoutes = require('./routes/studentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const examRoutes = require('./routes/examRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-User-Dept', 'X-User-Email', 'X-User-Id', 'Accept', 'Origin']
}));
app.options('*', cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`\x1b[32m[API Request]\x1b[0m ${req.method} ${req.originalUrl}`);
  next();
});

// Authentication Middleware
const { authenticate } = require('./middleware/authMiddleware');
app.use(authenticate);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/assignments', assignmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    university: 'LJ University',
    module: 'LJ University ERP - Phase 2 Module 12: Department Management',
    dbMode: getDbMode(),
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const { isSmtpConfigured } = require('./services/emailService');

// Start Server
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    const smtpReady = isSmtpConfigured();
    console.log(`
===========================================================
🏛️  LJ UNIVERSITY ERP - DEPARTMENT MANAGEMENT
🚀  Backend Server running at: http://localhost:${PORT}
📡  Health check: http://localhost:${PORT}/api/health
📊  Database Engine: ${getDbMode()} (${process.env.PGDATABASE || 'lj_department_db'})
✉️   Email Service (SMTP): ${smtpReady ? 'Active (Live Transporter)' : 'Development Mode (Console Fallback)'}
===========================================================
    `);
    if (!smtpReady && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  [Production Warning] SMTP_HOST/SMTP_USER is not configured. Outgoing emails will fallback to local console logs.');
    }
  });
}

startServer();
