/**
 * =========================================================================
 * LJ UNIVERSITY ERP - PHASE 2 MODULE 12: DEPARTMENT MANAGEMENT SYSTEM
 * Dedicated Portable & Idempotent Database Seeding Script
 * Complete Multi-Branch Engineering & Multi-Module Dataset
 * =========================================================================
 * 
 * Single Command: npm run seed
 * Repeatable, Safe (ON CONFLICT), and Fully Dynamic (No SQL files).
 * =========================================================================
 */

const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);

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
// 1. EMBEDDED DDL SCHEMA DEFINITIONS
// ---------------------------------------------------------------------------
const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

ALTER TABLE faculty ADD COLUMN IF NOT EXISTS password VARCHAR(255);

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

CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    reset_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS submission_text TEXT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS submission_file_url TEXT;

CREATE TABLE IF NOT EXISTS student_academic_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year VARCHAR(50),
    total_credits INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    sgpa NUMERIC(4, 2),
    cgpa NUMERIC(4, 2),
    status VARCHAR(50) DEFAULT 'Passed',
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_semester UNIQUE(student_id, semester)
);

CREATE INDEX IF NOT EXISTS idx_academic_sessions_status ON academic_sessions(status);
CREATE INDEX IF NOT EXISTS idx_departments_school_id ON departments(school_id);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);
CREATE INDEX IF NOT EXISTS idx_faculty_department_id ON faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_programs_department_id ON programs(department_id);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_no);
CREATE INDEX IF NOT EXISTS idx_students_semester ON students(current_semester);
CREATE INDEX IF NOT EXISTS idx_subjects_dept ON subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject ON attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_timetables_dept ON timetables(department_id);
CREATE INDEX IF NOT EXISTS idx_timetables_semester ON timetables(semester);
CREATE INDEX IF NOT EXISTS idx_academic_history_student ON student_academic_history(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_history_semester ON student_academic_history(semester);

CREATE UNIQUE INDEX IF NOT EXISTS uq_timetables_slot ON timetables (department_id, semester, day_of_week, time_slot, classroom);
CREATE UNIQUE INDEX IF NOT EXISTS uq_notices_title_date ON notices (title, publish_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_exams_subject_name_date ON exams (subject_id, exam_name, exam_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignments_subject_title ON assignments (subject_id, title);
`;

// -------------------------------------------------------------
// 2. DATASETS
// -------------------------------------------------------------
const SAMPLE_USERS = [
  {
    "name": "University Super Administrator",
    "email": "admin@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "role": "admin",
    "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    "name": "Dr. Rajesh Sharma",
    "email": "dean.academic@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "role": "dean",
    "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  }
];
const SAMPLE_ACADEMIC_SESSIONS = [
  {
    "session_name": "2023\u20132024",
    "term": "Academic Year (Archived History)",
    "start_date": "2023-07-01",
    "end_date": "2024-06-30",
    "status": "Archived",
    "is_current": false
  },
  {
    "session_name": "2024\u20132025",
    "term": "Academic Year (Archived History)",
    "start_date": "2024-07-01",
    "end_date": "2025-06-30",
    "status": "Archived",
    "is_current": false
  },
  {
    "session_name": "2025\u20132026",
    "term": "Academic Year (Archived History)",
    "start_date": "2025-07-01",
    "end_date": "2026-06-30",
    "status": "Archived",
    "is_current": false
  },
  {
    "session_name": "2026\u20132027",
    "term": "Fall & Spring (Full Year / Odd + Even Semesters)",
    "start_date": "2026-07-01",
    "end_date": "2027-06-30",
    "status": "Active",
    "is_current": true
  },
  {
    "session_name": "2027\u20132028",
    "term": "Academic Planning Phase",
    "start_date": "2027-07-01",
    "end_date": "2028-06-30",
    "status": "Upcoming",
    "is_current": false
  }
];
const SAMPLE_SCHOOLS = [
  {
    "school_name": "School of Engineering & Technology (SET)",
    "school_code": "LJU-SET",
    "dean_name": "Dr. Rajesh Sharma",
    "contact_email": "dean.set@ljku.edu.in",
    "contact_phone": "+91 79 2970 0001",
    "building": "Engineering Block A",
    "status": "Active"
  },
  {
    "school_name": "School of Business & Law (SBL)",
    "school_code": "LJU-SBL",
    "dean_name": "Dr. Meena Agarwal",
    "contact_email": "dean.sbl@ljku.edu.in",
    "contact_phone": "+91 79 2970 0002",
    "building": "Management Tower B",
    "status": "Active"
  },
  {
    "school_name": "School of Applied Sciences & Technology (SAP)",
    "school_code": "LJU-SAP",
    "dean_name": "Dr. Alok Verma",
    "contact_email": "dean.sap@ljku.edu.in",
    "contact_phone": "+91 79 2970 0003",
    "building": "Science Complex C",
    "status": "Active"
  },
  {
    "school_name": "School of Pharmacy (SOP)",
    "school_code": "LJU-SOP",
    "dean_name": "Dr. Hemant Patel",
    "contact_email": "dean.sop@ljku.edu.in",
    "contact_phone": "+91 79 2970 0004",
    "building": "Pharmacy Wing D",
    "status": "Active"
  },
  {
    "school_name": "School of Architecture & Planning (SOA)",
    "school_code": "LJU-SOA",
    "dean_name": "Ar. Vikram Trivedi",
    "contact_email": "dean.soa@ljku.edu.in",
    "contact_phone": "+91 79 2970 0005",
    "building": "Design Studio E",
    "status": "Active"
  }
];
const SAMPLE_DEPARTMENTS = [
  {
    "department_name": "Computer Science & Engineering",
    "department_code": "CSE",
    "school_code": "LJU-SET",
    "email": "cse@ljku.edu.in",
    "phone": "+91 79 2970 0101",
    "established_year": 2007,
    "building": "Engineering Block A",
    "room_no": "A-301",
    "description": "Premier department specializing in Software Engineering, Systems, Cloud Computing, and Artificial Intelligence.",
    "status": "Active"
  },
  {
    "department_name": "Information Technology",
    "department_code": "IT",
    "school_code": "LJU-SET",
    "email": "it@ljku.edu.in",
    "phone": "+91 79 2970 0102",
    "established_year": 2008,
    "building": "Engineering Block A",
    "room_no": "A-401",
    "description": "Leading education in Cybersecurity, Network Infrastructure, Cloud Computing, and Full Stack Web Systems.",
    "status": "Active"
  },
  {
    "department_name": "Artificial Intelligence & Machine Learning",
    "department_code": "AIML",
    "school_code": "LJU-SET",
    "email": "aiml@ljku.edu.in",
    "phone": "+91 79 2970 0103",
    "established_year": 2020,
    "building": "Engineering Block A",
    "room_no": "A-501",
    "description": "Cutting-edge program covering Deep Learning, NLP, Computer Vision, Autonomous Systems, and Large Language Models.",
    "status": "Active"
  },
  {
    "department_name": "Electronics & Communication Engineering",
    "department_code": "ECE",
    "school_code": "LJU-SET",
    "email": "ece@ljku.edu.in",
    "phone": "+91 79 2970 0104",
    "established_year": 2007,
    "building": "Engineering Block A",
    "room_no": "A-201",
    "description": "Advanced curriculum in VLSI Design, Embedded Systems, IoT, Robotics, and Wireless Telecommunications.",
    "status": "Active"
  },
  {
    "department_name": "Mechanical Engineering",
    "department_code": "ME",
    "school_code": "LJU-SET",
    "email": "me@ljku.edu.in",
    "phone": "+91 79 2970 0105",
    "established_year": 2007,
    "building": "Engineering Workshop F",
    "room_no": "F-101",
    "description": "Thermal Engineering, CAD/CAM, Robotics, Industrial Automation, and Sustainable Manufacturing.",
    "status": "Active"
  },
  {
    "department_name": "Civil Engineering",
    "department_code": "CE",
    "school_code": "LJU-SET",
    "email": "civil@ljku.edu.in",
    "phone": "+91 79 2970 0106",
    "established_year": 2009,
    "building": "Engineering Block A",
    "room_no": "A-101",
    "description": "Structural Analysis, Geotechnical Studies, Environmental Management, and Smart Urban Infrastructure.",
    "status": "Active"
  },
  {
    "department_name": "Chemical Engineering",
    "department_code": "CH",
    "school_code": "LJU-SET",
    "email": "chem@ljku.edu.in",
    "phone": "+91 79 2970 0107",
    "established_year": 2011,
    "building": "Science Complex C",
    "room_no": "C-201",
    "description": "Process Design, Petrochemicals, Polymer Technology, and Green Sustainable Chemical Processes.",
    "status": "Active"
  },
  {
    "department_name": "Department of Management Studies",
    "department_code": "MBA",
    "school_code": "LJU-SBL",
    "email": "mba@ljku.edu.in",
    "phone": "+91 79 2970 0201",
    "established_year": 2010,
    "building": "Management Tower B",
    "room_no": "B-301",
    "description": "Postgraduate MBA programs in Finance, Marketing, Operations, Human Resources, and FinTech.",
    "status": "Active"
  },
  {
    "department_name": "Business Administration (BBA)",
    "department_code": "BBA",
    "school_code": "LJU-SBL",
    "email": "bba@ljku.edu.in",
    "phone": "+91 79 2970 0202",
    "established_year": 2012,
    "building": "Management Tower B",
    "room_no": "B-101",
    "description": "Undergraduate business foundational leadership, Entrepreneurship, Accounting, and Global Commerce.",
    "status": "Active"
  },
  {
    "department_name": "Department of Pharmaceutical Sciences",
    "department_code": "BPHARM",
    "school_code": "LJU-SOP",
    "email": "pharmacy@ljku.edu.in",
    "phone": "+91 79 2970 0301",
    "established_year": 2010,
    "building": "Pharmacy Wing D",
    "room_no": "D-201",
    "description": "Pharmaceutics, Clinical Pharmacology, Drug Discovery, Quality Assurance, and Regulatory Affairs.",
    "status": "Active"
  },
  {
    "department_name": "Department of Advanced Pharmacology",
    "department_code": "MPHARM",
    "school_code": "LJU-SOP",
    "email": "mpharm@ljku.edu.in",
    "phone": "+91 79 2970 0302",
    "established_year": 2014,
    "building": "Pharmacy Wing D",
    "room_no": "D-301",
    "description": "Postgraduate specialized research in Molecular Pharmacology, Toxicology, and Bio-therapeutics.",
    "status": "Active"
  },
  {
    "department_name": "Department of Architecture & Planning",
    "department_code": "BARCH",
    "school_code": "LJU-SOA",
    "email": "arch@ljku.edu.in",
    "phone": "+91 79 2970 0401",
    "established_year": 2015,
    "building": "Design Studio E",
    "room_no": "E-201",
    "description": "Urban Design, Sustainable Architecture, Interior Architecture, Landscape, and Heritage Conservation.",
    "status": "Active"
  }
];
const SAMPLE_FACULTY = [
  {
    "department_code": "CSE",
    "name": "Dr. Amit Patel",
    "email": "amit.patel@ljku.edu.in",
    "phone": "+91 98250 11001",
    "designation": "Professor & HOD",
    "qualification": "Ph.D. in Computer Science (IIT Bombay)",
    "specialization": "Distributed Systems, Cloud Architecture & Cloud Security",
    "joining_date": "2015-06-15",
    "experience_years": 15,
    "status": "Active"
  },
  {
    "department_code": "CSE",
    "name": "Dr. Neha Shah",
    "email": "neha.shah@ljku.edu.in",
    "phone": "+91 98250 11002",
    "designation": "Associate Professor",
    "qualification": "Ph.D. in Database Engineering",
    "specialization": "Database Systems, Big Data & Query Optimization",
    "joining_date": "2017-08-01",
    "experience_years": 11,
    "status": "Active"
  },
  {
    "department_code": "CSE",
    "name": "Prof. Rahul Mehta",
    "email": "rahul.mehta@ljku.edu.in",
    "phone": "+91 98250 11003",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Information Security",
    "specialization": "Computer Networks, Cryptography & Cyber Defense",
    "joining_date": "2019-01-10",
    "experience_years": 7,
    "status": "Active"
  },
  {
    "department_code": "CSE",
    "name": "Dr. Priya Joshi",
    "email": "priya.joshi@ljku.edu.in",
    "phone": "+91 98250 11004",
    "designation": "Associate Professor",
    "qualification": "Ph.D. in Software Engineering",
    "specialization": "Full Stack Web Architecture & Microservices",
    "joining_date": "2018-07-20",
    "experience_years": 10,
    "status": "Active"
  },
  {
    "department_code": "CSE",
    "name": "Dr. Tanvi Trivedi",
    "email": "tanvi.trivedi@ljku.edu.in",
    "phone": "+91 98250 11005",
    "designation": "Professor",
    "qualification": "Ph.D. in Applied Mathematics",
    "specialization": "Algorithms, Graph Theory & Mathematical Modeling",
    "joining_date": "2014-03-01",
    "experience_years": 16,
    "status": "Active"
  },
  {
    "department_code": "IT",
    "name": "Dr. Sanjay Solanki",
    "email": "sanjay.solanki@ljku.edu.in",
    "phone": "+91 98250 11006",
    "designation": "Professor & HOD",
    "qualification": "Ph.D. in Information Technology",
    "specialization": "Cloud Infrastructure, DevOps & Containerization",
    "joining_date": "2016-07-01",
    "experience_years": 14,
    "status": "Active"
  },
  {
    "department_code": "IT",
    "name": "Prof. Bhavin Panchal",
    "email": "bhavin.panchal@ljku.edu.in",
    "phone": "+91 98250 11007",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Web Technologies",
    "specialization": "Frontend Frameworks, Mobile Systems & Python",
    "joining_date": "2020-09-15",
    "experience_years": 6,
    "status": "Active"
  },
  {
    "department_code": "IT",
    "name": "Dr. Sneha Kapadia",
    "email": "sneha.kapadia@ljku.edu.in",
    "phone": "+91 98250 11008",
    "designation": "Associate Professor",
    "qualification": "Ph.D. in Cyber Defense",
    "specialization": "Information Security, Ethical Hacking & Forensics",
    "joining_date": "2018-11-01",
    "experience_years": 12,
    "status": "Active"
  },
  {
    "department_code": "IT",
    "name": "Prof. Akash Varma",
    "email": "akash.varma@ljku.edu.in",
    "phone": "+91 98250 11021",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Computer Networks",
    "specialization": "Software Defined Networks & Distributed Storage",
    "joining_date": "2021-03-15",
    "experience_years": 5,
    "status": "Active"
  },
  {
    "department_code": "AIML",
    "name": "Dr. Kunal Shah",
    "email": "kunal.shah@ljku.edu.in",
    "phone": "+91 98250 11009",
    "designation": "Professor & HOD",
    "qualification": "Ph.D. in Artificial Intelligence (IISc Bangalore)",
    "specialization": "Deep Learning, Computer Vision & Transformers",
    "joining_date": "2020-01-05",
    "experience_years": 13,
    "status": "Active"
  },
  {
    "department_code": "AIML",
    "name": "Dr. Ritu Parikh",
    "email": "ritu.parikh@ljku.edu.in",
    "phone": "+91 98250 11010",
    "designation": "Associate Professor",
    "qualification": "Ph.D. in Computational Linguistics",
    "specialization": "Natural Language Processing, Speech & LLMs",
    "joining_date": "2021-06-10",
    "experience_years": 9,
    "status": "Active"
  },
  {
    "department_code": "AIML",
    "name": "Prof. Ishan Vyas",
    "email": "ishan.vyas@ljku.edu.in",
    "phone": "+91 98250 11022",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Data Science & Machine Learning",
    "specialization": "Reinforcement Learning & Statistical Modeling",
    "joining_date": "2022-01-10",
    "experience_years": 5,
    "status": "Active"
  },
  {
    "department_code": "AIML",
    "name": "Dr. Deepali Dave",
    "email": "deepali.dave@ljku.edu.in",
    "phone": "+91 98250 11023",
    "designation": "Associate Professor",
    "qualification": "Ph.D. in Computer Vision",
    "specialization": "Autonomous Systems, Generative AI & Edge Inference",
    "joining_date": "2021-08-01",
    "experience_years": 10,
    "status": "Active"
  },
  {
    "department_code": "ECE",
    "name": "Dr. Hardik Vyas",
    "email": "hardik.vyas@ljku.edu.in",
    "phone": "+91 98250 11011",
    "designation": "Professor & HOD",
    "qualification": "Ph.D. in Microelectronics",
    "specialization": "VLSI Design, Embedded Hardware & IoT Systems",
    "joining_date": "2015-08-15",
    "experience_years": 15,
    "status": "Active"
  },
  {
    "department_code": "ECE",
    "name": "Prof. Deepa Dave",
    "email": "deepa.dave@ljku.edu.in",
    "phone": "+91 98250 11012",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Signal Processing",
    "specialization": "Digital Communication, Antennas & Green Systems",
    "joining_date": "2019-07-01",
    "experience_years": 7,
    "status": "Active"
  },
  {
    "department_code": "ECE",
    "name": "Dr. Ketan Mehta",
    "email": "ketan.mehta@ljku.edu.in",
    "phone": "+91 98250 11024",
    "designation": "Associate Professor",
    "qualification": "Ph.D. in Wireless Communications",
    "specialization": "5G/6G Networks, MIMO Antennas & RF Design",
    "joining_date": "2017-02-01",
    "experience_years": 12,
    "status": "Active"
  },
  {
    "department_code": "ECE",
    "name": "Prof. Swati Joshi",
    "email": "swati.joshi@ljku.edu.in",
    "phone": "+91 98250 11025",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Embedded Systems",
    "specialization": "Microcontrollers, ARM Architecture & Edge Sensors",
    "joining_date": "2020-07-15",
    "experience_years": 6,
    "status": "Active"
  },
  {
    "department_code": "ME",
    "name": "Dr. Vikram Rathod",
    "email": "vikram.rathod@ljku.edu.in",
    "phone": "+91 98250 11013",
    "designation": "Professor & HOD",
    "qualification": "Ph.D. in Mechanical Engineering",
    "specialization": "Thermal Fluid Systems & Advanced CAD/CAM",
    "joining_date": "2013-05-12",
    "experience_years": 17,
    "status": "Active"
  },
  {
    "department_code": "ME",
    "name": "Prof. Nilesh Soni",
    "email": "nilesh.soni@ljku.edu.in",
    "phone": "+91 98250 11014",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Industrial Automation",
    "specialization": "Robotic Automation & Precision Manufacturing",
    "joining_date": "2018-08-20",
    "experience_years": 8,
    "status": "Active"
  },
  {
    "department_code": "ME",
    "name": "Dr. Rajesh Trivedi",
    "email": "rajesh.trivedi@ljku.edu.in",
    "phone": "+91 98250 11026",
    "designation": "Professor",
    "qualification": "Ph.D. in Machine Design",
    "specialization": "Finite Element Analysis & Fracture Mechanics",
    "joining_date": "2014-06-01",
    "experience_years": 16,
    "status": "Active"
  },
  {
    "department_code": "ME",
    "name": "Prof. Rakesh Solanki",
    "email": "rakesh.solanki@ljku.edu.in",
    "phone": "+91 98250 11027",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Thermal Engineering",
    "specialization": "Renewable Energy, HVAC & Heat Transfer",
    "joining_date": "2019-11-10",
    "experience_years": 6,
    "status": "Active"
  },
  {
    "department_code": "CE",
    "name": "Dr. Parth Chokshi",
    "email": "parth.chokshi@ljku.edu.in",
    "phone": "+91 98250 11015",
    "designation": "Professor & HOD",
    "qualification": "Ph.D. in Structural Engineering",
    "specialization": "Earthquake Engineering & Smart Urban Infrastructure",
    "joining_date": "2014-09-01",
    "experience_years": 16,
    "status": "Active"
  },
  {
    "department_code": "CE",
    "name": "Dr. Bhavesh Bhatt",
    "email": "bhavesh.bhatt@ljku.edu.in",
    "phone": "+91 98250 11028",
    "designation": "Associate Professor",
    "qualification": "Ph.D. in Geotechnical Engineering",
    "specialization": "Soil Dynamics, Foundation Design & GIS",
    "joining_date": "2016-03-15",
    "experience_years": 13,
    "status": "Active"
  },
  {
    "department_code": "CE",
    "name": "Prof. Ankit Raval",
    "email": "ankit.raval@ljku.edu.in",
    "phone": "+91 98250 11029",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Environmental Engineering",
    "specialization": "Water Resources, Hydrology & Waste Management",
    "joining_date": "2020-01-20",
    "experience_years": 6,
    "status": "Active"
  },
  {
    "department_code": "CE",
    "name": "Prof. Varun Trivedi",
    "email": "varun.trivedi@ljku.edu.in",
    "phone": "+91 98250 11030",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Transportation Engineering",
    "specialization": "Highway Engineering & Smart Traffic Modeling",
    "joining_date": "2021-07-01",
    "experience_years": 5,
    "status": "Active"
  },
  {
    "department_code": "CH",
    "name": "Dr. Jignesh Raval",
    "email": "jignesh.raval@ljku.edu.in",
    "phone": "+91 98250 11016",
    "designation": "Professor & HOD",
    "qualification": "Ph.D. in Chemical Engineering",
    "specialization": "Reaction Kinetics & Sustainable Process Engineering",
    "joining_date": "2015-02-15",
    "experience_years": 14,
    "status": "Active"
  },
  {
    "department_code": "CH",
    "name": "Prof. Megha Shah",
    "email": "megha.shah@ljku.edu.in",
    "phone": "+91 98250 11031",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Chemical Process Design",
    "specialization": "Thermodynamics, Mass Transfer & Distillation",
    "joining_date": "2019-08-01",
    "experience_years": 7,
    "status": "Active"
  },
  {
    "department_code": "CH",
    "name": "Dr. Alkesh Parmar",
    "email": "alkesh.parmar@ljku.edu.in",
    "phone": "+91 98250 11032",
    "designation": "Associate Professor",
    "qualification": "Ph.D. in Polymer Science & Engineering",
    "specialization": "Polymer Rheology, Petrochemicals & Catalysis",
    "joining_date": "2017-10-15",
    "experience_years": 11,
    "status": "Active"
  },
  {
    "department_code": "CH",
    "name": "Prof. Pooja Desai",
    "email": "pooja.desai@ljku.edu.in",
    "phone": "+91 98250 11033",
    "designation": "Assistant Professor",
    "qualification": "M.Tech in Industrial Pollution Abatement",
    "specialization": "Effluent Treatment & Industrial Safety Hazards",
    "joining_date": "2021-04-10",
    "experience_years": 5,
    "status": "Active"
  },
  {
    "department_code": "MBA",
    "name": "Dr. Manish Gadhvi",
    "email": "manish.gadhvi@ljku.edu.in",
    "phone": "+91 98250 11017",
    "designation": "Professor & HOD",
    "qualification": "Ph.D. in Financial Economics & MBA",
    "specialization": "Corporate Finance, Investment Banking & FinTech",
    "joining_date": "2016-04-10",
    "experience_years": 18,
    "status": "Active"
  },
  {
    "department_code": "BBA",
    "name": "Prof. Pooja Vora",
    "email": "pooja.vora@ljku.edu.in",
    "phone": "+91 98250 11018",
    "designation": "Assistant Professor & Coordinator",
    "qualification": "MBA in Marketing & Communication",
    "specialization": "Strategic Marketing, Communication & Leadership",
    "joining_date": "2019-06-01",
    "experience_years": 7,
    "status": "Active"
  },
  {
    "department_code": "BPHARM",
    "name": "Dr. Devendra Parmar",
    "email": "devendra.parmar@ljku.edu.in",
    "phone": "+91 98250 11019",
    "designation": "Professor & HOD",
    "qualification": "Ph.D. in Pharmaceutical Sciences",
    "specialization": "Novel Drug Delivery Systems & Bio-Therapeutics",
    "joining_date": "2014-11-20",
    "experience_years": 17,
    "status": "Active"
  },
  {
    "department_code": "BARCH",
    "name": "Ar. Sunita Iyer",
    "email": "sunita.iyer@ljku.edu.in",
    "phone": "+91 98250 11020",
    "designation": "Professor & HOD",
    "qualification": "M.Arch in Urban Planning",
    "specialization": "Sustainable Urban Planning & Heritage Architecture",
    "joining_date": "2017-01-15",
    "experience_years": 15,
    "status": "Active"
  }
];
const SAMPLE_PROGRAMS = [
  {
    "program_name": "B.Tech in Computer Science & Engineering",
    "program_code": "BTECH-CSE",
    "department_code": "CSE",
    "degree_level": "Undergraduate (B.Tech)",
    "intake_capacity": 180,
    "duration_years": 4,
    "status": "Active"
  },
  {
    "program_name": "B.Tech in Information Technology",
    "program_code": "BTECH-IT",
    "department_code": "IT",
    "degree_level": "Undergraduate (B.Tech)",
    "intake_capacity": 120,
    "duration_years": 4,
    "status": "Active"
  },
  {
    "program_name": "B.Tech in AI & Data Science",
    "program_code": "BTECH-AIDS",
    "department_code": "AIML",
    "degree_level": "Undergraduate (B.Tech)",
    "intake_capacity": 120,
    "duration_years": 4,
    "status": "Active"
  },
  {
    "program_name": "B.Tech in Electronics & Communication",
    "program_code": "BTECH-ECE",
    "department_code": "ECE",
    "degree_level": "Undergraduate (B.Tech)",
    "intake_capacity": 90,
    "duration_years": 4,
    "status": "Active"
  },
  {
    "program_name": "B.Tech in Mechanical Engineering",
    "program_code": "BTECH-ME",
    "department_code": "ME",
    "degree_level": "Undergraduate (B.Tech)",
    "intake_capacity": 90,
    "duration_years": 4,
    "status": "Active"
  },
  {
    "program_name": "B.Tech in Civil Engineering",
    "program_code": "BTECH-CE",
    "department_code": "CE",
    "degree_level": "Undergraduate (B.Tech)",
    "intake_capacity": 60,
    "duration_years": 4,
    "status": "Active"
  },
  {
    "program_name": "B.Tech in Chemical Engineering",
    "program_code": "BTECH-CH",
    "department_code": "CH",
    "degree_level": "Undergraduate (B.Tech)",
    "intake_capacity": 60,
    "duration_years": 4,
    "status": "Active"
  },
  {
    "program_name": "M.Tech in Computer Science & Engineering",
    "program_code": "MTECH-CSE",
    "department_code": "CSE",
    "degree_level": "Postgraduate (M.Tech)",
    "intake_capacity": 30,
    "duration_years": 2,
    "status": "Active"
  },
  {
    "program_name": "Master of Business Administration (Core)",
    "program_code": "MBA-CORE",
    "department_code": "MBA",
    "degree_level": "Postgraduate (MBA)",
    "intake_capacity": 120,
    "duration_years": 2,
    "status": "Active"
  },
  {
    "program_name": "Bachelor of Business Administration (Hons)",
    "program_code": "BBA-HONS",
    "department_code": "BBA",
    "degree_level": "Undergraduate (BBA)",
    "intake_capacity": 120,
    "duration_years": 3,
    "status": "Active"
  },
  {
    "program_name": "Bachelor of Pharmacy (B.Pharm)",
    "program_code": "BPHARM-UG",
    "department_code": "BPHARM",
    "degree_level": "Undergraduate (B.Pharm)",
    "intake_capacity": 100,
    "duration_years": 4,
    "status": "Active"
  },
  {
    "program_name": "Bachelor of Architecture (B.Arch)",
    "program_code": "BARCH-DES",
    "department_code": "BARCH",
    "degree_level": "Undergraduate (B.Arch)",
    "intake_capacity": 40,
    "duration_years": 5,
    "status": "Active"
  }
];
const SAMPLE_SUBJECTS = [
  {
    "subject_name": "Engineering Mathematics I",
    "subject_code": "CSE-101",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "description": "Calculus, infinite series, partial differentiation, and multiple integrals with engineering applications.",
    "status": "Active"
  },
  {
    "subject_name": "Programming for Problem Solving with C",
    "subject_code": "CSE-102",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "description": "Structured programming, control structures, pointers, dynamic memory allocation, and file processing in C.",
    "status": "Active"
  },
  {
    "subject_name": "Basic Electrical & Electronics Engineering",
    "subject_code": "CSE-103",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "description": "DC & AC circuit laws, semiconductor diodes, transistors, logic gates, and magnetic circuits.",
    "status": "Active"
  },
  {
    "subject_name": "Professional Communication Skills",
    "subject_code": "CSE-104",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "credits": 2,
    "type": "Theory",
    "faculty_email": "pooja.vora@ljku.edu.in",
    "description": "Technical writing, report formulation, corporate correspondence, presentation, and vocal articulation.",
    "status": "Active"
  },
  {
    "subject_name": "Computer Programming in C Lab",
    "subject_code": "CSE-105",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "credits": 2,
    "type": "Practical",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "description": "Practical hands-on laboratory sessions in Linux terminal, GCC compiler, debugging, and pointer arithmetic.",
    "status": "Active"
  },
  {
    "subject_name": "Object Oriented Programming with C++",
    "subject_code": "CSE-201",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "neha.shah@ljku.edu.in",
    "description": "Object-oriented paradigms, classes, inheritance, polymorphism, templates, exception handling, and STL.",
    "status": "Active"
  },
  {
    "subject_name": "Engineering Mathematics II",
    "subject_code": "CSE-202",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "description": "Linear algebra, matrix factorizations, eigenvalues, complex variables, and differential equations.",
    "status": "Active"
  },
  {
    "subject_name": "Digital Logic Design & Microprocessors",
    "subject_code": "CSE-203",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "description": "Boolean algebra, Karnaugh maps, combinational & sequential circuits, flip-flops, and 8085 architecture.",
    "status": "Active"
  },
  {
    "subject_name": "Environmental Sciences & Green Computing",
    "subject_code": "CSE-204",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "credits": 2,
    "type": "Theory",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "description": "Ecology, resource stewardship, carbon footprint reduction, and energy-efficient data center computing.",
    "status": "Active"
  },
  {
    "subject_name": "Data Structures Preparation Lab",
    "subject_code": "CSE-205",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "credits": 2,
    "type": "Practical",
    "faculty_email": "neha.shah@ljku.edu.in",
    "description": "Implementation of dynamic arrays, stacks, queues, and linked lists in C++ with memory profiling.",
    "status": "Active"
  },
  {
    "subject_name": "Data Structures & Algorithms",
    "subject_code": "CSE-301",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "amit.patel@ljku.edu.in",
    "description": "Trees, heaps, graph traversals, greedy algorithms, dynamic programming, and asymptotic computational analysis.",
    "status": "Active"
  },
  {
    "subject_name": "Database Management Systems",
    "subject_code": "CSE-302",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "neha.shah@ljku.edu.in",
    "description": "Relational algebra, SQL, normalization, concurrency control, B+ trees, and transaction processing.",
    "status": "Active"
  },
  {
    "subject_name": "Computer Organization & Architecture",
    "subject_code": "CSE-303",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "description": "Instruction set architectures, pipelining, hazards, memory hierarchy, caches, and superscalar designs.",
    "status": "Active"
  },
  {
    "subject_name": "Discrete Mathematics & Graph Theory",
    "subject_code": "CSE-304",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "description": "Propositional logic, combinatorics, recurrence relations, graph theory, trees, and algebraic systems.",
    "status": "Active"
  },
  {
    "subject_name": "Advanced Data Structures Laboratory",
    "subject_code": "CSE-305",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "credits": 2,
    "type": "Practical",
    "faculty_email": "amit.patel@ljku.edu.in",
    "description": "Hands-on implementation of AVL trees, red-black trees, segment trees, and Dijkstra graph algorithms.",
    "status": "Active"
  },
  {
    "subject_name": "Operating Systems & Kernel Architecture",
    "subject_code": "CSE-401",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "amit.patel@ljku.edu.in",
    "description": "Process scheduling, thread management, synchronization, deadlocks, virtual memory paging, and file systems.",
    "status": "Active"
  },
  {
    "subject_name": "Design & Analysis of Algorithms",
    "subject_code": "CSE-402",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "description": "Divide-and-conquer, dynamic programming, network flows, amortized analysis, and NP-completeness.",
    "status": "Active"
  },
  {
    "subject_name": "Software Engineering & Agile Methodologies",
    "subject_code": "CSE-403",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "description": "SDLC models, Scrum, architectural patterns, UML modeling, automated testing, and CI/CD pipelines.",
    "status": "Active"
  },
  {
    "subject_name": "Theory of Computation & Automata",
    "subject_code": "CSE-404",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "description": "Finite automata, regular expressions, context-free grammars, pushdown automata, and Turing machines.",
    "status": "Active"
  },
  {
    "subject_name": "Operating Systems & Linux Shell Lab",
    "subject_code": "CSE-405",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "credits": 2,
    "type": "Practical",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "description": "POSIX system calls, fork-exec multiprocessing, pthread multi-threading, semaphores, and bash scripting.",
    "status": "Active"
  },
  {
    "subject_name": "Computer Networks & Protocols",
    "subject_code": "CSE-501",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "description": "OSI & TCP/IP stack, routing protocols (OSPF, BGP), congestion control, socket programming, and HTTP/3.",
    "status": "Active"
  },
  {
    "subject_name": "Web Technology & Modern Frameworks",
    "subject_code": "CSE-502",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "description": "Modern reactive frontend architectures, RESTful microservices, state management, and real-time WebSockets.",
    "status": "Active"
  },
  {
    "subject_name": "Cybersecurity Principles & Cryptography",
    "subject_code": "CSE-503",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "description": "Symmetric and asymmetric cryptography, RSA, elliptic curves, PKI, hashing, and defense against attacks.",
    "status": "Active"
  },
  {
    "subject_name": "Cloud Infrastructure & Microservices",
    "subject_code": "CSE-504",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "amit.patel@ljku.edu.in",
    "description": "Virtualization, Docker containers, Kubernetes orchestration, serverless lambdas, and multi-region cloud deployment.",
    "status": "Active"
  },
  {
    "subject_name": "Full Stack Web Engineering Lab",
    "subject_code": "CSE-505",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "credits": 2,
    "type": "Practical",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "description": "End-to-end full stack web application development using React, Node.js, PostgreSQL, and Docker containerization.",
    "status": "Active"
  },
  {
    "subject_name": "Artificial Intelligence & Knowledge Systems",
    "subject_code": "CSE-601",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Search spaces, heuristic search, knowledge representation, Bayesian networks, and expert systems.",
    "status": "Active"
  },
  {
    "subject_name": "Compiler Design & Language Processors",
    "subject_code": "CSE-602",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "description": "Lexical analysis, top-down and bottom-up parsing, intermediate code representation, and code optimization.",
    "status": "Active"
  },
  {
    "subject_name": "Distributed Systems & Cloud Computing",
    "subject_code": "CSE-603",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "amit.patel@ljku.edu.in",
    "description": "Consensus algorithms (Paxos, Raft), CAP theorem, distributed storage systems, and RPC frameworks.",
    "status": "Active"
  },
  {
    "subject_name": "Machine Learning Core Principles",
    "subject_code": "CSE-604",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "description": "Supervised learning, classification, regression, SVM, decision trees, ensemble learning, and evaluation metrics.",
    "status": "Active"
  },
  {
    "subject_name": "AI & Machine Learning Laboratory",
    "subject_code": "CSE-605",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "credits": 2,
    "type": "Practical",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Implementation of gradient descent, neural networks, cross-validation, and computer vision models in Python.",
    "status": "Active"
  },
  {
    "subject_name": "Deep Learning & Computer Vision",
    "subject_code": "CSE-701",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Convolutional neural networks, object detection (YOLO), transfer learning, generative models, and OpenCV.",
    "status": "Active"
  },
  {
    "subject_name": "Natural Language Processing & LLMs",
    "subject_code": "CSE-702",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "description": "Word embeddings, sequence models, self-attention mechanisms, Transformers, BERT, and generative language models.",
    "status": "Active"
  },
  {
    "subject_name": "Blockchain Technology & Smart Contracts",
    "subject_code": "CSE-703",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "description": "Decentralized ledgers, consensus protocols, Ethereum virtual machine, Solidity smart contracts, and Web3.",
    "status": "Active"
  },
  {
    "subject_name": "Minor Engineering Project",
    "subject_code": "CSE-704",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "credits": 3,
    "type": "Practical",
    "faculty_email": "amit.patel@ljku.edu.in",
    "description": "Supervised team project requiring design, implementation, testing, and deployment of a full working software system.",
    "status": "Active"
  },
  {
    "subject_name": "Major Industry Capstone Project",
    "subject_code": "CSE-801",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "credits": 10,
    "type": "Practical",
    "faculty_email": "amit.patel@ljku.edu.in",
    "description": "Full semester capstone project with industry sponsorship, technical thesis report, and viva examination.",
    "status": "Active"
  },
  {
    "subject_name": "Cyber Law, Ethics & Intellectual Property",
    "subject_code": "CSE-802",
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "credits": 2,
    "type": "Theory",
    "faculty_email": "pooja.vora@ljku.edu.in",
    "description": "Digital ethics, Indian IT Act, GDPR, software copyright patents, open-source licensing, and AI governance.",
    "status": "Active"
  },
  {
    "subject_name": "Programming Fundamentals in C",
    "subject_code": "IT-101",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "description": "Comprehensive Programming Fundamentals in C foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Applied Physics for Computing",
    "subject_code": "IT-102",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "description": "Applied Applied Physics for Computing engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Object-Oriented Programming with C++",
    "subject_code": "IT-201",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "description": "Comprehensive Object-Oriented Programming with C++ foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Digital Logic & Discrete Structures",
    "subject_code": "IT-202",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "description": "Applied Digital Logic & Discrete Structures engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Data Structures & Algorithms",
    "subject_code": "IT-301",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "description": "Comprehensive Data Structures & Algorithms foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Web Development Technologies",
    "subject_code": "IT-302",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "description": "Applied Web Development Technologies engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Database Management Systems - IT",
    "subject_code": "IT-401",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "description": "Comprehensive Database Management Systems - IT foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Computer Networks & Protocols",
    "subject_code": "IT-402",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "description": "Applied Computer Networks & Protocols engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Cloud Computing & Virtualization",
    "subject_code": "IT-501",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "description": "Comprehensive Cloud Computing & Virtualization foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Information & Cyber Security",
    "subject_code": "IT-502",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "description": "Applied Information & Cyber Security engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "DevOps & Site Reliability Engineering",
    "subject_code": "IT-601",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "description": "Comprehensive DevOps & Site Reliability Engineering foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Mobile Application Development",
    "subject_code": "IT-602",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "description": "Applied Mobile Application Development engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Distributed Cloud Systems",
    "subject_code": "IT-701",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "description": "Comprehensive Distributed Cloud Systems foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Internet of Things Architecture",
    "subject_code": "IT-702",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "description": "Applied Internet of Things Architecture engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Major Capstone Project - IT",
    "subject_code": "IT-801",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "description": "Comprehensive Major Capstone Project - IT foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Cyber Law, Ethics & Compliance",
    "subject_code": "IT-802",
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "description": "Applied Cyber Law, Ethics & Compliance engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Foundations of AI & Python",
    "subject_code": "AIML-101",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Comprehensive Foundations of AI & Python foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Calculus & Linear Algebra for Data Science",
    "subject_code": "AIML-102",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "description": "Applied Calculus & Linear Algebra for Data Science engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Data Structures for Machine Learning",
    "subject_code": "AIML-201",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Comprehensive Data Structures for Machine Learning foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Probability & Statistical Inference",
    "subject_code": "AIML-202",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "description": "Applied Probability & Statistical Inference engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Mathematical Foundations of AI",
    "subject_code": "AIML-301",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Comprehensive Mathematical Foundations of AI foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Database Systems for Big Data",
    "subject_code": "AIML-302",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "description": "Applied Database Systems for Big Data engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Machine Learning Algorithms & Models",
    "subject_code": "AIML-401",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Comprehensive Machine Learning Algorithms & Models foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Optimization Techniques for AI",
    "subject_code": "AIML-402",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "description": "Applied Optimization Techniques for AI engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Deep Learning & Neural Networks",
    "subject_code": "AIML-501",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Comprehensive Deep Learning & Neural Networks foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Natural Language Processing",
    "subject_code": "AIML-502",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "description": "Applied Natural Language Processing engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Reinforcement Learning & Robotics",
    "subject_code": "AIML-601",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Comprehensive Reinforcement Learning & Robotics foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Generative AI & LLMs",
    "subject_code": "AIML-602",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "description": "Applied Generative AI & LLMs engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Autonomous Systems & Edge AI",
    "subject_code": "AIML-701",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Comprehensive Autonomous Systems & Edge AI foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Ethics & Trustworthy AI",
    "subject_code": "AIML-702",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "description": "Applied Ethics & Trustworthy AI engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Major AI Capstone Project",
    "subject_code": "AIML-801",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "description": "Comprehensive Major AI Capstone Project foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "AI Product Management & Patent Law",
    "subject_code": "AIML-802",
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "description": "Applied AI Product Management & Patent Law engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Basic Electrical Engineering",
    "subject_code": "ECE-101",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "description": "Comprehensive Basic Electrical Engineering foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Engineering Chemistry & Materials",
    "subject_code": "ECE-102",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "description": "Applied Engineering Chemistry & Materials engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Electronic Devices & Circuits",
    "subject_code": "ECE-201",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "description": "Comprehensive Electronic Devices & Circuits foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Network Analysis & Synthesis",
    "subject_code": "ECE-202",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "description": "Applied Network Analysis & Synthesis engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Analog Circuit Design",
    "subject_code": "ECE-301",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "description": "Comprehensive Analog Circuit Design foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Electromagnetic Fields & Waves",
    "subject_code": "ECE-302",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "description": "Applied Electromagnetic Fields & Waves engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Microprocessors & Microcontrollers",
    "subject_code": "ECE-401",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "description": "Comprehensive Microprocessors & Microcontrollers foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Analog & Digital Communications",
    "subject_code": "ECE-402",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "description": "Applied Analog & Digital Communications engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Digital Signal Processing",
    "subject_code": "ECE-501",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "description": "Comprehensive Digital Signal Processing foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "VLSI Design & Verilog HDL",
    "subject_code": "ECE-502",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "description": "Applied VLSI Design & Verilog HDL engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Embedded Systems & RTOS",
    "subject_code": "ECE-601",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "description": "Comprehensive Embedded Systems & RTOS foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Wireless & Cellular Communications",
    "subject_code": "ECE-602",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "description": "Applied Wireless & Cellular Communications engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Optical Fiber Communications",
    "subject_code": "ECE-701",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "description": "Comprehensive Optical Fiber Communications foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "IoT Sensors & Hardware Networks",
    "subject_code": "ECE-702",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "description": "Applied IoT Sensors & Hardware Networks engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Major Capstone Project - ECE",
    "subject_code": "ECE-801",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "description": "Comprehensive Major Capstone Project - ECE foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Telecom Policy & Spectrum Management",
    "subject_code": "ECE-802",
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "description": "Applied Telecom Policy & Spectrum Management engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Engineering Graphics & CAD",
    "subject_code": "ME-101",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "description": "Comprehensive Engineering Graphics & CAD foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Basic Mechanical Engineering",
    "subject_code": "ME-102",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "description": "Applied Basic Mechanical Engineering engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Material Science & Metallurgy",
    "subject_code": "ME-201",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "description": "Comprehensive Material Science & Metallurgy foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Thermodynamics I",
    "subject_code": "ME-202",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "description": "Applied Thermodynamics I engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Mechanics of Solids",
    "subject_code": "ME-301",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "description": "Comprehensive Mechanics of Solids foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Fluid Mechanics",
    "subject_code": "ME-302",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "description": "Applied Fluid Mechanics engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Kinematics of Machinery",
    "subject_code": "ME-401",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "description": "Comprehensive Kinematics of Machinery foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Manufacturing Technology",
    "subject_code": "ME-402",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "description": "Applied Manufacturing Technology engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Dynamics of Machinery",
    "subject_code": "ME-501",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "description": "Comprehensive Dynamics of Machinery foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Heat & Mass Transfer",
    "subject_code": "ME-502",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "description": "Applied Heat & Mass Transfer engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Automobile Engineering",
    "subject_code": "ME-601",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "description": "Comprehensive Automobile Engineering foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Refrigeration & Air Conditioning",
    "subject_code": "ME-602",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "description": "Applied Refrigeration & Air Conditioning engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Computer Integrated Manufacturing",
    "subject_code": "ME-701",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "description": "Comprehensive Computer Integrated Manufacturing foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Robotics & Mechatronics",
    "subject_code": "ME-702",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "description": "Applied Robotics & Mechatronics engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Major Capstone Project - Mechanical",
    "subject_code": "ME-801",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "description": "Comprehensive Major Capstone Project - Mechanical foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Industrial Engineering & Operations Research",
    "subject_code": "ME-802",
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "description": "Applied Industrial Engineering & Operations Research engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Engineering Surveying I",
    "subject_code": "CE-101",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "description": "Comprehensive Engineering Surveying I foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Civil Engineering Materials & Concrete Tech",
    "subject_code": "CE-102",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "description": "Applied Civil Engineering Materials & Concrete Tech engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Building Construction & Planning",
    "subject_code": "CE-201",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "description": "Comprehensive Building Construction & Planning foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Engineering Mechanics - Civil",
    "subject_code": "CE-202",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "description": "Applied Engineering Mechanics - Civil engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Structural Analysis I",
    "subject_code": "CE-301",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "description": "Comprehensive Structural Analysis I foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Surveying II & Geomatics",
    "subject_code": "CE-302",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "description": "Applied Surveying II & Geomatics engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Structural Analysis II",
    "subject_code": "CE-401",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "description": "Comprehensive Structural Analysis II foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Soil Mechanics & Geotechnical Engg",
    "subject_code": "CE-402",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "description": "Applied Soil Mechanics & Geotechnical Engg engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Design of Reinforced Concrete Structures",
    "subject_code": "CE-501",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "description": "Comprehensive Design of Reinforced Concrete Structures foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Environmental Engineering I",
    "subject_code": "CE-502",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "description": "Applied Environmental Engineering I engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Design of Steel Structures",
    "subject_code": "CE-601",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "description": "Comprehensive Design of Steel Structures foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Highway & Transportation Engg",
    "subject_code": "CE-602",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "description": "Applied Highway & Transportation Engg engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Urban Planning & Smart Cities",
    "subject_code": "CE-701",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "description": "Comprehensive Urban Planning & Smart Cities foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Earthquake Resistant Design",
    "subject_code": "CE-702",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "description": "Applied Earthquake Resistant Design engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Major Capstone Project - Civil",
    "subject_code": "CE-801",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "description": "Comprehensive Major Capstone Project - Civil foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Remote Sensing & GIS Applications",
    "subject_code": "CE-802",
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "description": "Applied Remote Sensing & GIS Applications engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "General & Physical Chemistry",
    "subject_code": "CH-101",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "description": "Comprehensive General & Physical Chemistry foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Introduction to Chemical Engineering",
    "subject_code": "CH-102",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "megha.shah@ljku.edu.in",
    "description": "Applied Introduction to Chemical Engineering engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Process Calculations & Stoichiometry",
    "subject_code": "CH-201",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "description": "Comprehensive Process Calculations & Stoichiometry foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Fluid Flow Operations",
    "subject_code": "CH-202",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "megha.shah@ljku.edu.in",
    "description": "Applied Fluid Flow Operations engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Chemical Engineering Thermodynamics I",
    "subject_code": "CH-301",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "description": "Comprehensive Chemical Engineering Thermodynamics I foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Mechanical Operations",
    "subject_code": "CH-302",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "megha.shah@ljku.edu.in",
    "description": "Applied Mechanical Operations engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Chemical Engineering Thermodynamics II",
    "subject_code": "CH-401",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "description": "Comprehensive Chemical Engineering Thermodynamics II foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Mass Transfer Operations I",
    "subject_code": "CH-402",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "megha.shah@ljku.edu.in",
    "description": "Applied Mass Transfer Operations I engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Mass Transfer Operations II",
    "subject_code": "CH-501",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "description": "Comprehensive Mass Transfer Operations II foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Chemical Reaction Engineering I",
    "subject_code": "CH-502",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "megha.shah@ljku.edu.in",
    "description": "Applied Chemical Reaction Engineering I engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Chemical Process Equipment Design",
    "subject_code": "CH-601",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "description": "Comprehensive Chemical Process Equipment Design foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Petroleum Refining & Petrochemicals",
    "subject_code": "CH-602",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "megha.shah@ljku.edu.in",
    "description": "Applied Petroleum Refining & Petrochemicals engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Transport Phenomena",
    "subject_code": "CH-701",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "description": "Comprehensive Transport Phenomena foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Process Modeling & Simulation",
    "subject_code": "CH-702",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "megha.shah@ljku.edu.in",
    "description": "Applied Process Modeling & Simulation engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  },
  {
    "subject_name": "Major Capstone Project - Chemical",
    "subject_code": "CH-801",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "credits": 4,
    "type": "Theory",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "description": "Comprehensive Major Capstone Project - Chemical foundational principles, analytical frameworks, and applications.",
    "status": "Active"
  },
  {
    "subject_name": "Industrial Safety & Hazard Management",
    "subject_code": "CH-802",
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "credits": 3,
    "type": "Theory",
    "faculty_email": "megha.shah@ljku.edu.in",
    "description": "Applied Industrial Safety & Hazard Management engineering methodologies, implementation techniques, and case studies.",
    "status": "Active"
  }
];
const SAMPLE_STUDENTS = [
  {
    "enrollment_no": "LJU2025CS001",
    "name": "Rohit Sharma",
    "email": "rohit.sharma@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 10001",
    "gender": "Male",
    "dob": "2006-04-12",
    "address": "A-12 Nilkanth Residency, SG Highway, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 1,
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025CS001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025CS002",
    "name": "Diya Patel",
    "email": "diya.patel@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 10002",
    "gender": "Female",
    "dob": "2006-08-25",
    "address": "404 Shivalik Heights, Bodakdev, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 1,
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025CS002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025CS003",
    "name": "Aryan Shukla",
    "email": "aryan.shukla@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 10003",
    "gender": "Male",
    "dob": "2006-01-18",
    "address": "B-201 Gokul Galaxy, Vastrapur, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 2,
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025CS003",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025CS004",
    "name": "Sneha Desai",
    "email": "sneha.desai@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 10004",
    "gender": "Female",
    "dob": "2005-11-04",
    "address": "12 Shyamal Bungalows, Satellite, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 2,
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025CS004",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024CS007",
    "name": "Karan Thakkar",
    "email": "karan.thakkar@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 10005",
    "gender": "Male",
    "dob": "2005-09-14",
    "address": "Flat 302, Green Acre, Prahlad Nagar, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 3,
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024CS007",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024CS001",
    "name": "Aarav Patel",
    "email": "aarav.patel@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 00001",
    "gender": "Male",
    "dob": "2004-05-14",
    "address": "12 Shantiniketan Soc, Satellite, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024CS001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024CS002",
    "name": "Riya Shah",
    "email": "riya.shah@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 00002",
    "gender": "Female",
    "dob": "2004-09-22",
    "address": "B-402 Orchid Heights, Bodakdev, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024CS002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023CS003",
    "name": "Pranav Joshi",
    "email": "pranav.joshi@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 10006",
    "gender": "Male",
    "dob": "2004-02-19",
    "address": "E-101 Applewood Township, Shela, Ahmedabad",
    "admission_year": 2023,
    "current_semester": 5,
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023CS003",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023CS001",
    "name": "Vikram Aditya",
    "email": "vikram.aditya@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 00007",
    "gender": "Male",
    "dob": "2003-03-12",
    "address": "C-201 Suryavanshi Flats, Naranpura, Ahmedabad",
    "admission_year": 2023,
    "current_semester": 6,
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023CS001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2022CS001",
    "name": "Meera Nair",
    "email": "meera.nair@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 00008",
    "gender": "Female",
    "dob": "2002-11-30",
    "address": "56 Kalhaar Greens, Sanand Road, Ahmedabad",
    "admission_year": 2022,
    "current_semester": 8,
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2022CS001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025IT001",
    "name": "Yash Shah",
    "email": "yash.shah@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 20001",
    "gender": "Male",
    "dob": "2006-03-15",
    "address": "101 Galaxy Apt, Memnagar, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 1,
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025IT001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025IT002",
    "name": "Aniket Rao",
    "email": "aniket.rao@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 20002",
    "gender": "Male",
    "dob": "2006-07-20",
    "address": "22 Sun Residency, Chandkheda, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 2,
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025IT002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024IT003",
    "name": "Rakesh Mehta",
    "email": "rakesh.mehta@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 20003",
    "gender": "Male",
    "dob": "2005-08-11",
    "address": "B-14 Satyam Tower, Paldi, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 3,
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024IT003",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024IT001",
    "name": "Devansh Raval",
    "email": "devansh.raval@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 00009",
    "gender": "Male",
    "dob": "2004-06-18",
    "address": "78 Somnath Nagar, Gota, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024IT001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024IT002",
    "name": "Pooja Bhatt",
    "email": "pooja.bhatt@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 00010",
    "gender": "Female",
    "dob": "2004-10-05",
    "address": "D-502 Indraprastha, Drive-in Road, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024IT002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023IT002",
    "name": "Mayur Joshi",
    "email": "mayur.joshi@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 20004",
    "gender": "Male",
    "dob": "2004-01-30",
    "address": "15 Shivam Soc, Gurukul, Ahmedabad",
    "admission_year": 2023,
    "current_semester": 5,
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023IT002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023IT001",
    "name": "Harsh Panchal",
    "email": "harsh.panchal@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 00011",
    "gender": "Male",
    "dob": "2003-08-27",
    "address": "14 Vrundavan Soc, Ghatlodia, Ahmedabad",
    "admission_year": 2023,
    "current_semester": 6,
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023IT001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2022IT001",
    "name": "Chirag Varma",
    "email": "chirag.varma@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 20005",
    "gender": "Male",
    "dob": "2002-12-05",
    "address": "A-404 Venus Heights, Bopal, Ahmedabad",
    "admission_year": 2022,
    "current_semester": 8,
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2022IT001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025AI001",
    "name": "Khushi Mehta",
    "email": "khushi.mehta@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 30001",
    "gender": "Female",
    "dob": "2006-02-10",
    "address": "15 Swastik Soc, Navrangpura, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 1,
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025AI001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025AI002",
    "name": "Varun Nair",
    "email": "varun.nair@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 30002",
    "gender": "Male",
    "dob": "2006-06-18",
    "address": "88 Godrej Garden City, Jagatpur, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 2,
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025AI002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024AI003",
    "name": "Diya Trivedi",
    "email": "diya.trivedi@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 30003",
    "gender": "Female",
    "dob": "2005-09-02",
    "address": "302 Safal Parivesh, Prahlad Nagar, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 3,
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024AI003",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024AI001",
    "name": "Arjun Varma",
    "email": "arjun.varma@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 00012",
    "gender": "Male",
    "dob": "2004-07-08",
    "address": "C-304 Titanium City Center, Anandnagar, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024AI001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024AI002",
    "name": "Tanvi Dave",
    "email": "tanvi.dave@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 00013",
    "gender": "Female",
    "dob": "2004-12-14",
    "address": "22 Maple County, Thaltej, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024AI002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023AI002",
    "name": "Rohan Gupta",
    "email": "rohan.gupta@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 30004",
    "gender": "Male",
    "dob": "2004-04-22",
    "address": "Flat 401, Sterling City, Bopal, Ahmedabad",
    "admission_year": 2023,
    "current_semester": 5,
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023AI002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023AI001",
    "name": "Simran Kaur",
    "email": "simran.kaur@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 30005",
    "gender": "Female",
    "dob": "2003-05-19",
    "address": "70 Greenwoods, SG Highway, Ahmedabad",
    "admission_year": 2023,
    "current_semester": 6,
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023AI001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2022AI001",
    "name": "Ayesha Khan",
    "email": "ayesha.khan@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 30006",
    "gender": "Female",
    "dob": "2002-10-11",
    "address": "90 Gulmohar Enclave, Ellisbridge, Ahmedabad",
    "admission_year": 2022,
    "current_semester": 8,
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2022AI001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025EC001",
    "name": "Manan Shah",
    "email": "manan.shah@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 40001",
    "gender": "Male",
    "dob": "2006-05-12",
    "address": "501 Silver Radiance, Sindhu Bhavan, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 1,
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025EC001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025EC002",
    "name": "Riddhi Trivedi",
    "email": "riddhi.trivedi@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 40002",
    "gender": "Female",
    "dob": "2006-09-08",
    "address": "12 Shreenath Soc, Usmanpura, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 2,
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025EC002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024EC002",
    "name": "Vivek Parmar",
    "email": "vivek.parmar@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 40003",
    "gender": "Male",
    "dob": "2005-04-14",
    "address": "88 Nilkanth Park, Ranip, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 3,
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024EC002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024EC001",
    "name": "Parthiv Gohil",
    "email": "parthiv.gohil@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 40004",
    "gender": "Male",
    "dob": "2004-08-20",
    "address": "Flat 102, Aryaman Bungalows, Shilaj, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024EC001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024EC003",
    "name": "Urvi Pandya",
    "email": "urvi.pandya@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 40005",
    "gender": "Female",
    "dob": "2004-11-29",
    "address": "34 Pushpak Soc, Ambawadi, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024EC003",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023EC002",
    "name": "Hardik Patel",
    "email": "hardik.patel@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 40006",
    "gender": "Male",
    "dob": "2004-03-17",
    "address": "B-22 Maruti Complex, Shahibaug, Ahmedabad",
    "admission_year": 2023,
    "current_semester": 5,
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023EC002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023EC001",
    "name": "Sonal Rawat",
    "email": "sonal.rawat@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 40007",
    "gender": "Female",
    "dob": "2003-07-25",
    "address": "102 Heritage Homes, Motera, Ahmedabad",
    "admission_year": 2023,
    "current_semester": 6,
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023EC001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2022EC001",
    "name": "Bhavna Vyas",
    "email": "bhavna.vyas@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 40008",
    "gender": "Female",
    "dob": "2002-09-14",
    "address": "Flat 701, Gala Haven, South Bopal, Ahmedabad",
    "admission_year": 2022,
    "current_semester": 8,
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2022EC001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025ME001",
    "name": "Harshil Soni",
    "email": "harshil.soni@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 50001",
    "gender": "Male",
    "dob": "2006-01-22",
    "address": "A-304 Madhav Residency, Naroda, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 1,
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025ME001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025ME002",
    "name": "Dhaval Solanki",
    "email": "dhaval.solanki@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 50002",
    "gender": "Male",
    "dob": "2006-11-15",
    "address": "18 Radhe Krishna Soc, Nikol, Ahmedabad",
    "admission_year": 2025,
    "current_semester": 2,
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025ME002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024ME002",
    "name": "Mohit Chauhan",
    "email": "mohit.chauhan@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 50003",
    "gender": "Male",
    "dob": "2005-03-08",
    "address": "99 Dev Castle, Maninagar, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 3,
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024ME002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024ME001",
    "name": "Meet Patel",
    "email": "meet.patel@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 50004",
    "gender": "Male",
    "dob": "2004-06-30",
    "address": "56 Royal Palm, Isanpur, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024ME001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024ME003",
    "name": "Sagar Panchal",
    "email": "sagar.panchal@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 50005",
    "gender": "Male",
    "dob": "2004-10-18",
    "address": "B-12 Tirupati Flats, Vatva, Ahmedabad",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024ME003",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023ME002",
    "name": "Jayesh Vaghela",
    "email": "jayesh.vaghela@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 50006",
    "gender": "Male",
    "dob": "2004-02-14",
    "address": "44 Sharda Park, Odhav, Ahmedabad",
    "admission_year": 2023,
    "current_semester": 5,
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023ME002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023ME001",
    "name": "Chetan Barot",
    "email": "chetan.barot@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 50007",
    "gender": "Male",
    "dob": "2003-09-05",
    "address": "C-501 Sunrise Towers, Chandlodia, Ahmedabad",
    "admission_year": 2023,
    "current_semester": 6,
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023ME001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2022ME001",
    "name": "Pradeep Yadav",
    "email": "pradeep.yadav@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 50008",
    "gender": "Male",
    "dob": "2002-08-19",
    "address": "Flat 204, Shreemad Residency, New CG Road, Ahmedabad",
    "admission_year": 2022,
    "current_semester": 8,
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2022ME001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025CE001",
    "name": "Jay Dave",
    "email": "jay.dave@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 60001",
    "gender": "Male",
    "dob": "2006-04-11",
    "address": "14 Krishna Bungalows, Gandhinagar",
    "admission_year": 2025,
    "current_semester": 1,
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025CE001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025CE002",
    "name": "Kinjal Solanki",
    "email": "kinjal.solanki@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 60002",
    "gender": "Female",
    "dob": "2006-08-19",
    "address": "Sector 21, Gandhinagar",
    "admission_year": 2025,
    "current_semester": 2,
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025CE002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024CE002",
    "name": "Brijesh Prajapati",
    "email": "brijesh.prajapati@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 60003",
    "gender": "Male",
    "dob": "2005-02-28",
    "address": "Sector 7, Gandhinagar",
    "admission_year": 2024,
    "current_semester": 3,
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024CE002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024CE001",
    "name": "Darshan Raval",
    "email": "darshan.raval@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 60004",
    "gender": "Male",
    "dob": "2004-05-17",
    "address": "B-103 Shubh Enclave, Kudasan, Gandhinagar",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024CE001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024CE003",
    "name": "Hetal Trivedi",
    "email": "hetal.trivedi@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 60005",
    "gender": "Female",
    "dob": "2004-09-23",
    "address": "204 Pramukh Park, Raysan, Gandhinagar",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024CE003",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023CE002",
    "name": "Nirav Desai",
    "email": "nirav.desai@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 60006",
    "gender": "Male",
    "dob": "2004-01-15",
    "address": "Sector 24, Gandhinagar",
    "admission_year": 2023,
    "current_semester": 5,
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023CE002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023CE001",
    "name": "Tejas Shukla",
    "email": "tejas.shukla@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 60007",
    "gender": "Male",
    "dob": "2003-06-21",
    "address": "Flat 402, Radhe Infinity, Koba, Gandhinagar",
    "admission_year": 2023,
    "current_semester": 6,
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023CE001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2022CE001",
    "name": "Shruti Joshi",
    "email": "shruti.joshi@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 60008",
    "gender": "Female",
    "dob": "2002-11-10",
    "address": "Sector 14, Gandhinagar",
    "admission_year": 2022,
    "current_semester": 8,
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2022CE001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025CH001",
    "name": "Krunal Varma",
    "email": "krunal.varma@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 70001",
    "gender": "Male",
    "dob": "2006-03-05",
    "address": "12 Shreenath Soc, Nandesari, Vadodara",
    "admission_year": 2025,
    "current_semester": 1,
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025CH001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2025CH002",
    "name": "Janki Patel",
    "email": "janki.patel@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 70002",
    "gender": "Female",
    "dob": "2006-07-14",
    "address": "45 GIDC Colony, Ankleshwar",
    "admission_year": 2025,
    "current_semester": 2,
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2025CH002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024CH002",
    "name": "Yashvi Gandhi",
    "email": "yashvi.gandhi@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 70003",
    "gender": "Female",
    "dob": "2005-08-30",
    "address": "B-201 Alkapuri Heights, Vadodara",
    "admission_year": 2024,
    "current_semester": 3,
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024CH002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024CH001",
    "name": "Naitik Mehta",
    "email": "naitik.mehta@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 70004",
    "gender": "Male",
    "dob": "2004-04-20",
    "address": "Flat 304, Petrochemical Township, Vadodara",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024CH001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2024CH003",
    "name": "Payal Shah",
    "email": "payal.shah@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 70005",
    "gender": "Female",
    "dob": "2004-12-08",
    "address": "88 Akota Gardens, Vadodara",
    "admission_year": 2024,
    "current_semester": 4,
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2024CH003",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023CH002",
    "name": "Vishal Barad",
    "email": "vishal.barad@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 70006",
    "gender": "Male",
    "dob": "2004-03-12",
    "address": "C-12 Sun Pharma Road, Vadodara",
    "admission_year": 2023,
    "current_semester": 5,
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023CH002",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2023CH001",
    "name": "Rakesh Makwana",
    "email": "rakesh.makwana@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 70007",
    "gender": "Male",
    "dob": "2003-10-15",
    "address": "101 Gotri Heights, Vadodara",
    "admission_year": 2023,
    "current_semester": 6,
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2023CH001",
    "status": "Active"
  },
  {
    "enrollment_no": "LJU2022CH001",
    "name": "Aniket Sen",
    "email": "aniket.sen@ljku.edu.in",
    "password": DEFAULT_PASSWORD_HASH,
    "phone": "+91 98790 70008",
    "gender": "Male",
    "dob": "2002-09-28",
    "address": "Sector 3, Reliance Township, Dahej",
    "admission_year": 2022,
    "current_semester": 8,
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LJU2022CH001",
    "status": "Active"
  }
];
const SAMPLE_ACADEMIC_HISTORY = [
  {
    "enrollment_no": "LJU2024CS001",
    "semester": 1,
    "academic_year": "2024\u20132025",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.65,
    "cgpa": 8.65,
    "status": "First Class with Distinction",
    "remarks": "Dean's Honor List for outstanding scholastic achievement."
  },
  {
    "enrollment_no": "LJU2024CS001",
    "semester": 2,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.9,
    "cgpa": 8.78,
    "status": "First Class with Distinction",
    "remarks": "Excellent performance in object-oriented systems and applied mathematics."
  },
  {
    "enrollment_no": "LJU2024CS001",
    "semester": 3,
    "academic_year": "2025\u20132026",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 9.15,
    "cgpa": 8.9,
    "status": "First Class with Distinction",
    "remarks": "Superior algorithmic mastery and database design capabilities."
  },
  {
    "enrollment_no": "LJU2023CS001",
    "semester": 1,
    "academic_year": "2023\u20132024",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.4,
    "cgpa": 8.4,
    "status": "First Class with Distinction",
    "remarks": "Passed with distinction."
  },
  {
    "enrollment_no": "LJU2023CS001",
    "semester": 2,
    "academic_year": "2023\u20132024",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.6,
    "cgpa": 8.5,
    "status": "First Class with Distinction",
    "remarks": "Completed with honors."
  },
  {
    "enrollment_no": "LJU2023CS001",
    "semester": 3,
    "academic_year": "2024\u20132025",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 8.75,
    "cgpa": 8.59,
    "status": "First Class with Distinction",
    "remarks": "Completed with honors."
  },
  {
    "enrollment_no": "LJU2023CS001",
    "semester": 4,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.9,
    "cgpa": 8.67,
    "status": "First Class with Distinction",
    "remarks": "Completed with distinction."
  },
  {
    "enrollment_no": "LJU2023CS001",
    "semester": 5,
    "academic_year": "2025\u20132026",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 9.1,
    "cgpa": 8.76,
    "status": "First Class with Distinction",
    "remarks": "Exemplary performance in cloud infrastructure and networking."
  },
  {
    "enrollment_no": "LJU2022CS001",
    "semester": 1,
    "academic_year": "2022\u20132023",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.8,
    "cgpa": 8.8,
    "status": "First Class with Distinction",
    "remarks": "First Class with Distinction."
  },
  {
    "enrollment_no": "LJU2022CS001",
    "semester": 2,
    "academic_year": "2022\u20132023",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 9.0,
    "cgpa": 8.9,
    "status": "First Class with Distinction",
    "remarks": "First Class with Distinction."
  },
  {
    "enrollment_no": "LJU2022CS001",
    "semester": 3,
    "academic_year": "2023\u20132024",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 9.1,
    "cgpa": 8.97,
    "status": "First Class with Distinction",
    "remarks": "First Class with Distinction."
  },
  {
    "enrollment_no": "LJU2022CS001",
    "semester": 4,
    "academic_year": "2023\u20132024",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 9.2,
    "cgpa": 9.03,
    "status": "First Class with Distinction",
    "remarks": "First Class with Distinction."
  },
  {
    "enrollment_no": "LJU2022CS001",
    "semester": 5,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 9.35,
    "cgpa": 9.09,
    "status": "First Class with Distinction",
    "remarks": "First Class with Distinction."
  },
  {
    "enrollment_no": "LJU2022CS001",
    "semester": 6,
    "academic_year": "2024\u20132025",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 9.4,
    "cgpa": 9.15,
    "status": "First Class with Distinction",
    "remarks": "First Class with Distinction."
  },
  {
    "enrollment_no": "LJU2022CS001",
    "semester": 7,
    "academic_year": "2025\u20132026",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 9.5,
    "cgpa": 9.2,
    "status": "First Class with Distinction",
    "remarks": "University Gold Medal Contender."
  },
  {
    "enrollment_no": "LJU2024IT001",
    "semester": 1,
    "academic_year": "2024\u20132025",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.5,
    "cgpa": 8.5,
    "status": "First Class with Distinction",
    "remarks": "Distinction in C programming and mathematics."
  },
  {
    "enrollment_no": "LJU2024IT001",
    "semester": 2,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.75,
    "cgpa": 8.63,
    "status": "First Class with Distinction",
    "remarks": "Excellence in C++ OOP and logic synthesis."
  },
  {
    "enrollment_no": "LJU2024IT001",
    "semester": 3,
    "academic_year": "2025\u20132026",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 8.9,
    "cgpa": 8.72,
    "status": "First Class with Distinction",
    "remarks": "High proficiency in web development and data structures."
  },
  {
    "enrollment_no": "LJU2023IT001",
    "semester": 1,
    "academic_year": "2023\u20132024",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.2,
    "cgpa": 8.2,
    "status": "First Class with Distinction",
    "remarks": "First Class with Distinction."
  },
  {
    "enrollment_no": "LJU2023IT001",
    "semester": 2,
    "academic_year": "2023\u20132024",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.45,
    "cgpa": 8.33,
    "status": "First Class with Distinction",
    "remarks": "First Class with Distinction."
  },
  {
    "enrollment_no": "LJU2023IT001",
    "semester": 3,
    "academic_year": "2024\u20132025",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 8.6,
    "cgpa": 8.42,
    "status": "First Class with Distinction",
    "remarks": "First Class with Distinction."
  },
  {
    "enrollment_no": "LJU2023IT001",
    "semester": 4,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.8,
    "cgpa": 8.52,
    "status": "First Class with Distinction",
    "remarks": "First Class with Distinction."
  },
  {
    "enrollment_no": "LJU2023IT001",
    "semester": 5,
    "academic_year": "2025\u20132026",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 9.05,
    "cgpa": 8.63,
    "status": "First Class with Distinction",
    "remarks": "Distinction in cloud virtualization."
  },
  {
    "enrollment_no": "LJU2024AI001",
    "semester": 1,
    "academic_year": "2024\u20132025",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.9,
    "cgpa": 8.9,
    "status": "First Class with Distinction",
    "remarks": "Outstanding foundations in Python & mathematics."
  },
  {
    "enrollment_no": "LJU2024AI001",
    "semester": 2,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 9.1,
    "cgpa": 9.0,
    "status": "First Class with Distinction",
    "remarks": "Top ranker in statistical inference."
  },
  {
    "enrollment_no": "LJU2024AI001",
    "semester": 3,
    "academic_year": "2025\u20132026",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 9.3,
    "cgpa": 9.1,
    "status": "First Class with Distinction",
    "remarks": "Distinction in mathematical foundations of AI."
  },
  {
    "enrollment_no": "LJU2023AI001",
    "semester": 1,
    "academic_year": "2023\u20132024",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.5,
    "cgpa": 8.5,
    "status": "First Class with Distinction",
    "remarks": "Passed with distinction."
  },
  {
    "enrollment_no": "LJU2023AI001",
    "semester": 2,
    "academic_year": "2023\u20132024",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.7,
    "cgpa": 8.6,
    "status": "First Class with Distinction",
    "remarks": "Passed with distinction."
  },
  {
    "enrollment_no": "LJU2023AI001",
    "semester": 3,
    "academic_year": "2024\u20132025",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 8.95,
    "cgpa": 8.72,
    "status": "First Class with Distinction",
    "remarks": "Passed with distinction."
  },
  {
    "enrollment_no": "LJU2023AI001",
    "semester": 4,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 9.15,
    "cgpa": 8.83,
    "status": "First Class with Distinction",
    "remarks": "Passed with distinction."
  },
  {
    "enrollment_no": "LJU2023AI001",
    "semester": 5,
    "academic_year": "2025\u20132026",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 9.25,
    "cgpa": 8.92,
    "status": "First Class with Distinction",
    "remarks": "Excellence in deep learning."
  },
  {
    "enrollment_no": "LJU2024EC001",
    "semester": 1,
    "academic_year": "2024\u20132025",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.3,
    "cgpa": 8.3,
    "status": "First Class with Distinction",
    "remarks": "Distinction in basic electrical and circuits."
  },
  {
    "enrollment_no": "LJU2024EC001",
    "semester": 2,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.55,
    "cgpa": 8.43,
    "status": "First Class with Distinction",
    "remarks": "High marks in electronic devices."
  },
  {
    "enrollment_no": "LJU2024EC001",
    "semester": 3,
    "academic_year": "2025\u20132026",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 8.8,
    "cgpa": 8.55,
    "status": "First Class with Distinction",
    "remarks": "Distinction in analog circuit design."
  },
  {
    "enrollment_no": "LJU2024ME001",
    "semester": 1,
    "academic_year": "2024\u20132025",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.2,
    "cgpa": 8.2,
    "status": "First Class with Distinction",
    "remarks": "Distinction in CAD & mechanics."
  },
  {
    "enrollment_no": "LJU2024ME001",
    "semester": 2,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.4,
    "cgpa": 8.3,
    "status": "First Class with Distinction",
    "remarks": "Distinction in material science."
  },
  {
    "enrollment_no": "LJU2024ME001",
    "semester": 3,
    "academic_year": "2025\u20132026",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 8.65,
    "cgpa": 8.42,
    "status": "First Class with Distinction",
    "remarks": "Distinction in thermodynamics."
  },
  {
    "enrollment_no": "LJU2024CE001",
    "semester": 1,
    "academic_year": "2024\u20132025",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.4,
    "cgpa": 8.4,
    "status": "First Class with Distinction",
    "remarks": "Distinction in surveying."
  },
  {
    "enrollment_no": "LJU2024CE001",
    "semester": 2,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.6,
    "cgpa": 8.5,
    "status": "First Class with Distinction",
    "remarks": "Distinction in building construction."
  },
  {
    "enrollment_no": "LJU2024CE001",
    "semester": 3,
    "academic_year": "2025\u20132026",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 8.75,
    "cgpa": 8.58,
    "status": "First Class with Distinction",
    "remarks": "Distinction in structural analysis."
  },
  {
    "enrollment_no": "LJU2024CH001",
    "semester": 1,
    "academic_year": "2024\u20132025",
    "total_credits": 22,
    "credits_earned": 22,
    "sgpa": 8.35,
    "cgpa": 8.35,
    "status": "First Class with Distinction",
    "remarks": "Distinction in physical chemistry."
  },
  {
    "enrollment_no": "LJU2024CH001",
    "semester": 2,
    "academic_year": "2024\u20132025",
    "total_credits": 24,
    "credits_earned": 24,
    "sgpa": 8.6,
    "cgpa": 8.48,
    "status": "First Class with Distinction",
    "remarks": "Distinction in process stoichiometry."
  },
  {
    "enrollment_no": "LJU2024CH001",
    "semester": 3,
    "academic_year": "2025\u20132026",
    "total_credits": 23,
    "credits_earned": 23,
    "sgpa": 8.85,
    "cgpa": 8.6,
    "status": "First Class with Distinction",
    "remarks": "Distinction in chemical thermodynamics."
  }
];
const SAMPLE_TIMETABLES = [
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-101",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-102",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-103",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-102",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-103",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-103",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-104",
    "faculty_email": "pooja.vora@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-105",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-104",
    "faculty_email": "pooja.vora@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-105",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-105",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-101",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-102",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-101"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-201",
    "faculty_email": "neha.shah@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-202",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-203",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-202",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-203",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-203",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-204",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-205",
    "faculty_email": "neha.shah@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-204",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-205",
    "faculty_email": "neha.shah@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-205",
    "faculty_email": "neha.shah@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-201",
    "faculty_email": "neha.shah@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-202",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-102"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-301",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-302",
    "faculty_email": "neha.shah@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-303",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-302",
    "faculty_email": "neha.shah@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-303",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-303",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-304",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-305",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-304",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-305",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-305",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-301",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-302",
    "faculty_email": "neha.shah@ljku.edu.in",
    "classroom": "Room A-201"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-401",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-402",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-403",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-402",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-403",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-403",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-404",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-405",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-404",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-405",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-405",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-401",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-402",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-202"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-501",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-502",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-503",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-502",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-503",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-503",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-504",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-505",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-504",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-505",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-505",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-501",
    "faculty_email": "rahul.mehta@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-502",
    "faculty_email": "priya.joshi@ljku.edu.in",
    "classroom": "Room A-301"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-601",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-602",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-603",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-602",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-603",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-603",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-604",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-605",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-604",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-605",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-605",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-601",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-602",
    "faculty_email": "tanvi.trivedi@ljku.edu.in",
    "classroom": "Room A-302"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-702",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-703",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-702",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-703",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-703",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-704",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-704",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-702",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-703",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room A-401"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-801",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-802",
    "faculty_email": "pooja.vora@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-801",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-802",
    "faculty_email": "pooja.vora@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-801",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-801",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-802",
    "faculty_email": "pooja.vora@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-801",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-802",
    "faculty_email": "pooja.vora@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-801",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CSE-801",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CSE-802",
    "faculty_email": "pooja.vora@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "CSE",
    "program_code": "BTECH-CSE",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CSE-801",
    "faculty_email": "amit.patel@ljku.edu.in",
    "classroom": "Room A-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-101",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-102",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-101",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-102",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-101",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-101",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-102",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-101",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-102",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-101",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-101",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-102",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-101",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-101"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-201",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-202",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-201",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-202",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-201",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-201",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-202",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-201",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-202",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-201",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-201",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-202",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-201",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-102"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-301",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-302",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-301",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-302",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-301",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-301",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-302",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-301",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-302",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-301",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-301",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-302",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-301",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-201"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-401",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-402",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-401",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-402",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-401",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-401",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-402",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-401",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-402",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-401",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-401",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-402",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-401",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-202"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-501",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-502",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-501",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-502",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-501",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-501",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-502",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-501",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-502",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-501",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-501",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-502",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-501",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-301"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-601",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-602",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-601",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-602",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-601",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-601",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-602",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-601",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-602",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-601",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-601",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-602",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-601",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-302"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-701",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-702",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-701",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-702",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-701",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-701",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-702",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-701",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-702",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-701",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-701",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-702",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-701",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-401"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-801",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-802",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-801",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-802",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-801",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-801",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-802",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-801",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-802",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-801",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "IT-801",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "IT-802",
    "faculty_email": "bhavin.panchal@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "IT",
    "program_code": "BTECH-IT",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "IT-801",
    "faculty_email": "sanjay.solanki@ljku.edu.in",
    "classroom": "Room B-402"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-101",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-102",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-101",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-102",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-101",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-101",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-102",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-101",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-102",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-101",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-101",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-102",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-101",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-201",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-202",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-201",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-202",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-201",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-201",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-202",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-201",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-202",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-201",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-201",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-202",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-201",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-301",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-302",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-301",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-302",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-301",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-301",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-302",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-301",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-302",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-301",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-301",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-302",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-301",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Lab-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-401",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-402",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-401",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-402",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-401",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-401",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-402",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-401",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-402",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-401",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-401",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-402",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-401",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-501",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-502",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-501",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-502",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-501",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-501",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-502",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-501",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-502",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-501",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-501",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-502",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-501",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-601",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-602",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-601",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-602",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-601",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-601",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-602",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-601",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-602",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-601",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-601",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-602",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-601",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Studio-3"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-702",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-702",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-702",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-702",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-702",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-701",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-1"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-801",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-802",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-801",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-802",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-801",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-801",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-802",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-801",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-802",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-801",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "AIML-801",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "AIML-802",
    "faculty_email": "ritu.parikh@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "AIML",
    "program_code": "BTECH-AIDS",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "AIML-801",
    "faculty_email": "kunal.shah@ljku.edu.in",
    "classroom": "AI-Cluster-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-101",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-102",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-101",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-102",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-101",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-101",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-102",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-101",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-102",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-101",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-101",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-102",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-101",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-101"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-201",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-202",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-201",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-202",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-201",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-201",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-202",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-201",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-202",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-201",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-201",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-202",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-201",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-102"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-301",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-302",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-301",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-302",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-301",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-301",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-302",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-301",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-302",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-301",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-301",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-302",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-301",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-201"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-401",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-402",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-401",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-402",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-401",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-401",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-402",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-401",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-402",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-401",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-401",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-402",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-401",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-202"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-501",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-502",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-501",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-502",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-501",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-501",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-502",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-501",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-502",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-501",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-501",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-502",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-501",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-301"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-601",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-602",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-601",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-602",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-601",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-601",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-602",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-601",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-602",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-601",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-601",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-602",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-601",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "ECE-302"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-701",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-702",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-701",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-702",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-701",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-701",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-702",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-701",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-702",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-701",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-701",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-702",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-701",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-1"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-801",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-802",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-801",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-802",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-801",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-801",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-802",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-801",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-802",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-801",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ECE-801",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ECE-802",
    "faculty_email": "deepa.dave@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ECE",
    "program_code": "BTECH-ECE",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ECE-801",
    "faculty_email": "hardik.vyas@ljku.edu.in",
    "classroom": "VLSI-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-101",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-102",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-101",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-102",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-101",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-101",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-102",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-101",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-102",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-101",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-101",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-102",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-101",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-101"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-201",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-202",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-201",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-202",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-201",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-201",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-202",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-201",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-202",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-201",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-201",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-202",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-201",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-102"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-301",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-302",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-301",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-302",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-301",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-301",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-302",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-301",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-302",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-301",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-301",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-302",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-301",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-201"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-401",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-402",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-401",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-402",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-401",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-401",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-402",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-401",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-402",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-401",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-401",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-402",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-401",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "ME-202"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-501",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-502",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-501",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-502",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-501",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-501",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-502",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-501",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-502",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-501",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-501",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-502",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-501",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-601",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-602",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-601",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-602",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-601",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-601",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-602",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-601",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-602",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-601",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-601",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-602",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-601",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "CAD-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-701",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-702",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-701",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-702",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-701",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-701",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-702",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-701",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-702",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-701",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-701",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-702",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-701",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-1"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-801",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-802",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-801",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-802",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-801",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-801",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-802",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-801",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-802",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-801",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "ME-801",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "ME-802",
    "faculty_email": "nilesh.soni@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "ME",
    "program_code": "BTECH-ME",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "ME-801",
    "faculty_email": "vikram.rathod@ljku.edu.in",
    "classroom": "Robo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-101",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-102",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-101",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-102",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-101",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-101",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-102",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-101",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-102",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-101",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-101",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-102",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-101",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-101"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-201",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-202",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-201",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-202",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-201",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-201",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-202",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-201",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-202",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-201",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-201",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-202",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-201",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-102"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-301",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-302",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-301",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-302",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-301",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-301",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-302",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-301",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-302",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-301",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-301",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-302",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-301",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-201"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-401",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-402",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-401",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-402",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-401",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-401",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-402",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-401",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-402",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-401",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-401",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-402",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-401",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "CE-202"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-501",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-502",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-501",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-502",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-501",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-501",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-502",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-501",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-502",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-501",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-501",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-502",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-501",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-601",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-602",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-601",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-602",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-601",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-601",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-602",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-601",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-602",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-601",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-601",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-602",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-601",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Survey-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-701",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-702",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-701",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-702",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-701",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-701",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-702",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-701",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-702",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-701",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-701",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-702",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-701",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-1"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-801",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-802",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-801",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-802",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-801",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-801",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-802",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-801",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-802",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-801",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CE-801",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CE-802",
    "faculty_email": "bhavesh.bhatt@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CE",
    "program_code": "BTECH-CE",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CE-801",
    "faculty_email": "parth.chokshi@ljku.edu.in",
    "classroom": "Geo-Lab-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-101",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-102",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-101",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-102",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-101",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-101",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-102",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-101",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-102",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-101",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-101",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-102",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 1,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-101",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-101"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-201",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-202",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-201",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-202",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-201",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-201",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-202",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-201",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-202",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-201",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-201",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-202",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 2,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-201",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-102"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-301",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-302",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-301",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-302",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-301",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-301",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-302",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-301",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-302",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-301",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-301",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-302",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 3,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-301",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-201"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-401",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-402",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-401",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-402",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-401",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-401",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-402",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-401",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-402",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-401",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-401",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-402",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 4,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-401",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "CH-202"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-501",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-502",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-501",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-502",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-501",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-501",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-502",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-501",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-502",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-501",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-501",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-502",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 5,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-501",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-601",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-602",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-601",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-602",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-601",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-601",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-602",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-601",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-602",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-601",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-601",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-602",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 6,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-601",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "UnitOp-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-701",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-702",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-701",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-702",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-701",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-701",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-702",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-701",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-702",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-701",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-701",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-702",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 7,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-701",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-1"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-801",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-802",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Monday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-801",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-802",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Tuesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-801",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-801",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-802",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Wednesday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-801",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-802",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Thursday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-801",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "09:00 - 10:00",
    "subject_code": "CH-801",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "10:00 - 11:00",
    "subject_code": "CH-802",
    "faculty_email": "megha.shah@ljku.edu.in",
    "classroom": "Reaction-2"
  },
  {
    "department_code": "CH",
    "program_code": "BTECH-CH",
    "semester": 8,
    "day_of_week": "Friday",
    "time_slot": "11:15 - 12:15",
    "subject_code": "CH-801",
    "faculty_email": "jignesh.raval@ljku.edu.in",
    "classroom": "Reaction-2"
  }
];
const SAMPLE_EXAMS = [
  {
    "exam_name": "Mid-Semester Exam 2026 - Operating Systems & Kernel Architecture",
    "subject_code": "CSE-401",
    "exam_date": "2026-09-15",
    "time_slot": "10:00 - 12:00",
    "classroom": "Room A-202",
    "max_marks": 50,
    "passing_marks": 20,
    "status": "Completed"
  },
  {
    "exam_name": "Semester 1 Final Exam - Engineering Mathematics I",
    "subject_code": "CSE-101",
    "exam_date": "2025-12-10",
    "time_slot": "09:30 - 12:30",
    "classroom": "Room A-101",
    "max_marks": 100,
    "passing_marks": 40,
    "status": "Completed"
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Database Management Systems - IT",
    "subject_code": "IT-401",
    "exam_date": "2026-09-15",
    "time_slot": "10:00 - 12:00",
    "classroom": "Room B-202",
    "max_marks": 50,
    "passing_marks": 20,
    "status": "Completed"
  },
  {
    "exam_name": "Semester 1 Final Exam - Programming Fundamentals in C",
    "subject_code": "IT-101",
    "exam_date": "2025-12-10",
    "time_slot": "09:30 - 12:30",
    "classroom": "Room B-101",
    "max_marks": 100,
    "passing_marks": 40,
    "status": "Completed"
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Machine Learning Algorithms & Models",
    "subject_code": "AIML-401",
    "exam_date": "2026-09-15",
    "time_slot": "10:00 - 12:00",
    "classroom": "AI-Studio-1",
    "max_marks": 50,
    "passing_marks": 20,
    "status": "Completed"
  },
  {
    "exam_name": "Semester 1 Final Exam - Foundations of AI & Python",
    "subject_code": "AIML-101",
    "exam_date": "2025-12-10",
    "time_slot": "09:30 - 12:30",
    "classroom": "AI-Lab-1",
    "max_marks": 100,
    "passing_marks": 40,
    "status": "Completed"
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Microprocessors & Microcontrollers",
    "subject_code": "ECE-401",
    "exam_date": "2026-09-15",
    "time_slot": "10:00 - 12:00",
    "classroom": "ECE-202",
    "max_marks": 50,
    "passing_marks": 20,
    "status": "Completed"
  },
  {
    "exam_name": "Semester 1 Final Exam - Basic Electrical Engineering",
    "subject_code": "ECE-101",
    "exam_date": "2025-12-10",
    "time_slot": "09:30 - 12:30",
    "classroom": "ECE-101",
    "max_marks": 100,
    "passing_marks": 40,
    "status": "Completed"
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Kinematics of Machinery",
    "subject_code": "ME-401",
    "exam_date": "2026-09-15",
    "time_slot": "10:00 - 12:00",
    "classroom": "ME-202",
    "max_marks": 50,
    "passing_marks": 20,
    "status": "Completed"
  },
  {
    "exam_name": "Semester 1 Final Exam - Engineering Graphics & CAD",
    "subject_code": "ME-101",
    "exam_date": "2025-12-10",
    "time_slot": "09:30 - 12:30",
    "classroom": "ME-101",
    "max_marks": 100,
    "passing_marks": 40,
    "status": "Completed"
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Structural Analysis II",
    "subject_code": "CE-401",
    "exam_date": "2026-09-15",
    "time_slot": "10:00 - 12:00",
    "classroom": "CE-202",
    "max_marks": 50,
    "passing_marks": 20,
    "status": "Completed"
  },
  {
    "exam_name": "Semester 1 Final Exam - Engineering Surveying I",
    "subject_code": "CE-101",
    "exam_date": "2025-12-10",
    "time_slot": "09:30 - 12:30",
    "classroom": "CE-101",
    "max_marks": 100,
    "passing_marks": 40,
    "status": "Completed"
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Chemical Engineering Thermodynamics II",
    "subject_code": "CH-401",
    "exam_date": "2026-09-15",
    "time_slot": "10:00 - 12:00",
    "classroom": "CH-202",
    "max_marks": 50,
    "passing_marks": 20,
    "status": "Completed"
  },
  {
    "exam_name": "Semester 1 Final Exam - General & Physical Chemistry",
    "subject_code": "CH-101",
    "exam_date": "2025-12-10",
    "time_slot": "09:30 - 12:30",
    "classroom": "CH-101",
    "max_marks": 100,
    "passing_marks": 40,
    "status": "Completed"
  }
];
const SAMPLE_EXAM_RESULTS = [
  {
    "exam_name": "Mid-Semester Exam 2026 - Operating Systems & Kernel Architecture",
    "enrollment_no": "LJU2024CS001",
    "marks_obtained": 42.5,
    "grade": "A+",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Operating Systems & Kernel Architecture",
    "enrollment_no": "LJU2024CS002",
    "marks_obtained": 38.0,
    "grade": "A",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Semester 1 Final Exam - Engineering Mathematics I",
    "enrollment_no": "LJU2024CS001",
    "marks_obtained": 86.0,
    "grade": "A",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Semester 1 Final Exam - Engineering Mathematics I",
    "enrollment_no": "LJU2024CS002",
    "marks_obtained": 79.5,
    "grade": "B+",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Database Management Systems - IT",
    "enrollment_no": "LJU2024IT001",
    "marks_obtained": 42.5,
    "grade": "A+",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Database Management Systems - IT",
    "enrollment_no": "LJU2024IT002",
    "marks_obtained": 38.0,
    "grade": "A",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Semester 1 Final Exam - Programming Fundamentals in C",
    "enrollment_no": "LJU2024IT001",
    "marks_obtained": 86.0,
    "grade": "A",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Semester 1 Final Exam - Programming Fundamentals in C",
    "enrollment_no": "LJU2024IT002",
    "marks_obtained": 79.5,
    "grade": "B+",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Machine Learning Algorithms & Models",
    "enrollment_no": "LJU2024AI001",
    "marks_obtained": 42.5,
    "grade": "A+",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Machine Learning Algorithms & Models",
    "enrollment_no": "LJU2024AI002",
    "marks_obtained": 38.0,
    "grade": "A",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Semester 1 Final Exam - Foundations of AI & Python",
    "enrollment_no": "LJU2024AI001",
    "marks_obtained": 86.0,
    "grade": "A",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Semester 1 Final Exam - Foundations of AI & Python",
    "enrollment_no": "LJU2024AI002",
    "marks_obtained": 79.5,
    "grade": "B+",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Microprocessors & Microcontrollers",
    "enrollment_no": "LJU2024EC001",
    "marks_obtained": 42.5,
    "grade": "A+",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Microprocessors & Microcontrollers",
    "enrollment_no": "LJU2024EC003",
    "marks_obtained": 38.0,
    "grade": "A",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Semester 1 Final Exam - Basic Electrical Engineering",
    "enrollment_no": "LJU2024EC001",
    "marks_obtained": 86.0,
    "grade": "A",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Semester 1 Final Exam - Basic Electrical Engineering",
    "enrollment_no": "LJU2024EC003",
    "marks_obtained": 79.5,
    "grade": "B+",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Kinematics of Machinery",
    "enrollment_no": "LJU2024ME001",
    "marks_obtained": 42.5,
    "grade": "A+",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Kinematics of Machinery",
    "enrollment_no": "LJU2024ME003",
    "marks_obtained": 38.0,
    "grade": "A",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Semester 1 Final Exam - Engineering Graphics & CAD",
    "enrollment_no": "LJU2024ME001",
    "marks_obtained": 86.0,
    "grade": "A",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Semester 1 Final Exam - Engineering Graphics & CAD",
    "enrollment_no": "LJU2024ME003",
    "marks_obtained": 79.5,
    "grade": "B+",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Structural Analysis II",
    "enrollment_no": "LJU2024CE001",
    "marks_obtained": 42.5,
    "grade": "A+",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Structural Analysis II",
    "enrollment_no": "LJU2024CE003",
    "marks_obtained": 38.0,
    "grade": "A",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Semester 1 Final Exam - Engineering Surveying I",
    "enrollment_no": "LJU2024CE001",
    "marks_obtained": 86.0,
    "grade": "A",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Semester 1 Final Exam - Engineering Surveying I",
    "enrollment_no": "LJU2024CE003",
    "marks_obtained": 79.5,
    "grade": "B+",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Chemical Engineering Thermodynamics II",
    "enrollment_no": "LJU2024CH001",
    "marks_obtained": 42.5,
    "grade": "A+",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Mid-Semester Exam 2026 - Chemical Engineering Thermodynamics II",
    "enrollment_no": "LJU2024CH003",
    "marks_obtained": 38.0,
    "grade": "A",
    "remarks": "Excellent conceptual clarity and execution."
  },
  {
    "exam_name": "Semester 1 Final Exam - General & Physical Chemistry",
    "enrollment_no": "LJU2024CH001",
    "marks_obtained": 86.0,
    "grade": "A",
    "remarks": "Passed with distinction."
  },
  {
    "exam_name": "Semester 1 Final Exam - General & Physical Chemistry",
    "enrollment_no": "LJU2024CH003",
    "marks_obtained": 79.5,
    "grade": "B+",
    "remarks": "Passed with distinction."
  }
];
const SAMPLE_ATTENDANCE = [
  {
    "enrollment_no": "LJU2024CS001",
    "subject_code": "CSE-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "amit.patel@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CS002",
    "subject_code": "CSE-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "amit.patel@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CS001",
    "subject_code": "CSE-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "amit.patel@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CS002",
    "subject_code": "CSE-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "amit.patel@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CS001",
    "subject_code": "CSE-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "amit.patel@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CS002",
    "subject_code": "CSE-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "amit.patel@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CS001",
    "subject_code": "CSE-401",
    "date": "2026-10-12",
    "status": "Present",
    "marked_by_email": "amit.patel@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CS002",
    "subject_code": "CSE-401",
    "date": "2026-10-12",
    "status": "Absent",
    "marked_by_email": "amit.patel@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024CS001",
    "subject_code": "CSE-401",
    "date": "2026-10-14",
    "status": "Present",
    "marked_by_email": "amit.patel@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CS002",
    "subject_code": "CSE-401",
    "date": "2026-10-14",
    "status": "Absent",
    "marked_by_email": "amit.patel@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024IT001",
    "subject_code": "IT-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "sanjay.solanki@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024IT002",
    "subject_code": "IT-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "sanjay.solanki@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024IT001",
    "subject_code": "IT-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "sanjay.solanki@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024IT002",
    "subject_code": "IT-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "sanjay.solanki@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024IT001",
    "subject_code": "IT-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "sanjay.solanki@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024IT002",
    "subject_code": "IT-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "sanjay.solanki@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024IT001",
    "subject_code": "IT-401",
    "date": "2026-10-12",
    "status": "Present",
    "marked_by_email": "sanjay.solanki@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024IT002",
    "subject_code": "IT-401",
    "date": "2026-10-12",
    "status": "Absent",
    "marked_by_email": "sanjay.solanki@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024IT001",
    "subject_code": "IT-401",
    "date": "2026-10-14",
    "status": "Present",
    "marked_by_email": "sanjay.solanki@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024IT002",
    "subject_code": "IT-401",
    "date": "2026-10-14",
    "status": "Absent",
    "marked_by_email": "sanjay.solanki@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024AI001",
    "subject_code": "AIML-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "kunal.shah@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024AI002",
    "subject_code": "AIML-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "kunal.shah@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024AI001",
    "subject_code": "AIML-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "kunal.shah@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024AI002",
    "subject_code": "AIML-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "kunal.shah@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024AI001",
    "subject_code": "AIML-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "kunal.shah@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024AI002",
    "subject_code": "AIML-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "kunal.shah@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024AI001",
    "subject_code": "AIML-401",
    "date": "2026-10-12",
    "status": "Present",
    "marked_by_email": "kunal.shah@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024AI002",
    "subject_code": "AIML-401",
    "date": "2026-10-12",
    "status": "Absent",
    "marked_by_email": "kunal.shah@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024AI001",
    "subject_code": "AIML-401",
    "date": "2026-10-14",
    "status": "Present",
    "marked_by_email": "kunal.shah@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024AI002",
    "subject_code": "AIML-401",
    "date": "2026-10-14",
    "status": "Absent",
    "marked_by_email": "kunal.shah@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024EC001",
    "subject_code": "ECE-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "hardik.vyas@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024EC003",
    "subject_code": "ECE-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "hardik.vyas@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024EC001",
    "subject_code": "ECE-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "hardik.vyas@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024EC003",
    "subject_code": "ECE-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "hardik.vyas@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024EC001",
    "subject_code": "ECE-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "hardik.vyas@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024EC003",
    "subject_code": "ECE-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "hardik.vyas@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024EC001",
    "subject_code": "ECE-401",
    "date": "2026-10-12",
    "status": "Present",
    "marked_by_email": "hardik.vyas@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024EC003",
    "subject_code": "ECE-401",
    "date": "2026-10-12",
    "status": "Absent",
    "marked_by_email": "hardik.vyas@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024EC001",
    "subject_code": "ECE-401",
    "date": "2026-10-14",
    "status": "Present",
    "marked_by_email": "hardik.vyas@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024EC003",
    "subject_code": "ECE-401",
    "date": "2026-10-14",
    "status": "Absent",
    "marked_by_email": "hardik.vyas@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024ME001",
    "subject_code": "ME-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "vikram.rathod@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024ME003",
    "subject_code": "ME-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "vikram.rathod@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024ME001",
    "subject_code": "ME-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "vikram.rathod@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024ME003",
    "subject_code": "ME-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "vikram.rathod@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024ME001",
    "subject_code": "ME-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "vikram.rathod@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024ME003",
    "subject_code": "ME-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "vikram.rathod@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024ME001",
    "subject_code": "ME-401",
    "date": "2026-10-12",
    "status": "Present",
    "marked_by_email": "vikram.rathod@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024ME003",
    "subject_code": "ME-401",
    "date": "2026-10-12",
    "status": "Absent",
    "marked_by_email": "vikram.rathod@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024ME001",
    "subject_code": "ME-401",
    "date": "2026-10-14",
    "status": "Present",
    "marked_by_email": "vikram.rathod@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024ME003",
    "subject_code": "ME-401",
    "date": "2026-10-14",
    "status": "Absent",
    "marked_by_email": "vikram.rathod@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024CE001",
    "subject_code": "CE-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "parth.chokshi@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CE003",
    "subject_code": "CE-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "parth.chokshi@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CE001",
    "subject_code": "CE-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "parth.chokshi@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CE003",
    "subject_code": "CE-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "parth.chokshi@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CE001",
    "subject_code": "CE-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "parth.chokshi@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CE003",
    "subject_code": "CE-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "parth.chokshi@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CE001",
    "subject_code": "CE-401",
    "date": "2026-10-12",
    "status": "Present",
    "marked_by_email": "parth.chokshi@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CE003",
    "subject_code": "CE-401",
    "date": "2026-10-12",
    "status": "Absent",
    "marked_by_email": "parth.chokshi@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024CE001",
    "subject_code": "CE-401",
    "date": "2026-10-14",
    "status": "Present",
    "marked_by_email": "parth.chokshi@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CE003",
    "subject_code": "CE-401",
    "date": "2026-10-14",
    "status": "Absent",
    "marked_by_email": "parth.chokshi@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024CH001",
    "subject_code": "CH-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "jignesh.raval@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CH003",
    "subject_code": "CH-401",
    "date": "2026-10-05",
    "status": "Present",
    "marked_by_email": "jignesh.raval@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CH001",
    "subject_code": "CH-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "jignesh.raval@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CH003",
    "subject_code": "CH-401",
    "date": "2026-10-07",
    "status": "Present",
    "marked_by_email": "jignesh.raval@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CH001",
    "subject_code": "CH-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "jignesh.raval@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CH003",
    "subject_code": "CH-401",
    "date": "2026-10-10",
    "status": "Present",
    "marked_by_email": "jignesh.raval@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CH001",
    "subject_code": "CH-401",
    "date": "2026-10-12",
    "status": "Present",
    "marked_by_email": "jignesh.raval@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CH003",
    "subject_code": "CH-401",
    "date": "2026-10-12",
    "status": "Absent",
    "marked_by_email": "jignesh.raval@ljku.edu.in",
    "remarks": "Medical leave reported"
  },
  {
    "enrollment_no": "LJU2024CH001",
    "subject_code": "CH-401",
    "date": "2026-10-14",
    "status": "Present",
    "marked_by_email": "jignesh.raval@ljku.edu.in",
    "remarks": "On time"
  },
  {
    "enrollment_no": "LJU2024CH003",
    "subject_code": "CH-401",
    "date": "2026-10-14",
    "status": "Absent",
    "marked_by_email": "jignesh.raval@ljku.edu.in",
    "remarks": "Medical leave reported"
  }
];
const SAMPLE_ASSIGNMENTS = [
  {
    "title": "CSE Lab Practical Assignment 1 - System Implementation",
    "subject_code": "CSE-401",
    "department_code": "CSE",
    "semester": 4,
    "description": "Design and implement practical case study module for Operating Systems & Kernel Architecture.",
    "due_date": "2026-11-15",
    "max_marks": 50,
    "created_by_email": "amit.patel@ljku.edu.in"
  },
  {
    "title": "IT Lab Practical Assignment 1 - System Implementation",
    "subject_code": "IT-401",
    "department_code": "IT",
    "semester": 4,
    "description": "Design and implement practical case study module for Database Management Systems - IT.",
    "due_date": "2026-11-15",
    "max_marks": 50,
    "created_by_email": "sanjay.solanki@ljku.edu.in"
  },
  {
    "title": "AIML Lab Practical Assignment 1 - System Implementation",
    "subject_code": "AIML-401",
    "department_code": "AIML",
    "semester": 4,
    "description": "Design and implement practical case study module for Machine Learning Algorithms & Models.",
    "due_date": "2026-11-15",
    "max_marks": 50,
    "created_by_email": "kunal.shah@ljku.edu.in"
  },
  {
    "title": "ECE Lab Practical Assignment 1 - System Implementation",
    "subject_code": "ECE-401",
    "department_code": "ECE",
    "semester": 4,
    "description": "Design and implement practical case study module for Microprocessors & Microcontrollers.",
    "due_date": "2026-11-15",
    "max_marks": 50,
    "created_by_email": "hardik.vyas@ljku.edu.in"
  },
  {
    "title": "ME Lab Practical Assignment 1 - System Implementation",
    "subject_code": "ME-401",
    "department_code": "ME",
    "semester": 4,
    "description": "Design and implement practical case study module for Kinematics of Machinery.",
    "due_date": "2026-11-15",
    "max_marks": 50,
    "created_by_email": "vikram.rathod@ljku.edu.in"
  },
  {
    "title": "CE Lab Practical Assignment 1 - System Implementation",
    "subject_code": "CE-401",
    "department_code": "CE",
    "semester": 4,
    "description": "Design and implement practical case study module for Structural Analysis II.",
    "due_date": "2026-11-15",
    "max_marks": 50,
    "created_by_email": "parth.chokshi@ljku.edu.in"
  },
  {
    "title": "CH Lab Practical Assignment 1 - System Implementation",
    "subject_code": "CH-401",
    "department_code": "CH",
    "semester": 4,
    "description": "Design and implement practical case study module for Chemical Engineering Thermodynamics II.",
    "due_date": "2026-11-15",
    "max_marks": 50,
    "created_by_email": "jignesh.raval@ljku.edu.in"
  }
];
const SAMPLE_ASSIGNMENT_SUBMISSIONS = [
  {
    "assignment_title": "CSE Lab Practical Assignment 1 - System Implementation",
    "enrollment_no": "LJU2024CS001",
    "submission_content": "GitHub Repository: https://github.com/lj-university/cse-lab-assignment",
    "submission_text": "Completed full implementation with unit tests, benchmark logs, and documentation.",
    "submission_file_url": "https://portal.ljku.edu.in/submissions/cse_assign1.pdf",
    "status": "Graded",
    "marks_obtained": 48.0,
    "feedback": "Outstanding implementation and thorough code comments."
  },
  {
    "assignment_title": "IT Lab Practical Assignment 1 - System Implementation",
    "enrollment_no": "LJU2024IT001",
    "submission_content": "GitHub Repository: https://github.com/lj-university/it-lab-assignment",
    "submission_text": "Completed full implementation with unit tests, benchmark logs, and documentation.",
    "submission_file_url": "https://portal.ljku.edu.in/submissions/it_assign1.pdf",
    "status": "Graded",
    "marks_obtained": 48.0,
    "feedback": "Outstanding implementation and thorough code comments."
  },
  {
    "assignment_title": "AIML Lab Practical Assignment 1 - System Implementation",
    "enrollment_no": "LJU2024AI001",
    "submission_content": "GitHub Repository: https://github.com/lj-university/aiml-lab-assignment",
    "submission_text": "Completed full implementation with unit tests, benchmark logs, and documentation.",
    "submission_file_url": "https://portal.ljku.edu.in/submissions/aiml_assign1.pdf",
    "status": "Graded",
    "marks_obtained": 48.0,
    "feedback": "Outstanding implementation and thorough code comments."
  },
  {
    "assignment_title": "ECE Lab Practical Assignment 1 - System Implementation",
    "enrollment_no": "LJU2024EC001",
    "submission_content": "GitHub Repository: https://github.com/lj-university/ece-lab-assignment",
    "submission_text": "Completed full implementation with unit tests, benchmark logs, and documentation.",
    "submission_file_url": "https://portal.ljku.edu.in/submissions/ece_assign1.pdf",
    "status": "Graded",
    "marks_obtained": 48.0,
    "feedback": "Outstanding implementation and thorough code comments."
  },
  {
    "assignment_title": "ME Lab Practical Assignment 1 - System Implementation",
    "enrollment_no": "LJU2024ME001",
    "submission_content": "GitHub Repository: https://github.com/lj-university/me-lab-assignment",
    "submission_text": "Completed full implementation with unit tests, benchmark logs, and documentation.",
    "submission_file_url": "https://portal.ljku.edu.in/submissions/me_assign1.pdf",
    "status": "Graded",
    "marks_obtained": 48.0,
    "feedback": "Outstanding implementation and thorough code comments."
  },
  {
    "assignment_title": "CE Lab Practical Assignment 1 - System Implementation",
    "enrollment_no": "LJU2024CE001",
    "submission_content": "GitHub Repository: https://github.com/lj-university/ce-lab-assignment",
    "submission_text": "Completed full implementation with unit tests, benchmark logs, and documentation.",
    "submission_file_url": "https://portal.ljku.edu.in/submissions/ce_assign1.pdf",
    "status": "Graded",
    "marks_obtained": 48.0,
    "feedback": "Outstanding implementation and thorough code comments."
  },
  {
    "assignment_title": "CH Lab Practical Assignment 1 - System Implementation",
    "enrollment_no": "LJU2024CH001",
    "submission_content": "GitHub Repository: https://github.com/lj-university/ch-lab-assignment",
    "submission_text": "Completed full implementation with unit tests, benchmark logs, and documentation.",
    "submission_file_url": "https://portal.ljku.edu.in/submissions/ch_assign1.pdf",
    "status": "Graded",
    "marks_obtained": 48.0,
    "feedback": "Outstanding implementation and thorough code comments."
  }
];
const SAMPLE_NOTICES = [
  {
    "title": "Welcome to Academic Session 2026\u20132027",
    "category": "Academic",
    "target_role": "All",
    "department_code": null,
    "content": "LJ University warmly welcomes all undergraduate and postgraduate students to Academic Year 2026\u20132027. Classes commence per timetable.",
    "publish_date": "2026-07-01",
    "priority": "High",
    "posted_by": "Office of the Dean Academic"
  },
  {
    "title": "Mandatory 75% Statutory Attendance Rule Notification",
    "category": "Regulatory",
    "target_role": "Students",
    "department_code": null,
    "content": "All students are hereby notified that as per UGC and LJ University Academic Regulations, a minimum of 75% attendance is strictly required to be eligible for end-semester university examinations.",
    "publish_date": "2026-07-15",
    "priority": "Urgent",
    "posted_by": "Controller of Examinations"
  },
  {
    "title": "CSE Department: Annual Hackathon & Cloud Innovation Drive 2026",
    "category": "Event",
    "target_role": "Students",
    "department_code": "CSE",
    "content": "The Department of Computer Science & Engineering is organizing the 48-Hour National Hackathon on Cloud Native Architectures and GenAI.",
    "publish_date": "2026-08-20",
    "priority": "High",
    "posted_by": "Dr. Amit Patel (HOD - CSE)"
  },
  {
    "title": "IT Department: AWS Cloud & DevOps Certification Workshop",
    "category": "Workshop",
    "target_role": "Students",
    "department_code": "IT",
    "content": "Hands-on boot camp covering AWS Solutions Architect Associate concepts, Docker containerization, and automated Jenkins CI/CD pipelines.",
    "publish_date": "2026-08-22",
    "priority": "Normal",
    "posted_by": "Dr. Sanjay Solanki (HOD - IT)"
  },
  {
    "title": "AIML Department: NVIDIA Deep Learning Institute (DLI) Workshop",
    "category": "Training",
    "target_role": "Students",
    "department_code": "AIML",
    "content": "Official NVIDIA certification workshop on Fundamentals of Deep Learning with PyTorch and GPU-accelerated computing.",
    "publish_date": "2026-08-25",
    "priority": "High",
    "posted_by": "Dr. Kunal Shah (HOD - AIML)"
  },
  {
    "title": "ECE Department: VLSI Design & Semi-Conductor Fabrication Symposium",
    "category": "Technical",
    "target_role": "Students",
    "department_code": "ECE",
    "content": "National technical symposium on chip design, Verilog HDL synthesis, and industrial visit to ISRO Space Applications Centre.",
    "publish_date": "2026-08-28",
    "priority": "Normal",
    "posted_by": "Dr. Hardik Vyas (HOD - ECE)"
  },
  {
    "title": "ME Department: CAD/CAM Automotive Design & EV Challenge 2026",
    "category": "Competition",
    "target_role": "Students",
    "department_code": "ME",
    "content": "Annual SAE India Collegiate Electric Vehicle Chassis Design and Aerodynamics simulation competition registration.",
    "publish_date": "2026-09-01",
    "priority": "High",
    "posted_by": "Dr. Vikram Rathod (HOD - ME)"
  },
  {
    "title": "CE Department: Smart Cities & Earthquake Resilient Design Expo",
    "category": "Exhibition",
    "target_role": "Students",
    "department_code": "CE",
    "content": "Technical demonstration of base isolation dampers, BIM 3D modelling, and geotechnical soil stability analysis.",
    "publish_date": "2026-09-05",
    "priority": "Normal",
    "posted_by": "Dr. Parth Chokshi (HOD - CE)"
  },
  {
    "title": "CH Department: Green Chemistry & Industrial Safety Seminar",
    "category": "Seminar",
    "target_role": "Students",
    "department_code": "CH",
    "content": "Distinguished lecture series on sustainable chemical reaction kinetics and zero-liquid-discharge (ZLD) effluent plants.",
    "publish_date": "2026-09-10",
    "priority": "Normal",
    "posted_by": "Dr. Jignesh Raval (HOD - CH)"
  }
];

// -------------------------------------------------------------
// 3. SEED EXECUTION ENGINE
// -------------------------------------------------------------
async function runSeed() {
  const dbConfig = getDbConfig();
  const isCloud = !!process.env.DATABASE_URL;
  let targetDisplay = '';
  let dbName = '';

  if (isCloud) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      dbName = parsed.pathname.replace(/^\//, '') || 'default_db';
      const maskedAuth = parsed.username ? `${parsed.username}@` : '';
      targetDisplay = `${parsed.protocol}//${maskedAuth}${parsed.host}/${dbName}`;
    } catch {
      targetDisplay = 'Remote Cloud PostgreSQL (DATABASE_URL configured)';
      dbName = 'remote_db';
    }
  } else {
    dbName = dbConfig.database || 'lj_department_db';
    targetDisplay = `${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbName}`;
  }

  const envMode = process.env.NODE_ENV || 'development';
  console.log('\n===============================================================');
  console.log('🌱 LJ UNIVERSITY ERP - UNIFIED PORTABLE SEEDING ENGINE');
  console.log('   Multi-Branch Engineering & Multi-Module Synchronizer');
  console.log('===============================================================');
  console.log(`🌍 Execution Environment : ${envMode.toUpperCase()}`);
  console.log(`🎯 Target Database       : ${targetDisplay}`);
  console.log(`🔒 SSL Encryption        : ${dbConfig.ssl ? 'Enabled (Secure)' : 'Disabled'}`);
  console.log('===============================================================\n');

  // Verify database exists on local PostgreSQL instances (skipped on cloud managed DBs)
  if (!isCloud) {
    const adminClient = new Pool({
      user: dbConfig.user,
      password: dbConfig.password,
      host: dbConfig.host,
      port: dbConfig.port,
      database: 'postgres',
      ssl: dbConfig.ssl
    });

    try {
      console.log(`🔍 Checking if PostgreSQL database '${dbName}' exists...`);
      const checkDb = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName]
      );

      if (checkDb.rows.length === 0) {
        console.log(`⚙ Creating database '${dbName}'...`);
        await adminClient.query(`CREATE DATABASE "${dbName}"`);
        console.log(`✔ Database '${dbName}' created successfully.`);
      } else {
        console.log(`✔ Database '${dbName}' already exists.`);
      }
    } catch (err) {
      console.warn(`Local database verification note: ${err.message}`);
    } finally {
      await adminClient.end();
    }
  } else {
    console.log(`☁️  Connecting to Cloud PostgreSQL database instance (${dbName})...`);
  }

  // Connect to target database
  const client = new Pool(dbConfig);

  try {
    await client.connect();
    console.log(`✔ Connected to target PostgreSQL database: ${dbName}`);

    // [0/12] Legacy alias consolidation & obsolete department cleanup
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
          -- Consolidate legacy aliases
          IF EXISTS (SELECT 1 FROM departments WHERE department_code = 'MECH') AND EXISTS (SELECT 1 FROM departments WHERE department_code = 'ME') THEN
            UPDATE faculty SET department_id = (SELECT id FROM departments WHERE department_code = 'ME' LIMIT 1) WHERE department_id = (SELECT id FROM departments WHERE department_code = 'MECH' LIMIT 1);
            DELETE FROM departments WHERE department_code = 'MECH';
          END IF;
          IF EXISTS (SELECT 1 FROM departments WHERE department_code = 'CIVIL') AND EXISTS (SELECT 1 FROM departments WHERE department_code = 'CE') THEN
            UPDATE faculty SET department_id = (SELECT id FROM departments WHERE department_code = 'CE' LIMIT 1) WHERE department_id = (SELECT id FROM departments WHERE department_code = 'CIVIL' LIMIT 1);
            DELETE FROM departments WHERE department_code = 'CIVIL';
          END IF;

          -- Clean up old obsolete departments from previous university configurations:
          DELETE FROM departments WHERE department_code IN ('LAW', 'INT-DES', 'BIOTECH', 'CHEM', 'EEE', 'MECH', 'CIVIL', 'BBA-MBA');
        END IF;
      END $$;
    `);

    // [1/12] Schema DDL
    console.log('\n[1/12] 📜 Ensuring all 17 database tables, constraints, and indexes exist...');
    await client.query(SCHEMA_DDL);
    console.log('✔ All schema tables, relationships, and performance indexes verified.');

    // [2/12] Users
    console.log('\n[2/12] 👤 Seeding administrative user accounts...');
    for (const u of SAMPLE_USERS) {
      await client.query(`
        INSERT INTO users (name, email, password, role, avatar_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email)
        DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, avatar_url = EXCLUDED.avatar_url;
      `, [u.name, u.email, u.password, u.role, u.avatar_url]);
    }
    console.log(`✔ Users verified (${SAMPLE_USERS.length} accounts).`);

    // [3/12] Academic Sessions
    console.log('\n[3/12] 📅 Seeding academic sessions (including historical archives)...');
    for (const s of SAMPLE_ACADEMIC_SESSIONS) {
      await client.query(`
        INSERT INTO academic_sessions (session_name, term, start_date, end_date, status, is_current)
        VALUES ($1, $2, $3::DATE, $4::DATE, $5, $6)
        ON CONFLICT (session_name)
        DO UPDATE SET term = EXCLUDED.term, status = EXCLUDED.status, is_current = EXCLUDED.is_current;
      `, [s.session_name, s.term, s.start_date, s.end_date, s.status, s.is_current]);
    }
    console.log(`✔ Academic sessions verified (${SAMPLE_ACADEMIC_SESSIONS.length} sessions).`);

    // [4/12] Schools
    console.log('\n[4/12] 🏢 Seeding schools and academic faculties...');
    for (const sc of SAMPLE_SCHOOLS) {
      await client.query(`
        INSERT INTO schools (school_name, school_code, dean_name, contact_email, contact_phone, building, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (school_code)
        DO UPDATE SET school_name = EXCLUDED.school_name, dean_name = EXCLUDED.dean_name, building = EXCLUDED.building;
      `, [sc.school_name, sc.school_code, sc.dean_name, sc.contact_email, sc.contact_phone, sc.building, sc.status]);
    }
    console.log(`✔ Schools verified (${SAMPLE_SCHOOLS.length} schools).`);

    // [5/12] Departments (ALL 7 Branches)
    console.log('\n[5/12] 🏛️  Seeding academic departments (All 7 Engineering Branches + Professional)...');
    for (const d of SAMPLE_DEPARTMENTS) {
      await client.query(`
        INSERT INTO departments (department_name, department_code, school_id, email, phone, established_year, building, room_no, description, status)
        VALUES (
          $1, $2,
          (SELECT id FROM schools WHERE school_code = $3),
          $4, $5, $6, $7, $8, $9, $10
        )
        ON CONFLICT (department_code)
        DO UPDATE SET department_name = EXCLUDED.department_name, email = EXCLUDED.email, phone = EXCLUDED.phone, description = EXCLUDED.description;
      `, [d.department_name, d.department_code, d.school_code, d.email, d.phone, d.established_year, d.building, d.room_no, d.description, d.status]);
    }
    console.log(`✔ Departments verified (${SAMPLE_DEPARTMENTS.length} departments across all branches).`);

    // [6/12] Faculty Directory
    console.log('\n[6/12] 👨‍🏫 Seeding faculty directory & HODs across all engineering branches...');
    for (const f of SAMPLE_FACULTY) {
      await client.query(`
        INSERT INTO faculty (department_id, name, email, password, phone, designation, qualification, specialization, joining_date, experience_years, status)
        VALUES (
          (SELECT id FROM departments WHERE department_code = $1),
          $2, $3, $4, $5, $6, $7, $8, $9::DATE, $10, $11
        )
        ON CONFLICT (email)
        DO UPDATE SET designation = EXCLUDED.designation, qualification = EXCLUDED.qualification, specialization = EXCLUDED.specialization;
      `, [f.department_code, f.name, f.email, DEFAULT_PASSWORD_HASH, f.phone, f.designation, f.qualification, f.specialization, f.joining_date, f.experience_years, f.status]);
    }
    console.log(`✔ Faculty members verified (${SAMPLE_FACULTY.length} faculty across all branches).`);

    // [7/12] Synchronize HOD assignments
    console.log('\n[7/12] 🔗 Synchronizing department HOD assignments and live faculty counts...');
    const deptsRes = await client.query('SELECT id, department_code FROM departments');
    for (const dept of deptsRes.rows) {
      const hodRes = await client.query(`
        SELECT id FROM faculty 
        WHERE department_id = $1 AND (LOWER(designation) LIKE '%hod%' OR LOWER(designation) LIKE '%head%')
        LIMIT 1
      `, [dept.id]);

      const countRes = await client.query('SELECT COUNT(*) FROM faculty WHERE department_id = $1', [dept.id]);
      const fCount = parseInt(countRes.rows[0].count, 10);

      if (hodRes.rows.length > 0) {
        await client.query('UPDATE departments SET hod_id = $1, faculty_count = $2 WHERE id = $3', [hodRes.rows[0].id, fCount, dept.id]);
      } else {
        await client.query('UPDATE departments SET faculty_count = $1 WHERE id = $2', [fCount, dept.id]);
      }
    }
    console.log('✔ Department HOD assignments and live faculty counts synchronized.');

    // [8/12] Degree Programs
    console.log('\n[8/12] 📚 Seeding academic degree programs for all branches...');
    for (const p of SAMPLE_PROGRAMS) {
      await client.query(`
        INSERT INTO programs (program_name, program_code, department_id, degree_level, intake_capacity, duration_years, status)
        VALUES (
          $1, $2,
          (SELECT id FROM departments WHERE department_code = $3),
          $4, $5, $6, $7
        )
        ON CONFLICT (program_code)
        DO UPDATE SET program_name = EXCLUDED.program_name, intake_capacity = EXCLUDED.intake_capacity;
      `, [p.program_name, p.program_code, p.department_code, p.degree_level, p.intake_capacity, p.duration_years, p.status]);
    }
    console.log(`✔ Academic programs verified (${SAMPLE_PROGRAMS.length} programs).`);

    // [9/12] Subjects (All Branches, Sem 1 to 8)
    console.log('\n[9/12] 📖 Seeding subjects & courses across ALL 7 Branches for Semesters 1 through 8...');
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
        ON CONFLICT (subject_code)
        DO UPDATE SET subject_name = EXCLUDED.subject_name, semester = EXCLUDED.semester, credits = EXCLUDED.credits, type = EXCLUDED.type;
      `, [sub.subject_name, sub.subject_code, sub.department_code, sub.program_code, sub.semester, sub.credits, sub.type, sub.faculty_email, sub.description, sub.status]);
    }
    console.log(`✔ Subjects verified (${SAMPLE_SUBJECTS.length} courses across all engineering branches).`);

    // [10/12] Students (All Branches, Sem 1 to 8)
    console.log('\n[10/12] 🎓 Seeding detailed student records across ALL 7 Branches (Sem 1 through 8)...');
    for (const s of SAMPLE_STUDENTS) {
      await client.query(`
        INSERT INTO students (enrollment_no, name, email, password, phone, gender, dob, address, admission_year, current_semester, department_id, program_id, avatar_url, status)
        VALUES (
          $1, $2, $3, $4, $5, $6, $7::DATE, $8, $9, $10,
          (SELECT id FROM departments WHERE department_code = $11),
          (SELECT id FROM programs WHERE program_code = $12),
          $13, $14
        )
        ON CONFLICT (enrollment_no)
        DO UPDATE SET current_semester = EXCLUDED.current_semester, name = EXCLUDED.name, phone = EXCLUDED.phone, address = EXCLUDED.address;
      `, [s.enrollment_no, s.name, s.email, DEFAULT_PASSWORD_HASH, s.phone, s.gender, s.dob, s.address, s.admission_year, s.current_semester, s.department_code, s.program_code, s.avatar_url, s.status]);
    }
    console.log(`✔ Students verified (${SAMPLE_STUDENTS.length} students across all engineering branches).`);

    // [11/12] Academic DMS records
    console.log('\n[11/12] 📑 Seeding academic DMS records (Timetables, Academic History, Attendance, Exams, Results, Assignments, Notices)...');

    // Past Academic History
    for (const h of SAMPLE_ACADEMIC_HISTORY) {
      await client.query(`
        INSERT INTO student_academic_history (student_id, semester, academic_year, total_credits, credits_earned, sgpa, cgpa, status, remarks)
        VALUES (
          (SELECT id FROM students WHERE enrollment_no = $1),
          $2, $3, $4, $5, $6, $7, $8, $9
        )
        ON CONFLICT (student_id, semester)
        DO UPDATE SET sgpa = EXCLUDED.sgpa, cgpa = EXCLUDED.cgpa, credits_earned = EXCLUDED.credits_earned, status = EXCLUDED.status;
      `, [h.enrollment_no, h.semester, h.academic_year, h.total_credits, h.credits_earned, h.sgpa, h.cgpa, h.status, h.remarks]);
    }
    console.log(`✔ Academic history progression verified (${SAMPLE_ACADEMIC_HISTORY.length} records).`);

    // Timetables for ALL Branches and Semesters
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
    console.log(`✔ Timetables verified (${SAMPLE_TIMETABLES.length} slots across all branches and semesters).`);

    // Attendance
    for (const a of SAMPLE_ATTENDANCE) {
      await client.query(`
        INSERT INTO attendance (student_id, subject_id, date, status, marked_by, remarks)
        VALUES (
          (SELECT id FROM students WHERE enrollment_no = $1),
          (SELECT id FROM subjects WHERE subject_code = $2),
          $3::DATE, $4,
          (SELECT id FROM faculty WHERE email = $5),
          $6
        )
        ON CONFLICT (student_id, subject_id, date) DO NOTHING;
      `, [a.enrollment_no, a.subject_code, a.date, a.status, a.marked_by_email, a.remarks]);
    }
    console.log(`✔ Attendance records verified (${SAMPLE_ATTENDANCE.length} records).`);

    // Exams
    for (const e of SAMPLE_EXAMS) {
      await client.query(`
        INSERT INTO exams (exam_name, subject_id, exam_date, time_slot, classroom, max_marks, passing_marks, status)
        VALUES (
          $1,
          (SELECT id FROM subjects WHERE subject_code = $2),
          $3::DATE, $4, $5, $6, $7, $8
        )
        ON CONFLICT (subject_id, exam_name, exam_date)
        DO UPDATE SET status = EXCLUDED.status, max_marks = EXCLUDED.max_marks;
      `, [e.exam_name, e.subject_code, e.exam_date, e.time_slot, e.classroom, e.max_marks, e.passing_marks, e.status]);
    }
    console.log(`✔ Exams verified (${SAMPLE_EXAMS.length} exams).`);

    // Exam Results
    for (const r of SAMPLE_EXAM_RESULTS) {
      await client.query(`
        INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade, remarks)
        VALUES (
          (SELECT id FROM exams WHERE exam_name = $1 LIMIT 1),
          (SELECT id FROM students WHERE enrollment_no = $2),
          $3, $4, $5
        )
        ON CONFLICT (exam_id, student_id)
        DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, grade = EXCLUDED.grade, remarks = EXCLUDED.remarks;
      `, [r.exam_name, r.enrollment_no, r.marks_obtained, r.grade, r.remarks]);
    }
    console.log(`✔ Exam results verified (${SAMPLE_EXAM_RESULTS.length} marks entries).`);

    // Assignments
    for (const asg of SAMPLE_ASSIGNMENTS) {
      await client.query(`
        INSERT INTO assignments (title, subject_id, department_id, semester, description, due_date, max_marks, created_by)
        VALUES (
          $1,
          (SELECT id FROM subjects WHERE subject_code = $2),
          (SELECT id FROM departments WHERE department_code = $3),
          $4, $5, $6::DATE, $7,
          (SELECT id FROM faculty WHERE email = $8)
        )
        ON CONFLICT (subject_id, title)
        DO UPDATE SET due_date = EXCLUDED.due_date, max_marks = EXCLUDED.max_marks;
      `, [asg.title, asg.subject_code, asg.department_code, asg.semester, asg.description, asg.due_date, asg.max_marks, asg.created_by_email]);
    }
    console.log(`✔ Assignments verified (${SAMPLE_ASSIGNMENTS.length} assignments).`);

    // Assignment Submissions
    for (const sub of SAMPLE_ASSIGNMENT_SUBMISSIONS) {
      await client.query(`
        INSERT INTO assignment_submissions (assignment_id, student_id, submission_content, submission_text, submission_file_url, status, marks_obtained, feedback)
        VALUES (
          (SELECT id FROM assignments WHERE title = $1 LIMIT 1),
          (SELECT id FROM students WHERE enrollment_no = $2),
          $3, $4, $5, $6, $7, $8
        )
        ON CONFLICT (assignment_id, student_id)
        DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, feedback = EXCLUDED.feedback, status = EXCLUDED.status;
      `, [sub.assignment_title, sub.enrollment_no, sub.submission_content, sub.submission_text, sub.submission_file_url, sub.status, sub.marks_obtained, sub.feedback]);
    }
    console.log(`✔ Assignment submissions verified (${SAMPLE_ASSIGNMENT_SUBMISSIONS.length} submissions).`);

    // Notices
    for (const n of SAMPLE_NOTICES) {
      await client.query(`
        INSERT INTO notices (title, category, target_role, department_id, content, publish_date, priority, posted_by)
        VALUES (
          $1, $2, $3,
          (CASE WHEN $4::text IS NOT NULL THEN (SELECT id FROM departments WHERE department_code = $4) ELSE NULL END),
          $5, $6::DATE, $7, $8
        )
        ON CONFLICT (title, publish_date) DO NOTHING;
      `, [n.title, n.category, n.target_role, n.department_code, n.content, n.publish_date, n.priority, n.posted_by]);
    }
    console.log(`✔ Notices verified (${SAMPLE_NOTICES.length} circulars).`);

    // [12/12] Synchronize PostgreSQL Sequences
    console.log('\n[12/12] 🔄 Synchronizing PostgreSQL auto-increment sequence counters...');
    const tables = [
      'users', 'academic_sessions', 'schools', 'departments', 'faculty',
      'programs', 'students', 'subjects', 'attendance', 'timetables',
      'exams', 'exam_results', 'student_academic_history', 'assignments',
      'assignment_submissions', 'notices', 'password_resets'
    ];

    for (const table of tables) {
      try {
        await client.query(`
          SELECT setval(
            pg_get_serial_sequence('${table}', 'id'),
            COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1,
            false
          );
        `);
      } catch (seqErr) {
        // Sequence may not exist if no auto-increment ID
      }
    }
    console.log('✔ All database sequences synchronized.');

    // Print summary stats
    const counts = {};
    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = res.rows[0].count;
    }

    console.log('\n===============================================================');
    console.log('🎉 POSTGRESQL DATABASE SEEDED & SYNCHRONIZED SUCCESSFULLY');
    console.log('===============================================================');
    console.table([
      { Entity: 'Users (Admin / Dean)', Table: 'users', Records: counts.users },
      { Entity: 'Academic Sessions', Table: 'academic_sessions', Records: counts.academic_sessions },
      { Entity: 'Schools & Institutes', Table: 'schools', Records: counts.schools },
      { Entity: 'Departments (All Branches)', Table: 'departments', Records: counts.departments },
      { Entity: 'Faculty Members (All Branches)', Table: 'faculty', Records: counts.faculty },
      { Entity: 'Academic Programs', Table: 'programs', Records: counts.programs },
      { Entity: 'Students (All Branches, Sem 1-8)', Table: 'students', Records: counts.students },
      { Entity: 'Courses & Subjects (All Branches)', Table: 'subjects', Records: counts.subjects },
      { Entity: 'Attendance Records', Table: 'attendance', Records: counts.attendance },
      { Entity: 'Timetable Slots (All Branches)', Table: 'timetables', Records: counts.timetables },
      { Entity: 'Examinations (Past & Current)', Table: 'exams', Records: counts.exams },
      { Entity: 'Exam Results (Marks & Grades)', Table: 'exam_results', Records: counts.exam_results },
      { Entity: 'Past Academic History (SGPA/CGPA)', Table: 'student_academic_history', Records: counts.student_academic_history },
      { Entity: 'Coursework Assignments', Table: 'assignments', Records: counts.assignments },
      { Entity: 'Student Submissions', Table: 'assignment_submissions', Records: counts.assignment_submissions },
      { Entity: 'Notices & Circulars', Table: 'notices', Records: counts.notices }
    ]);
    console.log('===============================================================');
    console.log('🔑 Role-Specific Test Accounts for ALL Branches:');
    console.log('   Super Admin:     admin@ljku.edu.in          / admin123 (Full system access)');
    console.log('   Dean Academic:   dean.academic@ljku.edu.in  / admin123 (University overview)');
    console.log('   CSE HOD:         amit.patel@ljku.edu.in     / admin123 (CSE Department)');
    console.log('   IT HOD:          sanjay.solanki@ljku.edu.in / admin123 (IT Department)');
    console.log('   AIML HOD:        kunal.shah@ljku.edu.in     / admin123 (AIML Department)');
    console.log('   ECE HOD:         hardik.vyas@ljku.edu.in    / admin123 (ECE Department)');
    console.log('   ME HOD:          vikram.rathod@ljku.edu.in  / admin123 (ME Department)');
    console.log('   CE HOD:          parth.chokshi@ljku.edu.in  / admin123 (CE Department)');
    console.log('   CH HOD:          jignesh.raval@ljku.edu.in  / admin123 (CH Department)');
    console.log('   --- Students per Branch ---');
    console.log('   CSE Student:     aarav.patel@ljku.edu.in    / admin123 (Sem 4 CSE)');
    console.log('   IT Student:      devansh.raval@ljku.edu.in  / admin123 (Sem 4 IT)');
    console.log('   AIML Student:    arjun.varma@ljku.edu.in    / admin123 (Sem 4 AIML)');
    console.log('   ECE Student:     parthiv.gohil@ljku.edu.in  / admin123 (Sem 4 ECE)');
    console.log('   ME Student:      meet.patel@ljku.edu.in     / admin123 (Sem 4 ME)');
    console.log('   CE Student:      darshan.raval@ljku.edu.in  / admin123 (Sem 4 CE)');
    console.log('   CH Student:      naitik.mehta@ljku.edu.in   / admin123 (Sem 4 CH)');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('❌ SEEDING FATAL ERROR:', err);
    throw err;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runSeed, seedDatabase: runSeed };
