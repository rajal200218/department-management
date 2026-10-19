-- =========================================================================
-- LJ UNIVERSITY ERP - PHASE 2 MODULE 12: DEPARTMENT MANAGEMENT SYSTEM
-- Database Schema (PostgreSQL)
-- Database Name: nuv_department_db
-- =========================================================================

-- Drop tables if they already exist (in reverse order of foreign keys)
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS academic_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE (Authentication & Roles)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ACADEMIC SESSIONS TABLE (Session / Academic Year Management)
CREATE TABLE academic_sessions (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(50) UNIQUE NOT NULL,
    term VARCHAR(100) DEFAULT 'Fall & Spring (Full Year)',
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Archived', 'Upcoming'
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SCHOOLS TABLE (Module 11 - School/Faculty Management integration)
CREATE TABLE schools (
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

-- 4. DEPARTMENTS TABLE (Module 12 - Department Management Core)
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    hod_id INTEGER, -- Foreign key to faculty table (set after table creation)
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

-- 5. FACULTY TABLE (Faculty Members & HOD assignment)
CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(50),
    designation VARCHAR(100) NOT NULL, -- e.g. 'HOD', 'Professor', 'Associate Professor', 'Assistant Professor'
    qualification VARCHAR(150),       -- e.g. 'Ph.D. in Computer Science', 'M.Tech AI'
    specialization VARCHAR(150),      -- e.g. 'Machine Learning & Cloud', 'VLSI Design'
    joining_date DATE,
    experience_years INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for HOD in departments table
ALTER TABLE departments
ADD CONSTRAINT fk_department_hod
FOREIGN KEY (hod_id) REFERENCES faculty(id) ON DELETE SET NULL;

-- 6. PROGRAMS TABLE (Academic Programs under Department - Module 13 integration)
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    program_name VARCHAR(150) NOT NULL,
    program_code VARCHAR(50) UNIQUE NOT NULL,
    degree_level VARCHAR(50) NOT NULL, -- e.g. 'Undergraduate (B.Tech)', 'Postgraduate (M.Tech)', 'Diploma', 'Doctorate (Ph.D)'
    intake_capacity INTEGER DEFAULT 60,
    duration_years INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PASSWORD RESETS TABLE (Secure Password Recovery & OTP Verification)
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    reset_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries and search
CREATE INDEX idx_academic_sessions_status ON academic_sessions(status);
CREATE INDEX idx_departments_school_id ON departments(school_id);
CREATE INDEX idx_departments_status ON departments(status);
CREATE INDEX idx_faculty_department_id ON faculty(department_id);
CREATE INDEX idx_faculty_joining_date ON faculty(joining_date);
CREATE INDEX idx_programs_department_id ON programs(department_id);
CREATE INDEX idx_password_resets_email ON password_resets(email);
CREATE INDEX idx_password_resets_token ON password_resets(reset_token);
