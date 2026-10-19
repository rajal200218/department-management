-- =========================================================================
-- LJ UNIVERSITY ERP - PHASE 2 MODULE 12: DEPARTMENT MANAGEMENT SYSTEM
-- Database Schema (PostgreSQL)
-- Database Name: nuv_department_db
-- =========================================================================

-- Drop tables if they already exist (in reverse order of foreign keys)
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS exam_results CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS timetables CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS academic_sessions CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
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

-- 8. STUDENTS TABLE (DMS Student Management)
CREATE TABLE students (
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

-- 9. SUBJECTS TABLE (DMS Course & Subject Management)
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    subject_name VARCHAR(150) NOT NULL,
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
    semester INTEGER NOT NULL DEFAULT 1,
    credits INTEGER NOT NULL DEFAULT 3,
    type VARCHAR(50) DEFAULT 'Theory', -- 'Theory', 'Practical', 'Elective'
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. ATTENDANCE TABLE (DMS Daily Attendance & Percentage Calculation)
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Present', -- 'Present', 'Absent', 'Late', 'Excused'
    marked_by INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_subject_date UNIQUE(student_id, subject_id, date)
);

-- 11. TIMETABLES TABLE (DMS Class Timetables & Conflict Prevention)
CREATE TABLE timetables (
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

-- 12. NOTICES TABLE (DMS College & Department Announcements)
CREATE TABLE notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) DEFAULT 'General', -- 'Examination', 'Holiday', 'Event', 'Academic', 'General'
    target_role VARCHAR(50) DEFAULT 'All', -- 'All', 'Faculty', 'Student'
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    publish_date DATE DEFAULT CURRENT_DATE,
    priority VARCHAR(20) DEFAULT 'Normal', -- 'Normal', 'High', 'Urgent'
    posted_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. EXAMS TABLE (DMS Examination Schedules)
CREATE TABLE exams (
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

-- 14. EXAM RESULTS TABLE (DMS Results & Grades)
CREATE TABLE exam_results (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5, 2) NOT NULL,
    grade VARCHAR(10),
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_student UNIQUE(exam_id, student_id)
);

-- 15. ASSIGNMENTS TABLE (DMS Faculty Assignments)
CREATE TABLE assignments (
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

-- 16. ASSIGNMENT SUBMISSIONS TABLE (DMS Student Submissions & Grading)
CREATE TABLE assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    submission_content TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Submitted',
    marks_obtained NUMERIC(5, 2),
    feedback TEXT,
    CONSTRAINT uq_assignment_student UNIQUE(assignment_id, student_id)
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
CREATE INDEX idx_students_dept ON students(department_id);
CREATE INDEX idx_students_enrollment ON students(enrollment_no);
CREATE INDEX idx_subjects_dept ON subjects(department_id);
CREATE INDEX idx_subjects_faculty ON subjects(faculty_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_subject ON attendance(subject_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_timetables_dept ON timetables(department_id);
CREATE INDEX idx_timetables_faculty ON timetables(faculty_id);
CREATE INDEX idx_timetables_day ON timetables(day_of_week);
CREATE INDEX idx_notices_dept ON notices(department_id);
CREATE INDEX idx_exams_subject ON exams(subject_id);
CREATE INDEX idx_exam_results_student ON exam_results(student_id);
CREATE INDEX idx_assignments_subject ON assignments(subject_id);
