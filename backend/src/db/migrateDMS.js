const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dmsMigrationSql = `
-- 7. STUDENTS TABLE
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
    current_semester INTEGER DEFAULT 4,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
    avatar_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. SUBJECTS TABLE
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

-- 9. ATTENDANCE TABLE
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

-- 10. TIMETABLES TABLE
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

-- 11. NOTICES TABLE
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

-- 12. EXAMS TABLE
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

-- 13. EXAM RESULTS TABLE
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

-- 14. ASSIGNMENTS TABLE
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

-- 15. ASSIGNMENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS assignment_submissions (
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

-- INDEXES
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
`;

const dmsSeedSql = `
-- SEED DATA FOR ENHANCED DMS MODULES

-- 1. Insert Initial Subjects
INSERT INTO subjects (id, subject_name, subject_code, department_id, program_id, semester, credits, type, faculty_id, description, status)
VALUES 
(1, 'Data Structures & Algorithms', 'CSE-401', 1, 1, 4, 4, 'Theory', 1, 'Core fundamentals of tree, graph, dynamic programming and algorithmic complexity.', 'Active'),
(2, 'Database Management Systems', 'CSE-402', 1, 1, 4, 4, 'Theory', 2, 'Relational models, SQL, indexing, transaction processing and concurrency control.', 'Active'),
(3, 'Computer Networks & Security', 'CSE-403', 1, 1, 4, 3, 'Theory', 3, 'TCP/IP stack, routing protocols, cryptography and network threat mitigation.', 'Active'),
(4, 'Full-Stack Web Development Lab', 'CSE-404', 1, 1, 4, 2, 'Practical', 4, 'Hands-on training in React, Node.js, RESTful architecture and PostgreSQL.', 'Active'),
(5, 'Artificial Intelligence Foundations', 'AIML-401', 3, 5, 4, 4, 'Theory', 8, 'Search algorithms, probabilistic reasoning, and intro to neural representations.', 'Active'),
(6, 'Cloud Architecture & DevOps', 'IT-401', 2, 4, 4, 3, 'Theory', 6, 'Containerization, Kubernetes, CI/CD pipelines, and AWS cloud management.', 'Active'),
(7, 'Machine Learning & Deep Neural Nets', 'CSE-601', 1, 1, 6, 4, 'Theory', 5, 'Supervised/unsupervised learning, convolutional networks, transformers and LLMs.', 'Active'),
(8, 'Software Engineering & Agile Methodologies', 'CSE-602', 1, 1, 6, 3, 'Theory', 1, 'Agile sprint life cycle, UML modeling, automated testing and software quality.', 'Active')
ON CONFLICT (subject_code) DO NOTHING;

SELECT setval('subjects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM subjects), true);

-- 2. Insert Students
INSERT INTO students (id, enrollment_no, name, email, password, phone, gender, dob, address, admission_year, current_semester, department_id, program_id, avatar_url, status)
VALUES 
(1, 'LJU2024CS001', 'Aarav Patel', 'aarav.patel@ljku.edu.in', 'admin123', '+91 98251 11001', 'Male', '2004-03-15', '12 Vastrapur Lake Rd, Ahmedabad', 2024, 4, 1, 1, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'Active'),
(2, 'LJU2024CS002', 'Diya Shah', 'diya.shah@ljku.edu.in', 'admin123', '+91 98251 11002', 'Female', '2004-07-22', '45 CG Road, Navrangpura, Ahmedabad', 2024, 4, 1, 1, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'Active'),
(3, 'LJU2024CS003', 'Rohan Mehta', 'rohan.mehta@ljku.edu.in', 'admin123', '+91 98251 11003', 'Male', '2003-11-05', '88 SG Highway, Bodakdev, Ahmedabad', 2024, 4, 1, 1, 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', 'Active'),
(4, 'LJU2024CS004', 'Ananya Joshi', 'ananya.joshi@ljku.edu.in', 'admin123', '+91 98251 11004', 'Female', '2004-01-30', '23 Satellite Rd, Ahmedabad', 2024, 4, 1, 1, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', 'Active'),
(5, 'LJU2024CS005', 'Kabir Trivedi', 'kabir.trivedi@ljku.edu.in', 'admin123', '+91 98251 11005', 'Male', '2004-09-12', '14 Prahladnagar, Ahmedabad', 2024, 4, 1, 1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Active'),
(6, 'LJU2024CS006', 'Isha Desai', 'isha.desai@ljku.edu.in', 'admin123', '+91 98251 11006', 'Female', '2004-05-18', '71 Drive-In Rd, Thaltej, Ahmedabad', 2024, 4, 1, 1, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 'Active'),
(7, 'LJU2024IT001', 'Devansh Raval', 'devansh.raval@ljku.edu.in', 'admin123', '+91 98251 11007', 'Male', '2004-08-08', '5 Bopal Gam, Ahmedabad', 2024, 4, 2, 4, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'Active'),
(8, 'LJU2024IT002', 'Pooja Bhatt', 'pooja.bhatt@ljku.edu.in', 'admin123', '+91 98251 11008', 'Female', '2004-04-25', '19 Iscon Cross Roads, SG Highway', 2024, 4, 2, 4, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'Active'),
(9, 'LJU2024AI001', 'Arjun Varma', 'arjun.varma@ljku.edu.in', 'admin123', '+91 98251 11009', 'Male', '2004-12-19', '32 Science City Rd, Sola, Ahmedabad', 2024, 4, 3, 5, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', 'Active'),
(10, 'LJU2024AI002', 'Tanvi Dave', 'tanvi.dave@ljku.edu.in', 'admin123', '+91 98251 11010', 'Female', '2004-06-14', '67 Sindhu Bhavan Rd, Bodakdev', 2024, 4, 3, 5, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', 'Active')
ON CONFLICT (enrollment_no) DO NOTHING;

SELECT setval('students_id_seq', (SELECT COALESCE(MAX(id), 10) FROM students), true);

-- 3. Insert Attendance Records (Multiple past dates to generate realistic % and alerts)
INSERT INTO attendance (student_id, subject_id, date, status, marked_by, remarks)
VALUES 
(1, 1, '2026-03-02', 'Present', 1, 'On time'),
(1, 1, '2026-03-04', 'Present', 1, 'On time'),
(1, 1, '2026-03-09', 'Present', 1, 'On time'),
(1, 1, '2026-03-11', 'Present', 1, 'Active participation'),
(1, 2, '2026-03-03', 'Present', 2, 'Lab practical done'),
(1, 2, '2026-03-05', 'Present', 2, 'On time'),
(1, 2, '2026-03-10', 'Present', 2, 'On time'),

(2, 1, '2026-03-02', 'Present', 1, 'On time'),
(2, 1, '2026-03-04', 'Present', 1, 'On time'),
(2, 1, '2026-03-09', 'Present', 1, 'On time'),
(2, 1, '2026-03-11', 'Absent', 1, 'Medical leave'),
(2, 2, '2026-03-03', 'Present', 2, 'On time'),
(2, 2, '2026-03-05', 'Present', 2, 'On time'),

-- Student 3: Low attendance (<75% to showcase low attendance warning badge!)
(3, 1, '2026-03-02', 'Absent', 1, 'Unexcused absence'),
(3, 1, '2026-03-04', 'Absent', 1, 'Unexcused absence'),
(3, 1, '2026-03-09', 'Present', 1, 'On time'),
(3, 1, '2026-03-11', 'Absent', 1, 'Late unexcused'),
(3, 2, '2026-03-03', 'Absent', 2, 'Unexcused'),
(3, 2, '2026-03-05', 'Present', 2, 'On time'),

(4, 1, '2026-03-02', 'Present', 1, 'On time'),
(4, 1, '2026-03-04', 'Present', 1, 'On time'),
(4, 1, '2026-03-09', 'Present', 1, 'On time'),
(4, 1, '2026-03-11', 'Present', 1, 'On time'),
(4, 2, '2026-03-03', 'Present', 2, 'On time'),
(4, 2, '2026-03-05', 'Present', 2, 'On time'),

(5, 1, '2026-03-02', 'Present', 1, 'On time'),
(5, 1, '2026-03-04', 'Late', 1, 'Late by 10 mins'),
(5, 1, '2026-03-09', 'Present', 1, 'On time'),
(5, 1, '2026-03-11', 'Present', 1, 'On time'),
(5, 2, '2026-03-03', 'Present', 2, 'On time'),
(5, 2, '2026-03-05', 'Present', 2, 'On time'),

(6, 1, '2026-03-02', 'Present', 1, 'On time'),
(6, 1, '2026-03-04', 'Present', 1, 'On time'),
(6, 1, '2026-03-09', 'Present', 1, 'On time'),
(6, 1, '2026-03-11', 'Present', 1, 'On time'),
(6, 2, '2026-03-03', 'Present', 2, 'On time'),
(6, 2, '2026-03-05', 'Present', 2, 'On time')
ON CONFLICT (student_id, subject_id, date) DO NOTHING;

-- 4. Insert Timetable Slots (CSE Sem 4)
INSERT INTO timetables (department_id, program_id, semester, day_of_week, time_slot, subject_id, faculty_id, classroom)
VALUES 
(1, 1, 4, 'Monday', '09:00 - 10:00', 1, 1, 'Room A-301'),
(1, 1, 4, 'Monday', '10:00 - 11:00', 2, 2, 'Room A-301'),
(1, 1, 4, 'Monday', '11:15 - 12:15', 3, 3, 'Room A-301'),
(1, 1, 4, 'Monday', '13:00 - 15:00', 4, 4, 'Computer Lab 3'),

(1, 1, 4, 'Tuesday', '09:00 - 10:00', 2, 2, 'Room A-301'),
(1, 1, 4, 'Tuesday', '10:00 - 11:00', 1, 1, 'Room A-301'),
(1, 1, 4, 'Tuesday', '11:15 - 12:15', 3, 3, 'Room A-301'),

(1, 1, 4, 'Wednesday', '09:00 - 10:00', 1, 1, 'Room A-301'),
(1, 1, 4, 'Wednesday', '10:00 - 11:00', 3, 3, 'Room A-301'),
(1, 1, 4, 'Wednesday', '11:15 - 12:15', 2, 2, 'Room A-301'),

(1, 1, 4, 'Thursday', '09:00 - 10:00', 3, 3, 'Room A-301'),
(1, 1, 4, 'Thursday', '10:00 - 11:00', 2, 2, 'Room A-301'),
(1, 1, 4, 'Thursday', '11:15 - 12:15', 1, 1, 'Room A-301'),

(1, 1, 4, 'Friday', '09:00 - 11:00', 4, 4, 'Computer Lab 3'),
(1, 1, 4, 'Friday', '11:15 - 12:15', 2, 2, 'Room A-301'),
(1, 1, 4, 'Friday', '12:15 - 13:15', 1, 1, 'Room A-301')
ON CONFLICT DO NOTHING;

-- 5. Insert Notices & Announcements
INSERT INTO notices (id, title, category, target_role, department_id, content, publish_date, priority, posted_by)
VALUES 
(1, 'Mid-Semester Theory & Practical Examination Schedule 2026', 'Examination', 'All', NULL, 'The Mid-Semester examinations for all undergraduate and postgraduate engineering courses will commence from 24th March 2026. Detailed room-wise and subject-wise seating plans have been published on the student portal.', '2026-03-01', 'High', 'Academic Office - LJ University'),
(2, 'LJ University Annual National Tech Fest "INNOVATE 2026"', 'Event', 'All', NULL, 'All students and faculty are cordially invited to participate in INNOVATE 2026 on 10-12 April 2026. Events include Hackathons, Code Golf, Robotics Wars, and Paper Presentations with total prizes worth 5 Lakhs.', '2026-03-05', 'Normal', 'Dean of Students Affairs'),
(3, 'Mandatory 75% Minimum Attendance Requirement Notice', 'Academic', 'Student', NULL, 'As per statutory academic regulations, students with less than 75% overall attendance across subjects will not be permitted to register for the final end-semester examinations without Dean approval.', '2026-03-08', 'Urgent', 'Office of Registrar'),
(4, 'CSE Department: Hands-on Workshop on Generative AI & LLMs', 'Academic', 'All', 1, 'Department of Computer Science & Engineering is organizing a 2-day intensive technical workshop on fine-tuning Open-Source LLMs and building agentic RAG architectures using modern GPUs in Lab A-402.', '2026-03-10', 'Normal', 'Dr. Rajesh Sharma (HOD CSE)'),
(5, 'Holiday Notice: University Campus Closed for Holi Festival', 'Holiday', 'All', NULL, 'The University offices, academic departments, and library will remain closed on 25th March 2026 on account of Holi festival celebrations.', '2026-03-12', 'Normal', 'Administrative Office')
ON CONFLICT DO NOTHING;

SELECT setval('notices_id_seq', (SELECT COALESCE(MAX(id), 5) FROM notices), true);

-- 6. Insert Examinations
INSERT INTO exams (id, exam_name, subject_id, exam_date, time_slot, classroom, max_marks, passing_marks, status)
VALUES 
(1, 'Mid-Semester Exam: Data Structures & Algorithms', 1, '2026-03-24', '10:00 - 12:00', 'Hall A-1', 50, 20, 'Completed'),
(2, 'Mid-Semester Exam: Database Management Systems', 2, '2026-03-26', '10:00 - 12:00', 'Hall A-1', 50, 20, 'Completed'),
(3, 'Mid-Semester Exam: Computer Networks & Security', 3, '2026-03-28', '10:00 - 12:00', 'Hall A-1', 50, 20, 'Completed'),
(4, 'Practical Evaluation: Web Development Lab', 4, '2026-04-02', '14:00 - 17:00', 'Lab 3', 50, 25, 'Scheduled')
ON CONFLICT DO NOTHING;

SELECT setval('exams_id_seq', (SELECT COALESCE(MAX(id), 4) FROM exams), true);

-- 7. Insert Examination Results
INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade, remarks)
VALUES 
(1, 1, 46.5, 'A+', 'Outstanding performance in trees and graph traversals'),
(1, 2, 43.0, 'A', 'Very good grasp of dynamic programming'),
(1, 3, 28.5, 'C', 'Needs improvement in algorithmic complexity analysis'),
(1, 4, 48.0, 'A+', 'Top scorer in batch'),
(1, 5, 38.0, 'B+', 'Good effort'),
(1, 6, 41.5, 'A', 'Strong theoretical foundation'),

(2, 1, 45.0, 'A+', 'Excellent SQL and schema normalization'),
(2, 2, 44.0, 'A', 'Very good concurrency and ACID explanations'),
(2, 3, 31.0, 'B', 'Satisfactory query optimization'),
(2, 4, 47.0, 'A+', 'Exceptional practical database concepts'),
(2, 5, 36.5, 'B+', 'Good understanding of transactions'),
(2, 6, 42.0, 'A', 'Clear relational algebra execution'),

(3, 1, 44.0, 'A', 'Good subnetting and protocol traces'),
(3, 2, 41.0, 'A', 'Clear cryptography concepts'),
(3, 3, 25.0, 'C', 'Needs revision on TCP congestion window'),
(3, 4, 46.5, 'A+', 'Solid understanding of transport layers'),
(3, 5, 35.0, 'B', 'Average performance'),
(3, 6, 40.0, 'A', 'Good network security design')
ON CONFLICT (exam_id, student_id) DO NOTHING;

-- 8. Insert Assignments
INSERT INTO assignments (id, title, subject_id, department_id, semester, description, due_date, max_marks, created_by)
VALUES 
(1, 'Assignment 1: Complex SQL Queries & Indexing Optimization', 2, 1, 4, 'Write parameterized SQL queries for a multi-tenant university portal, analyze EXPLAIN ANALYZE execution trees, and build B-Tree and Hash indexes to reduce execution cost.', '2026-03-30', 30, 2),
(2, 'Assignment 2: Graph Theory & Shortest Path Implementations', 1, 1, 4, 'Implement Dijkstra and Bellman-Ford shortest path algorithms in C++/Python with cycle detection and benchmark against sparse graphs.', '2026-04-05', 40, 1),
(3, 'Assignment 3: Full-Stack React Component Architecture', 4, 1, 4, 'Design responsive glassmorphism dashboard cards with React 19 hooks, client-side sorting, pagination, and live REST API data binding.', '2026-04-10', 50, 4)
ON CONFLICT DO NOTHING;

SELECT setval('assignments_id_seq', (SELECT COALESCE(MAX(id), 3) FROM assignments), true);

-- 9. Insert Assignment Submissions
INSERT INTO assignment_submissions (assignment_id, student_id, submission_content, status, marks_obtained, feedback)
VALUES 
(1, 1, 'GitHub repo: github.com/aarav-lju/dbms-assignment1 - All 10 queries optimized with composite indexes. Average execution time reduced from 42ms to 2.1ms.', 'Graded', 29.5, 'Flawless indexing strategy and query explain plan writeup.'),
(1, 2, 'GitHub repo: github.com/diya-lju/dbms-queries - Includes SQL scripts, EXPLAIN plans, and benchmark comparison charts.', 'Graded', 28.0, 'Very thorough documentation and clean index naming.'),
(1, 3, 'Submitted SQL query file with explanations for foreign keys and join conditions.', 'Graded', 21.0, 'Execution plan could have leveraged index-only scans.')
ON CONFLICT (assignment_id, student_id) DO NOTHING;
`;

const { runSeed } = require('./seed');

async function runDmsMigration() {
  await runSeed();
}

if (require.main === module) {
  runDmsMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ DMS migration error:', err.message);
      process.exit(1);
    });
}

module.exports = { runDmsMigration };

