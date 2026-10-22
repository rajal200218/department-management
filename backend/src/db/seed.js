/**
 * =========================================================================
 * LJ UNIVERSITY ERP - PHASE 2 MODULE 12: DEPARTMENT MANAGEMENT SYSTEM
 * Dedicated Portable & Idempotent Database Seeding Script
 * =========================================================================
 * 
 * This file contains ALL seeding logic, schema integrity checks, and realistic
 * academic sample data in ONE self-contained, portable file.
 * 
 * Features:
 * - 100% Self-contained: No reliance on external SQL files.
 * - Single Command: npm run seed
 * - Fully Idempotent: Can be run multiple times safely without duplicate
 *   records or unintentional overwriting of existing data (ON CONFLICT DO NOTHING).
 * - Portable: Automatically detects PostgreSQL configuration from environment
 *   (supports both individual PG* variables and cloud DATABASE_URL).
 * - Relationship Integrity: Correctly links Schools -> Departments -> Faculty ->
 *   Programs -> Students -> Subjects -> Attendance/Timetables/Exams/Assignments.
 * - Sequence Synchronization: Synchronizes all PostgreSQL sequence counters
 *   to ensure seamless subsequent inserts from the web UI.
 * =========================================================================
 */

const { Client, Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables (.env from backend directory or fallback to current dir)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

// Default password hash for seed accounts (bcrypt hash for 'admin123')
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);

// Database connection config builder
function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
    };
  }

  const isSsl = process.env.PGSSL === 'true' || process.env.DATABASE_SSL === 'true';
  return {
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT, 10) || 5432,
    database: process.env.PGDATABASE || 'lj_department_db',
    ssl: isSsl ? { rejectUnauthorized: false } : false
  };
}

// ---------------------------------------------------------------------------
// 1. EMBEDDED DDL SCHEMA DEFINITIONS (Preserves existing data via IF NOT EXISTS)
// ---------------------------------------------------------------------------
const SCHEMA_DDL = `
-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ACADEMIC SESSIONS TABLE
CREATE TABLE IF NOT EXISTS academic_sessions (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(50) UNIQUE NOT NULL,
    term VARCHAR(100) DEFAULT 'Fall & Spring (Full Year)',
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Active',
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SCHOOLS TABLE
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    school_name VARCHAR(150) NOT NULL,
    school_code VARCHAR(50) UNIQUE NOT NULL,
    dean_name VARCHAR(100),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(20),
    building VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    hod_id INTEGER,
    email VARCHAR(150),
    phone VARCHAR(50),
    established_year INTEGER,
    faculty_count INTEGER DEFAULT 0,
    building VARCHAR(100),
    room_no VARCHAR(50),
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. FACULTY TABLE
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(50),
    designation VARCHAR(100) NOT NULL,
    qualification VARCHAR(150),
    specialization VARCHAR(150),
    joining_date DATE,
    experience_years INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure password column exists on faculty
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 6. PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    program_name VARCHAR(150) NOT NULL,
    program_code VARCHAR(50) UNIQUE NOT NULL,
    degree_level VARCHAR(50) NOT NULL,
    intake_capacity INTEGER DEFAULT 60,
    duration_years INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PASSWORD RESETS TABLE
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    reset_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    enrollment_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT 'admin123',
    phone VARCHAR(50),
    gender VARCHAR(20),
    dob DATE,
    address TEXT,
    admission_year INTEGER DEFAULT 2024,
    current_semester INTEGER DEFAULT 1,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
    avatar_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    subject_name VARCHAR(150) NOT NULL,
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
    semester INTEGER NOT NULL DEFAULT 1,
    credits INTEGER NOT NULL DEFAULT 3,
    type VARCHAR(50) DEFAULT 'Theory',
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Present',
    marked_by INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_subject_date UNIQUE(student_id, subject_id, date)
);

-- 11. TIMETABLES TABLE
CREATE TABLE IF NOT EXISTS timetables (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
    semester INTEGER NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    classroom VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. NOTICES TABLE
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    target_role VARCHAR(50) DEFAULT 'All',
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    publish_date DATE DEFAULT CURRENT_DATE,
    priority VARCHAR(20) DEFAULT 'Normal',
    posted_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    exam_name VARCHAR(150) NOT NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    classroom VARCHAR(50),
    max_marks INTEGER DEFAULT 100,
    passing_marks INTEGER DEFAULT 40,
    status VARCHAR(20) DEFAULT 'Scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. EXAM RESULTS TABLE
CREATE TABLE IF NOT EXISTS exam_results (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5, 2) NOT NULL,
    grade VARCHAR(10),
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_student UNIQUE(exam_id, student_id)
);

-- 15. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    due_date DATE NOT NULL,
    max_marks INTEGER DEFAULT 50,
    created_by INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. ASSIGNMENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    submission_content TEXT,
    submission_text TEXT,
    submission_file_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Submitted',
    marks_obtained NUMERIC(5, 2),
    feedback TEXT,
    CONSTRAINT uq_assignment_student UNIQUE(assignment_id, student_id)
);

-- Ensure columns exist in assignment_submissions
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS submission_text TEXT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS submission_file_url TEXT;

-- PERFORMANCE & IDEMPOTENCY INDEXES
CREATE INDEX IF NOT EXISTS idx_academic_sessions_status ON academic_sessions(status);
CREATE INDEX IF NOT EXISTS idx_departments_school_id ON departments(school_id);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);
CREATE INDEX IF NOT EXISTS idx_faculty_department_id ON faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_faculty_joining_date ON faculty(joining_date);
CREATE INDEX IF NOT EXISTS idx_programs_department_id ON programs(department_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_no);
CREATE INDEX IF NOT EXISTS idx_subjects_dept ON subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_faculty ON subjects(faculty_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject ON attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_timetables_dept ON timetables(department_id);
CREATE INDEX IF NOT EXISTS idx_timetables_faculty ON timetables(faculty_id);
CREATE INDEX IF NOT EXISTS idx_timetables_day ON timetables(day_of_week);
CREATE INDEX IF NOT EXISTS idx_notices_dept ON notices(department_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON assignments(subject_id);

-- Idempotency helper unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_timetables_slot ON timetables (department_id, semester, day_of_week, time_slot, classroom);
CREATE UNIQUE INDEX IF NOT EXISTS uq_notices_title_date ON notices (title, publish_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_exams_subject_name_date ON exams (subject_id, exam_name, exam_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignments_subject_title ON assignments (subject_id, title);
`;

// ---------------------------------------------------------------------------
// 2. EMBEDDED SAMPLE DATA
// ---------------------------------------------------------------------------

const SAMPLE_USERS = [
  {
    name: 'System Admin',
    email: 'admin@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Dean Academic',
    email: 'dean.academic@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    role: 'dean',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  }
];

const SAMPLE_ACADEMIC_SESSIONS = [
  {
    id: 1,
    session_name: '2024–2025',
    term: 'Academic Year (Completed)',
    start_date: '2024-07-01',
    end_date: '2025-06-30',
    status: 'Archived',
    is_current: false
  },
  {
    id: 2,
    session_name: '2025–2026',
    term: 'Academic Year (Completed)',
    start_date: '2025-07-01',
    end_date: '2026-06-30',
    status: 'Archived',
    is_current: false
  },
  {
    id: 3,
    session_name: '2026–2027',
    term: 'Fall & Spring (Full Year / Odd + Even)',
    start_date: '2026-07-01',
    end_date: '2027-06-30',
    status: 'Active',
    is_current: true
  },
  {
    id: 4,
    session_name: '2027–2028',
    term: 'Academic Planning Phase',
    start_date: '2027-07-01',
    end_date: '2028-06-30',
    status: 'Upcoming',
    is_current: false
  }
];

const SAMPLE_SCHOOLS = [
  {
    id: 1,
    school_name: 'School of Engineering & Technology (SET)',
    school_code: 'LJU-SET',
    dean_name: 'Dr. Rajesh Sharma',
    contact_email: 'dean.set@ljku.edu.in',
    contact_phone: '+91 79 2970 0001',
    building: 'Engineering Block A',
    status: 'Active'
  },
  {
    id: 2,
    school_name: 'School of Business & Law (SBL)',
    school_code: 'LJU-SBL',
    dean_name: 'Dr. Anita Desai',
    contact_email: 'dean.sbl@ljku.edu.in',
    contact_phone: '+91 79 2970 0002',
    building: 'Management Tower B',
    status: 'Active'
  },
  {
    id: 3,
    school_name: 'School of Science & Education (SSE)',
    school_code: 'LJU-SSE',
    dean_name: 'Dr. Manish Trivedi',
    contact_email: 'dean.sse@ljku.edu.in',
    contact_phone: '+91 79 2970 0003',
    building: 'Science Complex C',
    status: 'Active'
  },
  {
    id: 4,
    school_name: 'School of Environmental Design & Architecture (SEDA)',
    school_code: 'LJU-SEDA',
    dean_name: 'Dr. Sneha Varma',
    contact_email: 'dean.seda@ljku.edu.in',
    contact_phone: '+91 79 2970 0004',
    building: 'Architecture Wing D',
    status: 'Active'
  },
  {
    id: 5,
    school_name: 'School of Liberal Arts & Sciences',
    school_code: 'LJU-SLAS',
    dean_name: 'Dr. Kirit Patel',
    contact_email: 'dean.slas@ljku.edu.in',
    contact_phone: '+91 79 2970 0005',
    building: 'Humanities Block E',
    status: 'Active'
  }
];

const SAMPLE_DEPARTMENTS = [
  {
    id: 1,
    department_name: 'Computer Science & Engineering',
    department_code: 'CSE',
    school_code: 'LJU-SET',
    email: 'hod.cse@ljku.edu.in',
    phone: '+91 98765 43210',
    established_year: 2012,
    building: 'Engineering Block A',
    room_no: 'Room A-301 (3rd Floor)',
    description: 'Focuses on cutting-edge computer engineering, system architecture, artificial intelligence, software engineering, and high-performance computing at LJ University.',
    status: 'Active'
  },
  {
    id: 2,
    department_name: 'Information Technology',
    department_code: 'IT',
    school_code: 'LJU-SET',
    email: 'hod.it@ljku.edu.in',
    phone: '+91 98765 43211',
    established_year: 2014,
    building: 'Engineering Block A',
    room_no: 'Room A-204 (2nd Floor)',
    description: 'Dedicated to modern cloud architectures, network security, web technologies, and enterprise data management systems.',
    status: 'Active'
  },
  {
    id: 3,
    department_name: 'Artificial Intelligence & Machine Learning',
    department_code: 'AIML',
    school_code: 'LJU-SET',
    email: 'hod.aiml@ljku.edu.in',
    phone: '+91 98765 43212',
    established_year: 2021,
    building: 'Engineering Block A',
    room_no: 'Room A-402 (4th Floor)',
    description: 'Specialized research and curriculum in Deep Learning, Computer Vision, Natural Language Processing, and Autonomous Robotics.',
    status: 'Active'
  },
  {
    id: 4,
    department_name: 'Electronics & Communication Engineering',
    department_code: 'ECE',
    school_code: 'LJU-SET',
    email: 'hod.ece@ljku.edu.in',
    phone: '+91 98765 43213',
    established_year: 2010,
    building: 'Engineering Block A',
    room_no: 'Room A-105 (1st Floor)',
    description: 'Pioneering studies in VLSI design, Embedded IoT devices, Telecommunications, and Signal Processing.',
    status: 'Active'
  },
  {
    id: 5,
    department_name: 'Mechanical Engineering',
    department_code: 'MECH',
    school_code: 'LJU-SET',
    email: 'hod.mech@ljku.edu.in',
    phone: '+91 98765 43214',
    established_year: 2011,
    building: 'Engineering Workshop Block',
    room_no: 'Room W-101',
    description: 'Focusing on Thermal Sciences, Advanced Manufacturing, CAD/CAM design, and Mechatronics automation.',
    status: 'Active'
  },
  {
    id: 6,
    department_name: 'Civil Engineering',
    department_code: 'CIVIL',
    school_code: 'LJU-SET',
    email: 'hod.civil@ljku.edu.in',
    phone: '+91 98765 43215',
    established_year: 2012,
    building: 'Engineering Block B',
    room_no: 'Room B-102',
    description: 'Specializing in Structural Engineering, Geo-technical analysis, Smart Cities planning, and Transportation Systems.',
    status: 'Active'
  },
  {
    id: 7,
    department_name: 'Master of Computer Applications',
    department_code: 'MCA',
    school_code: 'LJU-SET',
    email: 'hod.mca@ljku.edu.in',
    phone: '+91 98765 43216',
    established_year: 2013,
    building: 'Engineering Block A',
    room_no: 'Room A-101',
    description: 'Comprehensive postgraduate training in Full-Stack software engineering, enterprise cloud solutions, and mobile app design.',
    status: 'Active'
  },
  {
    id: 8,
    department_name: 'Master of Business Administration',
    department_code: 'MBA',
    school_code: 'LJU-SBL',
    email: 'hod.mba@ljku.edu.in',
    phone: '+91 98765 43217',
    established_year: 2011,
    building: 'Management Tower B',
    room_no: 'Room M-201',
    description: 'Premier business program in Finance, Marketing, Human Resources, and Entrepreneurship & Innovation.',
    status: 'Active'
  },
  {
    id: 9,
    department_name: 'Bachelor of Business Administration',
    department_code: 'BBA',
    school_code: 'LJU-SBL',
    email: 'hod.bba@ljku.edu.in',
    phone: '+91 98765 43218',
    established_year: 2015,
    building: 'Management Tower B',
    room_no: 'Room M-105',
    description: 'Undergraduate foundation in business management, marketing analytics, business communication, and commerce.',
    status: 'Active'
  },
  {
    id: 10,
    department_name: 'Environmental Design & Architecture',
    department_code: 'ARCH',
    school_code: 'LJU-SEDA',
    email: 'hod.arch@ljku.edu.in',
    phone: '+91 98765 43219',
    established_year: 2014,
    building: 'Architecture Wing D',
    room_no: 'Room D-203',
    description: 'Research-driven department in sustainable architecture, urban planning, and structural aesthetics.',
    status: 'Active'
  },
  {
    id: 11,
    department_name: 'Mathematics & Data Science',
    department_code: 'MATH',
    school_code: 'LJU-SSE',
    email: 'hod.math@ljku.edu.in',
    phone: '+91 98765 43220',
    established_year: 2013,
    building: 'Science Complex C',
    room_no: 'Room C-304',
    description: 'Provides foundational and applied mathematical modeling, statistical computing, and predictive data analysis.',
    status: 'Active'
  },
  {
    id: 12,
    department_name: 'Robotics & Automation (Proposed)',
    department_code: 'ROBO',
    school_code: 'LJU-SET',
    email: 'info.robo@ljku.edu.in',
    phone: '+91 98765 43221',
    established_year: 2026,
    building: 'Engineering Block A',
    room_no: 'Room A-501',
    description: 'Upcoming specialized department focusing on industrial robotics, autonomous navigation, and mechatronics.',
    status: 'Inactive'
  }
];

const SAMPLE_FACULTY = [
  // CSE
  {
    id: 1,
    department_code: 'CSE',
    name: 'Dr. Amit Patel',
    email: 'amit.patel@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 11223',
    designation: 'HOD & Professor',
    qualification: 'Ph.D. in Computer Science (IIT Bombay)',
    specialization: 'Distributed Systems, Cloud & AI',
    joining_date: '2015-06-15',
    experience_years: 16,
    status: 'Active'
  },
  {
    id: 2,
    department_code: 'CSE',
    name: 'Prof. Neha Shah',
    email: 'neha.shah@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 11224',
    designation: 'Associate Professor',
    qualification: 'M.Tech in CSE (NIT Surat)',
    specialization: 'Data Structures, Machine Learning',
    joining_date: '2017-07-01',
    experience_years: 9,
    status: 'Active'
  },
  {
    id: 3,
    department_code: 'CSE',
    name: 'Prof. Rahul Mehta',
    email: 'rahul.mehta@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 11225',
    designation: 'Assistant Professor',
    qualification: 'M.E. in Software Engineering',
    specialization: 'Web Technologies, DevOps, Cloud',
    joining_date: '2019-01-10',
    experience_years: 6,
    status: 'Active'
  },
  {
    id: 4,
    department_code: 'CSE',
    name: 'Prof. Priya Joshi',
    email: 'priya.joshi@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 11226',
    designation: 'Assistant Professor',
    qualification: 'M.Tech in Cyber Security',
    specialization: 'Network Security & Cryptography',
    joining_date: '2020-08-14',
    experience_years: 5,
    status: 'Active'
  },
  {
    id: 5,
    department_code: 'CSE',
    name: 'Prof. Tanvi Trivedi',
    email: 'tanvi.trivedi@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 11227',
    designation: 'Assistant Professor',
    qualification: 'M.Tech in AI & Data Science',
    specialization: 'Applied Machine Learning',
    joining_date: '2025-08-01',
    experience_years: 3,
    status: 'Active'
  },
  // IT
  {
    id: 6,
    department_code: 'IT',
    name: 'Dr. Sanjay Solanki',
    email: 'sanjay.solanki@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 22331',
    designation: 'HOD & Professor',
    qualification: 'Ph.D. in Information Technology',
    specialization: 'Big Data Analytics & Cloud Systems',
    joining_date: '2016-04-12',
    experience_years: 15,
    status: 'Active'
  },
  {
    id: 7,
    department_code: 'IT',
    name: 'Prof. Anjali Dave',
    email: 'anjali.dave@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 22332',
    designation: 'Associate Professor',
    qualification: 'M.Tech in IT',
    specialization: 'Database Architecture, IoT',
    joining_date: '2018-02-20',
    experience_years: 8,
    status: 'Active'
  },
  // AIML
  {
    id: 8,
    department_code: 'AIML',
    name: 'Dr. Hardik Raval',
    email: 'hardik.raval@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 33441',
    designation: 'HOD & Associate Professor',
    qualification: 'Ph.D. in AI & Robotics',
    specialization: 'Deep Learning, LLMs, Computer Vision',
    joining_date: '2021-06-01',
    experience_years: 11,
    status: 'Active'
  },
  {
    id: 9,
    department_code: 'AIML',
    name: 'Prof. Shruti Dave',
    email: 'shruti.dave@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 33442',
    designation: 'Assistant Professor',
    qualification: 'M.Tech in Artificial Intelligence',
    specialization: 'Natural Language Processing',
    joining_date: '2022-03-15',
    experience_years: 4,
    status: 'Active'
  },
  {
    id: 10,
    department_code: 'AIML',
    name: 'Prof. Mihir Shah',
    email: 'mihir.shah@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 33443',
    designation: 'Assistant Professor',
    qualification: 'M.Tech in Autonomous Systems',
    specialization: 'Robotics & Computer Vision',
    joining_date: '2026-07-15',
    experience_years: 2,
    status: 'Active'
  },
  // ECE
  {
    id: 11,
    department_code: 'ECE',
    name: 'Dr. Ketan Parekh',
    email: 'ketan.parekh@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 44551',
    designation: 'HOD & Professor',
    qualification: 'Ph.D. in VLSI Design',
    specialization: 'Microprocessors, Embedded Systems',
    joining_date: '2012-08-01',
    experience_years: 18,
    status: 'Active'
  },
  // MECH
  {
    id: 12,
    department_code: 'MECH',
    name: 'Dr. Rajesh Trivedi',
    email: 'rajesh.trivedi@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 55661',
    designation: 'HOD & Professor',
    qualification: 'Ph.D. in Thermal Engineering',
    specialization: 'Thermodynamics & Renewable Energy',
    joining_date: '2010-01-15',
    experience_years: 20,
    status: 'Active'
  },
  // CIVIL
  {
    id: 13,
    department_code: 'CIVIL',
    name: 'Dr. Bhavesh Bhatt',
    email: 'bhavesh.bhatt@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 66771',
    designation: 'HOD & Professor',
    qualification: 'Ph.D. in Structural Engineering',
    specialization: 'Earthquake Engineering, Concrete Tech',
    joining_date: '2011-09-01',
    experience_years: 17,
    status: 'Active'
  },
  // MCA
  {
    id: 14,
    department_code: 'MCA',
    name: 'Dr. Manish Trivedi',
    email: 'manish.trivedi@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 77881',
    designation: 'HOD & Professor',
    qualification: 'Ph.D. in Computer Applications',
    specialization: 'Software Engineering & Enterprise Dev',
    joining_date: '2013-05-10',
    experience_years: 19,
    status: 'Active'
  },
  // MBA
  {
    id: 15,
    department_code: 'MBA',
    name: 'Dr. Anita Desai',
    email: 'anita.desai@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 88991',
    designation: 'HOD & Professor',
    qualification: 'Ph.D. in Finance & Economics (IIM)',
    specialization: 'Strategic Management, Corporate Finance',
    joining_date: '2011-07-20',
    experience_years: 22,
    status: 'Active'
  },
  // BBA
  {
    id: 16,
    department_code: 'BBA',
    name: 'Prof. Chirag Patel',
    email: 'chirag.patel@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 99001',
    designation: 'HOD & Associate Professor',
    qualification: 'MBA (Marketing), Ph.D. Scholar',
    specialization: 'Marketing Analytics, Consumer Behavior',
    joining_date: '2016-11-01',
    experience_years: 10,
    status: 'Active'
  },
  // ARCH
  {
    id: 17,
    department_code: 'ARCH',
    name: 'Dr. Sneha Varma',
    email: 'sneha.varma@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 10101',
    designation: 'HOD & Professor',
    qualification: 'Ph.D. in Architecture & Urban Design',
    specialization: 'Sustainable Architecture, Smart Cities',
    joining_date: '2016-09-15',
    experience_years: 14,
    status: 'Active'
  },
  // MATH
  {
    id: 18,
    department_code: 'MATH',
    name: 'Dr. Kirit Patel',
    email: 'kirit.patel@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98250 11111',
    designation: 'HOD & Associate Professor',
    qualification: 'Ph.D. in Applied Mathematics',
    specialization: 'Optimization Techniques, Numerical Methods',
    joining_date: '2014-03-01',
    experience_years: 13,
    status: 'Active'
  }
];

const DEPARTMENT_HOD_MAP = {
  'CSE': 'amit.patel@ljku.edu.in',
  'IT': 'sanjay.solanki@ljku.edu.in',
  'AIML': 'hardik.raval@ljku.edu.in',
  'ECE': 'ketan.parekh@ljku.edu.in',
  'MECH': 'rajesh.trivedi@ljku.edu.in',
  'CIVIL': 'bhavesh.bhatt@ljku.edu.in',
  'MCA': 'manish.trivedi@ljku.edu.in',
  'MBA': 'anita.desai@ljku.edu.in',
  'BBA': 'chirag.patel@ljku.edu.in',
  'ARCH': 'sneha.varma@ljku.edu.in',
  'MATH': 'kirit.patel@ljku.edu.in'
};

const SAMPLE_PROGRAMS = [
  {
    id: 1,
    department_code: 'CSE',
    program_name: 'Bachelor of Technology in Computer Science & Engineering',
    program_code: 'BTECH-CSE',
    degree_level: 'Undergraduate (B.Tech)',
    intake_capacity: 180,
    duration_years: 4,
    status: 'Active'
  },
  {
    id: 2,
    department_code: 'CSE',
    program_name: 'Master of Technology in Computer Science',
    program_code: 'MTECH-CSE',
    degree_level: 'Postgraduate (M.Tech)',
    intake_capacity: 30,
    duration_years: 2,
    status: 'Active'
  },
  {
    id: 3,
    department_code: 'CSE',
    program_name: 'Ph.D. in Computer Science',
    program_code: 'PHD-CSE',
    degree_level: 'Doctorate (Ph.D)',
    intake_capacity: 10,
    duration_years: 3,
    status: 'Active'
  },
  {
    id: 4,
    department_code: 'IT',
    program_name: 'Bachelor of Technology in Information Technology',
    program_code: 'BTECH-IT',
    degree_level: 'Undergraduate (B.Tech)',
    intake_capacity: 120,
    duration_years: 4,
    status: 'Active'
  },
  {
    id: 5,
    department_code: 'AIML',
    program_name: 'B.Tech in Artificial Intelligence & Data Science',
    program_code: 'BTECH-AIDS',
    degree_level: 'Undergraduate (B.Tech)',
    intake_capacity: 60,
    duration_years: 4,
    status: 'Active'
  },
  {
    id: 6,
    department_code: 'MCA',
    program_name: 'Master of Computer Applications (2-Year)',
    program_code: 'MCA-REG',
    degree_level: 'Postgraduate (MCA)',
    intake_capacity: 120,
    duration_years: 2,
    status: 'Active'
  },
  {
    id: 7,
    department_code: 'MCA',
    program_name: 'Bachelor of Computer Applications',
    program_code: 'BCA-REG',
    degree_level: 'Undergraduate (BCA)',
    intake_capacity: 180,
    duration_years: 3,
    status: 'Active'
  },
  {
    id: 8,
    department_code: 'MBA',
    program_name: 'Master of Business Administration (Core)',
    program_code: 'MBA-CORE',
    degree_level: 'Postgraduate (MBA)',
    intake_capacity: 240,
    duration_years: 2,
    status: 'Active'
  },
  {
    id: 9,
    department_code: 'BBA',
    program_name: 'Bachelor of Business Administration',
    program_code: 'BBA-HONS',
    degree_level: 'Undergraduate (BBA)',
    intake_capacity: 180,
    duration_years: 3,
    status: 'Active'
  },
  {
    id: 10,
    department_code: 'ARCH',
    program_name: 'Bachelor of Architecture (B.Arch)',
    program_code: 'BARCH',
    degree_level: 'Undergraduate (B.Arch)',
    intake_capacity: 80,
    duration_years: 5,
    status: 'Active'
  }
];

const SAMPLE_STUDENTS = [
  {
    id: 1,
    enrollment_no: 'LJU2024CS001',
    name: 'Aarav Patel',
    email: 'aarav.patel@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98251 11001',
    gender: 'Male',
    dob: '2004-03-15',
    address: '12 Vastrapur Lake Rd, Ahmedabad',
    admission_year: 2024,
    current_semester: 4,
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  },
  {
    id: 2,
    enrollment_no: 'LJU2024CS002',
    name: 'Diya Shah',
    email: 'diya.shah@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98251 11002',
    gender: 'Female',
    dob: '2004-07-22',
    address: '45 CG Road, Navrangpura, Ahmedabad',
    admission_year: 2024,
    current_semester: 4,
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  },
  {
    id: 3,
    enrollment_no: 'LJU2024CS003',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98251 11003',
    gender: 'Male',
    dob: '2003-11-05',
    address: '88 SG Highway, Bodakdev, Ahmedabad',
    admission_year: 2024,
    current_semester: 4,
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  },
  {
    id: 4,
    enrollment_no: 'LJU2024CS004',
    name: 'Ananya Joshi',
    email: 'ananya.joshi@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98251 11004',
    gender: 'Female',
    dob: '2004-01-30',
    address: '23 Satellite Rd, Ahmedabad',
    admission_year: 2024,
    current_semester: 4,
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  },
  {
    id: 5,
    enrollment_no: 'LJU2024CS005',
    name: 'Kabir Trivedi',
    email: 'kabir.trivedi@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98251 11005',
    gender: 'Male',
    dob: '2004-09-12',
    address: '14 Prahladnagar, Ahmedabad',
    admission_year: 2024,
    current_semester: 4,
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  },
  {
    id: 6,
    enrollment_no: 'LJU2024CS006',
    name: 'Isha Desai',
    email: 'isha.desai@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98251 11006',
    gender: 'Female',
    dob: '2004-05-18',
    address: '71 Drive-In Rd, Thaltej, Ahmedabad',
    admission_year: 2024,
    current_semester: 4,
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  },
  {
    id: 7,
    enrollment_no: 'LJU2024IT001',
    name: 'Devansh Raval',
    email: 'devansh.raval@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98251 11007',
    gender: 'Male',
    dob: '2004-08-08',
    address: '5 Bopal Gam, Ahmedabad',
    admission_year: 2024,
    current_semester: 4,
    department_code: 'IT',
    program_code: 'BTECH-IT',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  },
  {
    id: 8,
    enrollment_no: 'LJU2024IT002',
    name: 'Pooja Bhatt',
    email: 'pooja.bhatt@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98251 11008',
    gender: 'Female',
    dob: '2004-04-25',
    address: '19 Iscon Cross Roads, SG Highway',
    admission_year: 2024,
    current_semester: 4,
    department_code: 'IT',
    program_code: 'BTECH-IT',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  },
  {
    id: 9,
    enrollment_no: 'LJU2024AI001',
    name: 'Arjun Varma',
    email: 'arjun.varma@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98251 11009',
    gender: 'Male',
    dob: '2004-12-19',
    address: '32 Science City Rd, Sola, Ahmedabad',
    admission_year: 2024,
    current_semester: 4,
    department_code: 'AIML',
    program_code: 'BTECH-AIDS',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  },
  {
    id: 10,
    enrollment_no: 'LJU2024AI002',
    name: 'Tanvi Dave',
    email: 'tanvi.dave@ljku.edu.in',
    password: DEFAULT_PASSWORD_HASH,
    phone: '+91 98251 11010',
    gender: 'Female',
    dob: '2004-06-14',
    address: '67 Sindhu Bhavan Rd, Bodakdev',
    admission_year: 2024,
    current_semester: 4,
    department_code: 'AIML',
    program_code: 'BTECH-AIDS',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    status: 'Active'
  }
];

const SAMPLE_SUBJECTS = [
  {
    id: 1,
    subject_name: 'Data Structures & Algorithms',
    subject_code: 'CSE-401',
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    semester: 4,
    credits: 4,
    type: 'Theory',
    faculty_email: 'amit.patel@ljku.edu.in',
    description: 'Core fundamentals of tree, graph, dynamic programming and algorithmic complexity.',
    status: 'Active'
  },
  {
    id: 2,
    subject_name: 'Database Management Systems',
    subject_code: 'CSE-402',
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    semester: 4,
    credits: 4,
    type: 'Theory',
    faculty_email: 'neha.shah@ljku.edu.in',
    description: 'Relational models, SQL, indexing, transaction processing and concurrency control.',
    status: 'Active'
  },
  {
    id: 3,
    subject_name: 'Computer Networks & Security',
    subject_code: 'CSE-403',
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    semester: 4,
    credits: 3,
    type: 'Theory',
    faculty_email: 'rahul.mehta@ljku.edu.in',
    description: 'TCP/IP stack, routing protocols, cryptography and network threat mitigation.',
    status: 'Active'
  },
  {
    id: 4,
    subject_name: 'Full-Stack Web Development Lab',
    subject_code: 'CSE-404',
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    semester: 4,
    credits: 2,
    type: 'Practical',
    faculty_email: 'priya.joshi@ljku.edu.in',
    description: 'Hands-on training in React, Node.js, RESTful architecture and PostgreSQL.',
    status: 'Active'
  },
  {
    id: 5,
    subject_name: 'Artificial Intelligence Foundations',
    subject_code: 'AIML-401',
    department_code: 'AIML',
    program_code: 'BTECH-AIDS',
    semester: 4,
    credits: 4,
    type: 'Theory',
    faculty_email: 'hardik.raval@ljku.edu.in',
    description: 'Search algorithms, probabilistic reasoning, and intro to neural representations.',
    status: 'Active'
  },
  {
    id: 6,
    subject_name: 'Cloud Architecture & DevOps',
    subject_code: 'IT-401',
    department_code: 'IT',
    program_code: 'BTECH-IT',
    semester: 4,
    credits: 3,
    type: 'Theory',
    faculty_email: 'sanjay.solanki@ljku.edu.in',
    description: 'Containerization, Kubernetes, CI/CD pipelines, and AWS cloud management.',
    status: 'Active'
  },
  {
    id: 7,
    subject_name: 'Machine Learning & Deep Neural Nets',
    subject_code: 'CSE-601',
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    semester: 6,
    credits: 4,
    type: 'Theory',
    faculty_email: 'tanvi.trivedi@ljku.edu.in',
    description: 'Supervised/unsupervised learning, convolutional networks, transformers and LLMs.',
    status: 'Active'
  },
  {
    id: 8,
    subject_name: 'Software Engineering & Agile Methodologies',
    subject_code: 'CSE-602',
    department_code: 'CSE',
    program_code: 'BTECH-CSE',
    semester: 6,
    credits: 3,
    type: 'Theory',
    faculty_email: 'amit.patel@ljku.edu.in',
    description: 'Agile sprint life cycle, UML modeling, automated testing and software quality.',
    status: 'Active'
  }
];

const SAMPLE_ATTENDANCE = [
  // Student 1 (Aarav Patel)
  { enrollment_no: 'LJU2024CS001', subject_code: 'CSE-401', date: '2026-03-02', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS001', subject_code: 'CSE-401', date: '2026-03-04', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS001', subject_code: 'CSE-401', date: '2026-03-09', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS001', subject_code: 'CSE-401', date: '2026-03-11', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'Active participation' },
  { enrollment_no: 'LJU2024CS001', subject_code: 'CSE-402', date: '2026-03-03', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'Lab practical done' },
  { enrollment_no: 'LJU2024CS001', subject_code: 'CSE-402', date: '2026-03-05', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS001', subject_code: 'CSE-402', date: '2026-03-10', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' },

  // Student 2 (Diya Shah)
  { enrollment_no: 'LJU2024CS002', subject_code: 'CSE-401', date: '2026-03-02', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS002', subject_code: 'CSE-401', date: '2026-03-04', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS002', subject_code: 'CSE-401', date: '2026-03-09', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS002', subject_code: 'CSE-401', date: '2026-03-11', status: 'Absent', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'Medical leave' },
  { enrollment_no: 'LJU2024CS002', subject_code: 'CSE-402', date: '2026-03-03', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS002', subject_code: 'CSE-402', date: '2026-03-05', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' },

  // Student 3 (Rohan Mehta - Low attendance <75% to showcase low attendance warning badge)
  { enrollment_no: 'LJU2024CS003', subject_code: 'CSE-401', date: '2026-03-02', status: 'Absent', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'Unexcused absence' },
  { enrollment_no: 'LJU2024CS003', subject_code: 'CSE-401', date: '2026-03-04', status: 'Absent', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'Unexcused absence' },
  { enrollment_no: 'LJU2024CS003', subject_code: 'CSE-401', date: '2026-03-09', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS003', subject_code: 'CSE-401', date: '2026-03-11', status: 'Absent', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'Late unexcused' },
  { enrollment_no: 'LJU2024CS003', subject_code: 'CSE-402', date: '2026-03-03', status: 'Absent', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'Unexcused' },
  { enrollment_no: 'LJU2024CS003', subject_code: 'CSE-402', date: '2026-03-05', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' },

  // Student 4 (Ananya Joshi)
  { enrollment_no: 'LJU2024CS004', subject_code: 'CSE-401', date: '2026-03-02', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS004', subject_code: 'CSE-401', date: '2026-03-04', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS004', subject_code: 'CSE-401', date: '2026-03-09', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS004', subject_code: 'CSE-401', date: '2026-03-11', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS004', subject_code: 'CSE-402', date: '2026-03-03', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS004', subject_code: 'CSE-402', date: '2026-03-05', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' },

  // Student 5 (Kabir Trivedi)
  { enrollment_no: 'LJU2024CS005', subject_code: 'CSE-401', date: '2026-03-02', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS005', subject_code: 'CSE-401', date: '2026-03-04', status: 'Late', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'Late by 10 mins' },
  { enrollment_no: 'LJU2024CS005', subject_code: 'CSE-401', date: '2026-03-09', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS005', subject_code: 'CSE-401', date: '2026-03-11', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS005', subject_code: 'CSE-402', date: '2026-03-03', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS005', subject_code: 'CSE-402', date: '2026-03-05', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' },

  // Student 6 (Isha Desai)
  { enrollment_no: 'LJU2024CS006', subject_code: 'CSE-401', date: '2026-03-02', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS006', subject_code: 'CSE-401', date: '2026-03-04', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS006', subject_code: 'CSE-401', date: '2026-03-09', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS006', subject_code: 'CSE-401', date: '2026-03-11', status: 'Present', marked_by_email: 'amit.patel@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS006', subject_code: 'CSE-402', date: '2026-03-03', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' },
  { enrollment_no: 'LJU2024CS006', subject_code: 'CSE-402', date: '2026-03-05', status: 'Present', marked_by_email: 'neha.shah@ljku.edu.in', remarks: 'On time' }
];

const SAMPLE_TIMETABLES = [
  // Monday
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Monday', time_slot: '09:00 - 10:00', subject_code: 'CSE-401', faculty_email: 'amit.patel@ljku.edu.in', classroom: 'Room A-301' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Monday', time_slot: '10:00 - 11:00', subject_code: 'CSE-402', faculty_email: 'neha.shah@ljku.edu.in', classroom: 'Room A-301' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Monday', time_slot: '11:15 - 12:15', subject_code: 'CSE-403', faculty_email: 'rahul.mehta@ljku.edu.in', classroom: 'Room A-301' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Monday', time_slot: '13:00 - 15:00', subject_code: 'CSE-404', faculty_email: 'priya.joshi@ljku.edu.in', classroom: 'Computer Lab 3' },

  // Tuesday
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Tuesday', time_slot: '09:00 - 10:00', subject_code: 'CSE-402', faculty_email: 'neha.shah@ljku.edu.in', classroom: 'Room A-301' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Tuesday', time_slot: '10:00 - 11:00', subject_code: 'CSE-401', faculty_email: 'amit.patel@ljku.edu.in', classroom: 'Room A-301' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Tuesday', time_slot: '11:15 - 12:15', subject_code: 'CSE-403', faculty_email: 'rahul.mehta@ljku.edu.in', classroom: 'Room A-301' },

  // Wednesday
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Wednesday', time_slot: '09:00 - 10:00', subject_code: 'CSE-401', faculty_email: 'amit.patel@ljku.edu.in', classroom: 'Room A-301' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Wednesday', time_slot: '10:00 - 11:00', subject_code: 'CSE-403', faculty_email: 'rahul.mehta@ljku.edu.in', classroom: 'Room A-301' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Wednesday', time_slot: '11:15 - 12:15', subject_code: 'CSE-402', faculty_email: 'neha.shah@ljku.edu.in', classroom: 'Room A-301' },

  // Thursday
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Thursday', time_slot: '09:00 - 10:00', subject_code: 'CSE-403', faculty_email: 'rahul.mehta@ljku.edu.in', classroom: 'Room A-301' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Thursday', time_slot: '10:00 - 11:00', subject_code: 'CSE-402', faculty_email: 'neha.shah@ljku.edu.in', classroom: 'Room A-301' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Thursday', time_slot: '11:15 - 12:15', subject_code: 'CSE-401', faculty_email: 'amit.patel@ljku.edu.in', classroom: 'Room A-301' },

  // Friday
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Friday', time_slot: '09:00 - 11:00', subject_code: 'CSE-404', faculty_email: 'priya.joshi@ljku.edu.in', classroom: 'Computer Lab 3' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Friday', time_slot: '11:15 - 12:15', subject_code: 'CSE-402', faculty_email: 'neha.shah@ljku.edu.in', classroom: 'Room A-301' },
  { department_code: 'CSE', program_code: 'BTECH-CSE', semester: 4, day_of_week: 'Friday', time_slot: '12:15 - 13:15', subject_code: 'CSE-401', faculty_email: 'amit.patel@ljku.edu.in', classroom: 'Room A-301' }
];

const SAMPLE_NOTICES = [
  {
    title: 'Mid-Semester Theory & Practical Examination Schedule 2026',
    category: 'Examination',
    target_role: 'All',
    department_code: null,
    content: 'The Mid-Semester examinations for all undergraduate and postgraduate engineering courses will commence from 24th March 2026. Detailed room-wise and subject-wise seating plans have been published on the student portal.',
    publish_date: '2026-03-01',
    priority: 'High',
    posted_by: 'Academic Office - LJ University'
  },
  {
    title: 'LJ University Annual National Tech Fest "INNOVATE 2026"',
    category: 'Event',
    target_role: 'All',
    department_code: null,
    content: 'All students and faculty are cordially invited to participate in INNOVATE 2026 on 10-12 April 2026. Events include Hackathons, Code Golf, Robotics Wars, and Paper Presentations with total prizes worth 5 Lakhs.',
    publish_date: '2026-03-05',
    priority: 'Normal',
    posted_by: 'Dean of Students Affairs'
  },
  {
    title: 'Mandatory 75% Minimum Attendance Requirement Notice',
    category: 'Academic',
    target_role: 'Student',
    department_code: null,
    content: 'As per statutory academic regulations, students with less than 75% overall attendance across subjects will not be permitted to register for the final end-semester examinations without Dean approval.',
    publish_date: '2026-03-08',
    priority: 'Urgent',
    posted_by: 'Office of Registrar'
  },
  {
    title: 'CSE Department: Hands-on Workshop on Generative AI & LLMs',
    category: 'Academic',
    target_role: 'All',
    department_code: 'CSE',
    content: 'Department of Computer Science & Engineering is organizing a 2-day intensive technical workshop on fine-tuning Open-Source LLMs and building agentic RAG architectures using modern GPUs in Lab A-402.',
    publish_date: '2026-03-10',
    priority: 'Normal',
    posted_by: 'Dr. Amit Patel (HOD CSE)'
  },
  {
    title: 'Holiday Notice: University Campus Closed for Holi Festival',
    category: 'Holiday',
    target_role: 'All',
    department_code: null,
    content: 'The University offices, academic departments, and library will remain closed on 25th March 2026 on account of Holi festival celebrations.',
    publish_date: '2026-03-12',
    priority: 'Normal',
    posted_by: 'Administrative Office'
  }
];

const SAMPLE_EXAMS = [
  {
    exam_name: 'Mid-Semester Exam: Data Structures & Algorithms',
    subject_code: 'CSE-401',
    exam_date: '2026-03-24',
    time_slot: '10:00 - 12:00',
    classroom: 'Hall A-1',
    max_marks: 50,
    passing_marks: 20,
    status: 'Completed'
  },
  {
    exam_name: 'Mid-Semester Exam: Database Management Systems',
    subject_code: 'CSE-402',
    exam_date: '2026-03-26',
    time_slot: '10:00 - 12:00',
    classroom: 'Hall A-1',
    max_marks: 50,
    passing_marks: 20,
    status: 'Completed'
  },
  {
    exam_name: 'Mid-Semester Exam: Computer Networks & Security',
    subject_code: 'CSE-403',
    exam_date: '2026-03-28',
    time_slot: '10:00 - 12:00',
    classroom: 'Hall A-1',
    max_marks: 50,
    passing_marks: 20,
    status: 'Completed'
  },
  {
    exam_name: 'Practical Evaluation: Web Development Lab',
    subject_code: 'CSE-404',
    exam_date: '2026-04-02',
    time_slot: '14:00 - 17:00',
    classroom: 'Lab 3',
    max_marks: 50,
    passing_marks: 25,
    status: 'Scheduled'
  }
];

const SAMPLE_EXAM_RESULTS = [
  // Exam 1: DSA
  { exam_name: 'Mid-Semester Exam: Data Structures & Algorithms', enrollment_no: 'LJU2024CS001', marks_obtained: 46.5, grade: 'A+', remarks: 'Outstanding performance in trees and graph traversals' },
  { exam_name: 'Mid-Semester Exam: Data Structures & Algorithms', enrollment_no: 'LJU2024CS002', marks_obtained: 43.0, grade: 'A', remarks: 'Very good grasp of dynamic programming' },
  { exam_name: 'Mid-Semester Exam: Data Structures & Algorithms', enrollment_no: 'LJU2024CS003', marks_obtained: 28.5, grade: 'C', remarks: 'Needs improvement in algorithmic complexity analysis' },
  { exam_name: 'Mid-Semester Exam: Data Structures & Algorithms', enrollment_no: 'LJU2024CS004', marks_obtained: 48.0, grade: 'A+', remarks: 'Top scorer in batch' },
  { exam_name: 'Mid-Semester Exam: Data Structures & Algorithms', enrollment_no: 'LJU2024CS005', marks_obtained: 38.0, grade: 'B+', remarks: 'Good effort' },
  { exam_name: 'Mid-Semester Exam: Data Structures & Algorithms', enrollment_no: 'LJU2024CS006', marks_obtained: 41.5, grade: 'A', remarks: 'Strong theoretical foundation' },

  // Exam 2: DBMS
  { exam_name: 'Mid-Semester Exam: Database Management Systems', enrollment_no: 'LJU2024CS001', marks_obtained: 45.0, grade: 'A+', remarks: 'Excellent SQL and schema normalization' },
  { exam_name: 'Mid-Semester Exam: Database Management Systems', enrollment_no: 'LJU2024CS002', marks_obtained: 44.0, grade: 'A', remarks: 'Very good concurrency and ACID explanations' },
  { exam_name: 'Mid-Semester Exam: Database Management Systems', enrollment_no: 'LJU2024CS003', marks_obtained: 31.0, grade: 'B', remarks: 'Satisfactory query optimization' },
  { exam_name: 'Mid-Semester Exam: Database Management Systems', enrollment_no: 'LJU2024CS004', marks_obtained: 47.0, grade: 'A+', remarks: 'Exceptional practical database concepts' },
  { exam_name: 'Mid-Semester Exam: Database Management Systems', enrollment_no: 'LJU2024CS005', marks_obtained: 36.5, grade: 'B+', remarks: 'Good understanding of transactions' },
  { exam_name: 'Mid-Semester Exam: Database Management Systems', enrollment_no: 'LJU2024CS006', marks_obtained: 42.0, grade: 'A', remarks: 'Clear relational algebra execution' },

  // Exam 3: CNS
  { exam_name: 'Mid-Semester Exam: Computer Networks & Security', enrollment_no: 'LJU2024CS001', marks_obtained: 44.0, grade: 'A', remarks: 'Good subnetting and protocol traces' },
  { exam_name: 'Mid-Semester Exam: Computer Networks & Security', enrollment_no: 'LJU2024CS002', marks_obtained: 41.0, grade: 'A', remarks: 'Clear cryptography concepts' },
  { exam_name: 'Mid-Semester Exam: Computer Networks & Security', enrollment_no: 'LJU2024CS003', marks_obtained: 25.0, grade: 'C', remarks: 'Needs revision on TCP congestion window' },
  { exam_name: 'Mid-Semester Exam: Computer Networks & Security', enrollment_no: 'LJU2024CS004', marks_obtained: 46.5, grade: 'A+', remarks: 'Solid understanding of transport layers' },
  { exam_name: 'Mid-Semester Exam: Computer Networks & Security', enrollment_no: 'LJU2024CS005', marks_obtained: 35.0, grade: 'B', remarks: 'Average performance' },
  { exam_name: 'Mid-Semester Exam: Computer Networks & Security', enrollment_no: 'LJU2024CS006', marks_obtained: 40.0, grade: 'A', remarks: 'Good network security design' }
];

const SAMPLE_ASSIGNMENTS = [
  {
    title: 'Assignment 1: Complex SQL Queries & Indexing Optimization',
    subject_code: 'CSE-402',
    department_code: 'CSE',
    semester: 4,
    description: 'Write parameterized SQL queries for a multi-tenant university portal, analyze EXPLAIN ANALYZE execution trees, and build B-Tree and Hash indexes to reduce execution cost.',
    due_date: '2026-03-30',
    max_marks: 30,
    created_by_email: 'neha.shah@ljku.edu.in'
  },
  {
    title: 'Assignment 2: Graph Theory & Shortest Path Implementations',
    subject_code: 'CSE-401',
    department_code: 'CSE',
    semester: 4,
    description: 'Implement Dijkstra and Bellman-Ford shortest path algorithms in C++/Python with cycle detection and benchmark against sparse graphs.',
    due_date: '2026-04-05',
    max_marks: 40,
    created_by_email: 'amit.patel@ljku.edu.in'
  },
  {
    title: 'Assignment 3: Full-Stack React Component Architecture',
    subject_code: 'CSE-404',
    department_code: 'CSE',
    semester: 4,
    description: 'Design responsive glassmorphism dashboard cards with React 19 hooks, client-side sorting, pagination, and live REST API data binding.',
    due_date: '2026-04-10',
    max_marks: 50,
    created_by_email: 'priya.joshi@ljku.edu.in'
  }
];

const SAMPLE_ASSIGNMENT_SUBMISSIONS = [
  {
    assignment_title: 'Assignment 1: Complex SQL Queries & Indexing Optimization',
    enrollment_no: 'LJU2024CS001',
    submission_content: 'GitHub repo: github.com/aarav-lju/dbms-assignment1 - All 10 queries optimized with composite indexes. Average execution time reduced from 42ms to 2.1ms.',
    submission_text: 'All 10 queries executed with EXPLAIN ANALYZE comparison table attached in README.',
    submission_file_url: 'https://github.com/aarav-lju/dbms-assignment1',
    status: 'Graded',
    marks_obtained: 29.5,
    feedback: 'Flawless indexing strategy and query explain plan writeup.'
  },
  {
    assignment_title: 'Assignment 1: Complex SQL Queries & Indexing Optimization',
    enrollment_no: 'LJU2024CS002',
    submission_content: 'GitHub repo: github.com/diya-lju/dbms-queries - Includes SQL scripts, EXPLAIN plans, and benchmark comparison charts.',
    submission_text: 'Complete project submitted with database schema migration scripts and benchmark results.',
    submission_file_url: 'https://github.com/diya-lju/dbms-queries',
    status: 'Graded',
    marks_obtained: 28.0,
    feedback: 'Very thorough documentation and clean index naming.'
  },
  {
    assignment_title: 'Assignment 1: Complex SQL Queries & Indexing Optimization',
    enrollment_no: 'LJU2024CS003',
    submission_content: 'Submitted SQL query file with explanations for foreign keys and join conditions.',
    submission_text: 'Single file SQL script covering the required assignment queries.',
    submission_file_url: null,
    status: 'Graded',
    marks_obtained: 21.0,
    feedback: 'Execution plan could have leveraged index-only scans.'
  }
];

// ---------------------------------------------------------------------------
// 3. SEEDING EXECUTION ENGINE
// ---------------------------------------------------------------------------

async function ensureTargetDatabaseExists(config) {
  // If using connection string or cloud host, skip database creation check
  if (config.connectionString || (config.host && config.host !== 'localhost' && config.host !== '127.0.0.1')) {
    return;
  }

  const dbName = config.database || 'lj_department_db';
  console.log(`🔍 Checking if PostgreSQL database '${dbName}' exists...`);

  const rootClient = new Client({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: 'postgres'
  });

  try {
    await rootClient.connect();
    const res = await rootClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`📦 Database '${dbName}' not found. Creating database...`);
      await rootClient.query(`CREATE DATABASE "${dbName}";`);
      console.log(`✔ Database '${dbName}' created successfully.`);
    } else {
      console.log(`✔ Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.warn(`⚠️  Database existence check notice: ${err.message}. Proceeding with target connection.`);
  } finally {
    try {
      await rootClient.end();
    } catch (_) {}
  }
}

async function seedDatabase() {
  console.log('\n===============================================================');
  console.log('🌱 LJ UNIVERSITY ERP - DATABASE SEEDING ENGINE');
  console.log('===============================================================\n');

  const config = getDbConfig();
  await ensureTargetDatabaseExists(config);

  const pool = new Pool(config);

  try {
    const client = await pool.connect();
    console.log(`✔ Connected to target PostgreSQL database: ${config.database || 'Default Target'}`);

    // 1. Apply Schema DDL
    console.log('\n[1/11] 📜 Ensuring all 16 database tables, constraints, and indexes exist...');
    await client.query(SCHEMA_DDL);
    console.log('✔ All schema tables, relationships, and performance indexes verified.');

    // 2. Seed Users (Admin & Dean)
    console.log('\n[2/11] 👤 Seeding administrative user accounts...');
    for (const u of SAMPLE_USERS) {
      await client.query(`
        INSERT INTO users (name, email, password, role, avatar_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING;
      `, [u.name, u.email, u.password, u.role, u.avatar_url]);
    }
    console.log(`✔ Users verified (${SAMPLE_USERS.length} accounts).`);

    // 3. Seed Academic Sessions
    console.log('\n[3/11] 📅 Seeding academic sessions...');
    for (const s of SAMPLE_ACADEMIC_SESSIONS) {
      await client.query(`
        INSERT INTO academic_sessions (session_name, term, start_date, end_date, status, is_current)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (session_name) DO NOTHING;
      `, [s.session_name, s.term, s.start_date, s.end_date, s.status, s.is_current]);
    }
    console.log(`✔ Academic sessions verified (${SAMPLE_ACADEMIC_SESSIONS.length} sessions).`);

    // 4. Seed Schools
    console.log('\n[4/11] 🏢 Seeding schools and faculties...');
    for (const sc of SAMPLE_SCHOOLS) {
      await client.query(`
        INSERT INTO schools (school_name, school_code, dean_name, contact_email, contact_phone, building, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (school_code) DO NOTHING;
      `, [sc.school_name, sc.school_code, sc.dean_name, sc.contact_email, sc.contact_phone, sc.building, sc.status]);
    }
    console.log(`✔ Schools verified (${SAMPLE_SCHOOLS.length} schools).`);

    // 5. Seed Departments (with school_id resolution)
    console.log('\n[5/11] 🏛️  Seeding academic departments...');
    for (const d of SAMPLE_DEPARTMENTS) {
      await client.query(`
        INSERT INTO departments (department_name, department_code, school_id, email, phone, established_year, building, room_no, description, status)
        VALUES (
          $1, $2, 
          (SELECT id FROM schools WHERE school_code = $3), 
          $4, $5, $6, $7, $8, $9, $10
        )
        ON CONFLICT (department_code) DO NOTHING;
      `, [d.department_name, d.department_code, d.school_code, d.email, d.phone, d.established_year, d.building, d.room_no, d.description, d.status]);
    }
    console.log(`✔ Departments verified (${SAMPLE_DEPARTMENTS.length} departments).`);

    // 6. Seed Faculty Members (with department_id resolution)
    console.log('\n[6/11] 👨‍🏫 Seeding faculty directory...');
    for (const f of SAMPLE_FACULTY) {
      await client.query(`
        INSERT INTO faculty (department_id, name, email, password, phone, designation, qualification, specialization, joining_date, experience_years, status)
        VALUES (
          (SELECT id FROM departments WHERE department_code = $1),
          $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        ON CONFLICT (email) DO NOTHING;
      `, [f.department_code, f.name, f.email, f.password, f.phone, f.designation, f.qualification, f.specialization, f.joining_date, f.experience_years, f.status]);
    }
    console.log(`✔ Faculty members verified (${SAMPLE_FACULTY.length} faculty).`);

    // 7. Update Department HODs & Faculty Counts
    console.log('\n[7/11] 🔗 Synchronizing department HOD assignments and faculty counts...');
    for (const [deptCode, hodEmail] of Object.entries(DEPARTMENT_HOD_MAP)) {
      await client.query(`
        UPDATE departments 
        SET hod_id = (SELECT id FROM faculty WHERE email = $1)
        WHERE department_code = $2 AND (hod_id IS NULL OR hod_id = 0);
      `, [hodEmail, deptCode]);
    }

    await client.query(`
      UPDATE departments d
      SET faculty_count = (
        SELECT count(*) FROM faculty f WHERE f.department_id = d.id
      );
    `);
    console.log('✔ Department HOD assignments and live faculty counts synchronized.');

    // 8. Seed Academic Programs (with department_id resolution)
    console.log('\n[8/11] 📚 Seeding academic degree programs...');
    for (const p of SAMPLE_PROGRAMS) {
      await client.query(`
        INSERT INTO programs (department_id, program_name, program_code, degree_level, intake_capacity, duration_years, status)
        VALUES (
          (SELECT id FROM departments WHERE department_code = $1),
          $2, $3, $4, $5, $6, $7
        )
        ON CONFLICT (program_code) DO NOTHING;
      `, [p.department_code, p.program_name, p.program_code, p.degree_level, p.intake_capacity, p.duration_years, p.status]);
    }
    console.log(`✔ Academic programs verified (${SAMPLE_PROGRAMS.length} programs).`);

    // 9. Seed Students & Subjects (with foreign key resolutions)
    console.log('\n[9/11] 🎓 Seeding students and course subjects...');
    for (const s of SAMPLE_STUDENTS) {
      await client.query(`
        INSERT INTO students (enrollment_no, name, email, password, phone, gender, dob, address, admission_year, current_semester, department_id, program_id, avatar_url, status)
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          (SELECT id FROM departments WHERE department_code = $11),
          (SELECT id FROM programs WHERE program_code = $12),
          $13, $14
        )
        ON CONFLICT (enrollment_no) DO NOTHING;
      `, [s.enrollment_no, s.name, s.email, s.password, s.phone, s.gender, s.dob, s.address, s.admission_year, s.current_semester, s.department_code, s.program_code, s.avatar_url, s.status]);
    }

    for (const sub of SAMPLE_SUBJECTS) {
      await client.query(`
        INSERT INTO subjects (subject_name, subject_code, department_id, program_id, semester, credits, type, faculty_id, description, status)
        VALUES (
          $1, $2,
          (SELECT id FROM departments WHERE department_code = $3),
          (SELECT id FROM programs WHERE program_code = $4),
          $5, $6, $7,
          (SELECT id FROM faculty WHERE email = $8),
          $9, $10
        )
        ON CONFLICT (subject_code) DO NOTHING;
      `, [sub.subject_name, sub.subject_code, sub.department_code, sub.program_code, sub.semester, sub.credits, sub.type, sub.faculty_email, sub.description, sub.status]);
    }
    console.log(`✔ Students (${SAMPLE_STUDENTS.length}) and Subjects (${SAMPLE_SUBJECTS.length}) verified.`);

    // 10. Seed Attendance, Timetables, Notices, Exams, Results, Assignments, Submissions
    console.log('\n[10/11] 📑 Seeding academic DMS records (Attendance, Timetable, Notices, Exams, Results, Assignments)...');
    
    // Attendance
    for (const a of SAMPLE_ATTENDANCE) {
      await client.query(`
        INSERT INTO attendance (student_id, subject_id, date, status, marked_by, remarks)
        VALUES (
          (SELECT id FROM students WHERE enrollment_no = $1),
          (SELECT id FROM subjects WHERE subject_code = $2),
          $3, $4,
          (SELECT id FROM faculty WHERE email = $5),
          $6
        )
        ON CONFLICT (student_id, subject_id, date) DO NOTHING;
      `, [a.enrollment_no, a.subject_code, a.date, a.status, a.marked_by_email, a.remarks]);
    }

    // Timetables
    for (const t of SAMPLE_TIMETABLES) {
      await client.query(`
        INSERT INTO timetables (department_id, program_id, semester, day_of_week, time_slot, subject_id, faculty_id, classroom)
        VALUES (
          (SELECT id FROM departments WHERE department_code = $1),
          (SELECT id FROM programs WHERE program_code = $2),
          $3, $4, $5,
          (SELECT id FROM subjects WHERE subject_code = $6),
          (SELECT id FROM faculty WHERE email = $7),
          $8
        )
        ON CONFLICT (department_id, semester, day_of_week, time_slot, classroom) DO NOTHING;
      `, [t.department_code, t.program_code, t.semester, t.day_of_week, t.time_slot, t.subject_code, t.faculty_email, t.classroom]);
    }

    // Notices
    for (const n of SAMPLE_NOTICES) {
      await client.query(`
        INSERT INTO notices (title, category, target_role, department_id, content, publish_date, priority, posted_by)
        VALUES (
          $1, $2, $3,
          (CASE WHEN $4::text IS NOT NULL THEN (SELECT id FROM departments WHERE department_code = $4) ELSE NULL END),
          $5, $6, $7, $8
        )
        ON CONFLICT (title, publish_date) DO NOTHING;
      `, [n.title, n.category, n.target_role, n.department_code, n.content, n.publish_date, n.priority, n.posted_by]);
    }

    // Exams
    for (const e of SAMPLE_EXAMS) {
      await client.query(`
        INSERT INTO exams (exam_name, subject_id, exam_date, time_slot, classroom, max_marks, passing_marks, status)
        VALUES (
          $1,
          (SELECT id FROM subjects WHERE subject_code = $2),
          $3, $4, $5, $6, $7, $8
        )
        ON CONFLICT (subject_id, exam_name, exam_date) DO NOTHING;
      `, [e.exam_name, e.subject_code, e.exam_date, e.time_slot, e.classroom, e.max_marks, e.passing_marks, e.status]);
    }

    // Exam Results
    for (const r of SAMPLE_EXAM_RESULTS) {
      await client.query(`
        INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade, remarks)
        VALUES (
          (SELECT id FROM exams WHERE exam_name = $1 LIMIT 1),
          (SELECT id FROM students WHERE enrollment_no = $2),
          $3, $4, $5
        )
        ON CONFLICT (exam_id, student_id) DO NOTHING;
      `, [r.exam_name, r.enrollment_no, r.marks_obtained, r.grade, r.remarks]);
    }

    // Assignments
    for (const asg of SAMPLE_ASSIGNMENTS) {
      await client.query(`
        INSERT INTO assignments (title, subject_id, department_id, semester, description, due_date, max_marks, created_by)
        VALUES (
          $1,
          (SELECT id FROM subjects WHERE subject_code = $2),
          (SELECT id FROM departments WHERE department_code = $3),
          $4, $5, $6, $7,
          (SELECT id FROM faculty WHERE email = $8)
        )
        ON CONFLICT (subject_id, title) DO NOTHING;
      `, [asg.title, asg.subject_code, asg.department_code, asg.semester, asg.description, asg.due_date, asg.max_marks, asg.created_by_email]);
    }

    // Assignment Submissions
    for (const sub of SAMPLE_ASSIGNMENT_SUBMISSIONS) {
      await client.query(`
        INSERT INTO assignment_submissions (assignment_id, student_id, submission_content, submission_text, submission_file_url, status, marks_obtained, feedback)
        VALUES (
          (SELECT id FROM assignments WHERE title = $1 LIMIT 1),
          (SELECT id FROM students WHERE enrollment_no = $2),
          $3, $4, $5, $6, $7, $8
        )
        ON CONFLICT (assignment_id, student_id) DO NOTHING;
      `, [sub.assignment_title, sub.enrollment_no, sub.submission_content, sub.submission_text, sub.submission_file_url, sub.status, sub.marks_obtained, sub.feedback]);
    }
    console.log('✔ Attendance, Timetables, Notices, Exams, Results, and Assignments verified.');

    // 11. Synchronize PostgreSQL SERIAL Sequences
    console.log('\n[11/11] 🔄 Synchronizing PostgreSQL auto-increment sequence counters...');
    const tablesWithSequences = [
      'users', 'academic_sessions', 'schools', 'departments', 'faculty',
      'programs', 'students', 'subjects', 'attendance', 'timetables',
      'notices', 'exams', 'exam_results', 'assignments', 'assignment_submissions', 'password_resets'
    ];

    for (const tbl of tablesWithSequences) {
      try {
        await client.query(`
          SELECT setval(
            pg_get_serial_sequence('${tbl}', 'id'),
            COALESCE((SELECT MAX(id) FROM ${tbl}), 1),
            true
          );
        `);
      } catch (seqErr) {
        // Fallback for explicitly named sequences
        try {
          await client.query(`SELECT setval('${tbl}_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ${tbl}), true);`);
        } catch (_) {}
      }
    }
    console.log('✔ All database sequences synchronized.');

    // Verification Report
    const countQueries = tablesWithSequences.map(tbl => `(SELECT count(*) FROM ${tbl}) AS ${tbl}`);
    const summaryRes = await client.query(`SELECT ${countQueries.join(', ')};`);
    const counts = summaryRes.rows[0];

    client.release();

    console.log('\n===============================================================');
    console.log('🎉 POSTGRESQL DATABASE SEEDED SUCCESSFULLY');
    console.log('===============================================================');
    console.table([
      { Entity: 'Users (Admin/Dean)', Table: 'users', Records: counts.users },
      { Entity: 'Academic Sessions', Table: 'academic_sessions', Records: counts.academic_sessions },
      { Entity: 'Schools & Institutes', Table: 'schools', Records: counts.schools },
      { Entity: 'Departments', Table: 'departments', Records: counts.departments },
      { Entity: 'Faculty Members', Table: 'faculty', Records: counts.faculty },
      { Entity: 'Academic Programs', Table: 'programs', Records: counts.programs },
      { Entity: 'Students', Table: 'students', Records: counts.students },
      { Entity: 'Subjects & Courses', Table: 'subjects', Records: counts.subjects },
      { Entity: 'Attendance Records', Table: 'attendance', Records: counts.attendance },
      { Entity: 'Timetable Slots', Table: 'timetables', Records: counts.timetables },
      { Entity: 'Notices & Circulars', Table: 'notices', Records: counts.notices },
      { Entity: 'Examinations', Table: 'exams', Records: counts.exams },
      { Entity: 'Exam Results', Table: 'exam_results', Records: counts.exam_results },
      { Entity: 'Assignments', Table: 'assignments', Records: counts.assignments },
      { Entity: 'Assignment Submissions', Table: 'assignment_submissions', Records: counts.assignment_submissions }
    ]);
    console.log('===============================================================');
    console.log('🔑 Default Credentials:');
    console.log('   Admin:   admin@ljku.edu.in       / admin123');
    console.log('   Dean:    dean.academic@ljku.edu.in / admin123');
    console.log('   Faculty: amit.patel@ljku.edu.in   / admin123');
    console.log('   Student: aarav.patel@ljku.edu.in  / admin123');
    console.log('===============================================================\n');

    await pool.end();
    return { success: true, counts };
  } catch (err) {
    console.error('\n❌ \x1b[31m[Seed Execution Error]\x1b[0m', err.message);
    console.error(err.stack);
    try {
      await pool.end();
    } catch (_) {}
    process.exit(1);
  }
}

// Execute directly if run via CLI
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
