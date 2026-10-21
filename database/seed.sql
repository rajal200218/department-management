-- =========================================================================
-- LJ UNIVERSITY ERP - SEED DATA SCRIPT
-- Realistic Academic Sample Data for LJ University
-- =========================================================================

-- 1. Insert Default Admin User (Password: admin123)
INSERT INTO users (name, email, password, role, avatar_url)
VALUES 
('System Admin', 'admin@ljku.edu.in', 'admin123', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('Dean Academic', 'dean.academic@ljku.edu.in', 'admin123', 'dean', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');

-- 2. Insert Academic Sessions (PostgreSQL Source of Truth)
INSERT INTO academic_sessions (id, session_name, term, start_date, end_date, status, is_current)
VALUES 
(1, '2024–2025', 'Academic Year (Completed)', '2024-07-01', '2025-06-30', 'Archived', FALSE),
(2, '2025–2026', 'Academic Year (Completed)', '2025-07-01', '2026-06-30', 'Archived', FALSE),
(3, '2026–2027', 'Fall & Spring (Full Year / Odd + Even)', '2026-07-01', '2027-06-30', 'Active', TRUE),
(4, '2027–2028', 'Academic Planning Phase', '2027-07-01', '2028-06-30', 'Upcoming', FALSE);

SELECT setval('academic_sessions_id_seq', 4, true);

-- 3. Insert Schools / Institutes under LJ University
INSERT INTO schools (school_name, school_code, dean_name, contact_email, contact_phone, building, status)
VALUES 
('School of Engineering & Technology (SET)', 'LJU-SET', 'Dr. Rajesh Sharma', 'dean.set@ljku.edu.in', '+91 79 2970 0001', 'Engineering Block A', 'Active'),
('School of Business & Law (SBL)', 'LJU-SBL', 'Dr. Anita Desai', 'dean.sbl@ljku.edu.in', '+91 79 2970 0002', 'Management Tower B', 'Active'),
('School of Science & Education (SSE)', 'LJU-SSE', 'Dr. Manish Trivedi', 'dean.sse@ljku.edu.in', '+91 79 2970 0003', 'Science Complex C', 'Active'),
('School of Environmental Design & Architecture (SEDA)', 'LJU-SEDA', 'Dr. Sneha Varma', 'dean.seda@ljku.edu.in', '+91 79 2970 0004', 'Architecture Wing D', 'Active'),
('School of Liberal Arts & Sciences', 'LJU-SLAS', 'Dr. Kirit Patel', 'dean.slas@ljku.edu.in', '+91 79 2970 0005', 'Humanities Block E', 'Active');

-- 4. Insert Departments
INSERT INTO departments (id, department_name, department_code, school_id, email, phone, established_year, faculty_count, building, room_no, description, status)
VALUES 
(1, 'Computer Science & Engineering', 'CSE', 1, 'hod.cse@ljku.edu.in', '+91 98765 43210', 2012, 5, 'Engineering Block A', 'Room A-301 (3rd Floor)', 'Focuses on cutting-edge computer engineering, system architecture, artificial intelligence, software engineering, and high-performance computing at LJ University.', 'Active'),
(2, 'Information Technology', 'IT', 1, 'hod.it@ljku.edu.in', '+91 98765 43211', 2014, 2, 'Engineering Block A', 'Room A-204 (2nd Floor)', 'Dedicated to modern cloud architectures, network security, web technologies, and enterprise data management systems.', 'Active'),
(3, 'Artificial Intelligence & Machine Learning', 'AIML', 1, 'hod.aiml@ljku.edu.in', '+91 98765 43212', 2021, 3, 'Engineering Block A', 'Room A-402 (4th Floor)', 'Specialized research and curriculum in Deep Learning, Computer Vision, Natural Language Processing, and Autonomous Robotics.', 'Active'),
(4, 'Electronics & Communication Engineering', 'ECE', 1, 'hod.ece@ljku.edu.in', '+91 98765 43213', 2010, 1, 'Engineering Block A', 'Room A-105 (1st Floor)', 'Pioneering studies in VLSI design, Embedded IoT devices, Telecommunications, and Signal Processing.', 'Active'),
(5, 'Mechanical Engineering', 'MECH', 1, 'hod.mech@ljku.edu.in', '+91 98765 43214', 2011, 1, 'Engineering Workshop Block', 'Room W-101', 'Focusing on Thermal Sciences, Advanced Manufacturing, CAD/CAM design, and Mechatronics automation.', 'Active'),
(6, 'Civil Engineering', 'CIVIL', 1, 'hod.civil@ljku.edu.in', '+91 98765 43215', 2012, 1, 'Engineering Block B', 'Room B-102', 'Specializing in Structural Engineering, Geo-technical analysis, Smart Cities planning, and Transportation Systems.', 'Active'),
(7, 'Master of Computer Applications', 'MCA', 1, 'hod.mca@ljku.edu.in', '+91 98765 43216', 2013, 1, 'Engineering Block A', 'Room A-101', 'Comprehensive postgraduate training in Full-Stack software engineering, enterprise cloud solutions, and mobile app design.', 'Active'),
(8, 'Master of Business Administration', 'MBA', 2, 'hod.mba@ljku.edu.in', '+91 98765 43217', 2011, 1, 'Management Tower B', 'Room M-201', 'Premier business program in Finance, Marketing, Human Resources, and Entrepreneurship & Innovation.', 'Active'),
(9, 'Bachelor of Business Administration', 'BBA', 2, 'hod.bba@ljku.edu.in', '+91 98765 43218', 2015, 1, 'Management Tower B', 'Room M-105', 'Undergraduate foundation in business management, marketing analytics, business communication, and commerce.', 'Active'),
(10, 'Environmental Design & Architecture', 'ARCH', 4, 'hod.arch@ljku.edu.in', '+91 98765 43219', 2014, 1, 'Architecture Wing D', 'Room D-203', 'Research-driven department in sustainable architecture, urban planning, and structural aesthetics.', 'Active'),
(11, 'Mathematics & Data Science', 'MATH', 3, 'hod.math@ljku.edu.in', '+91 98765 43220', 2013, 1, 'Science Complex C', 'Room C-304', 'Provides foundational and applied mathematical modeling, statistical computing, and predictive data analysis.', 'Active'),
(12, 'Robotics & Automation (Proposed)', 'ROBO', 1, 'info.robo@ljku.edu.in', '+91 98765 43221', 2026, 0, 'Engineering Block A', 'Room A-501', 'Upcoming specialized department focusing on industrial robotics, autonomous navigation, and mechatronics.', 'Inactive');

SELECT setval('departments_id_seq', 12, true);

-- 5. Insert Faculty Members
INSERT INTO faculty (id, department_id, name, email, phone, designation, qualification, specialization, joining_date, experience_years, status)
VALUES 
(1, 1, 'Dr. Amit Patel', 'amit.patel@ljku.edu.in', '+91 98250 11223', 'HOD & Professor', 'Ph.D. in Computer Science (IIT Bombay)', 'Distributed Systems, Cloud & AI', '2015-06-15', 16, 'Active'),
(2, 1, 'Prof. Neha Shah', 'neha.shah@ljku.edu.in', '+91 98250 11224', 'Associate Professor', 'M.Tech in CSE (NIT Surat)', 'Data Structures, Machine Learning', '2017-07-01', 9, 'Active'),
(3, 1, 'Prof. Rahul Mehta', 'rahul.mehta@ljku.edu.in', '+91 98250 11225', 'Assistant Professor', 'M.E. in Software Engineering', 'Web Technologies, DevOps, Cloud', '2019-01-10', 6, 'Active'),
(4, 1, 'Prof. Priya Joshi', 'priya.joshi@ljku.edu.in', '+91 98250 11226', 'Assistant Professor', 'M.Tech in Cyber Security', 'Network Security & Cryptography', '2020-08-14', 5, 'Active'),
(5, 1, 'Prof. Tanvi Trivedi', 'tanvi.trivedi@ljku.edu.in', '+91 98250 11227', 'Assistant Professor', 'M.Tech in AI & Data Science', 'Applied Machine Learning', '2025-08-01', 3, 'Active'),

(6, 2, 'Dr. Sanjay Solanki', 'sanjay.solanki@ljku.edu.in', '+91 98250 22331', 'HOD & Professor', 'Ph.D. in Information Technology', 'Big Data Analytics & Cloud Systems', '2016-04-12', 15, 'Active'),
(7, 2, 'Prof. Anjali Dave', 'anjali.dave@ljku.edu.in', '+91 98250 22332', 'Associate Professor', 'M.Tech in IT', 'Database Architecture, IoT', '2018-02-20', 8, 'Active'),

(8, 3, 'Dr. Hardik Raval', 'hardik.raval@ljku.edu.in', '+91 98250 33441', 'HOD & Associate Professor', 'Ph.D. in AI & Robotics', 'Deep Learning, LLMs, Computer Vision', '2021-06-01', 11, 'Active'),
(9, 3, 'Prof. Shruti Dave', 'shruti.dave@ljku.edu.in', '+91 98250 33442', 'Assistant Professor', 'M.Tech in Artificial Intelligence', 'Natural Language Processing', '2022-03-15', 4, 'Active'),
(10, 3, 'Prof. Mihir Shah', 'mihir.shah@ljku.edu.in', '+91 98250 33443', 'Assistant Professor', 'M.Tech in Autonomous Systems', 'Robotics & Computer Vision', '2026-07-15', 2, 'Active'),

(11, 4, 'Dr. Ketan Parekh', 'ketan.parekh@ljku.edu.in', '+91 98250 44551', 'HOD & Professor', 'Ph.D. in VLSI Design', 'Microprocessors, Embedded Systems', '2012-08-01', 18, 'Active'),
(12, 5, 'Dr. Rajesh Trivedi', 'rajesh.trivedi@ljku.edu.in', '+91 98250 55661', 'HOD & Professor', 'Ph.D. in Thermal Engineering', 'Thermodynamics & Renewable Energy', '2010-01-15', 20, 'Active'),
(13, 6, 'Dr. Bhavesh Bhatt', 'bhavesh.bhatt@ljku.edu.in', '+91 98250 66771', 'HOD & Professor', 'Ph.D. in Structural Engineering', 'Earthquake Engineering, Concrete Tech', '2011-09-01', 17, 'Active'),
(14, 7, 'Dr. Manish Trivedi', 'manish.trivedi@ljku.edu.in', '+91 98250 77881', 'HOD & Professor', 'Ph.D. in Computer Applications', 'Software Engineering & Enterprise Dev', '2013-05-10', 19, 'Active'),
(15, 8, 'Dr. Anita Desai', 'anita.desai@ljku.edu.in', '+91 98250 88991', 'HOD & Professor', 'Ph.D. in Finance & Economics (IIM)', 'Strategic Management, Corporate Finance', '2011-07-20', 22, 'Active'),
(16, 9, 'Prof. Chirag Patel', 'chirag.patel@ljku.edu.in', '+91 98250 99001', 'HOD & Associate Professor', 'MBA (Marketing), Ph.D. Scholar', 'Marketing Analytics, Consumer Behavior', '2016-11-01', 10, 'Active'),
(17, 10, 'Dr. Sneha Varma', 'sneha.varma@ljku.edu.in', '+91 98250 10101', 'HOD & Professor', 'Ph.D. in Architecture & Urban Design', 'Sustainable Architecture, Smart Cities', '2016-09-15', 14, 'Active'),
(18, 11, 'Dr. Kirit Patel', 'kirit.patel@ljku.edu.in', '+91 98250 11111', 'HOD & Associate Professor', 'Ph.D. in Applied Mathematics', 'Optimization Techniques, Numerical Methods', '2014-03-01', 13, 'Active');

SELECT setval('faculty_id_seq', 18, true);

-- 6. Assign HOD foreign keys to departments
UPDATE departments SET hod_id = 1 WHERE id = 1;
UPDATE departments SET hod_id = 6 WHERE id = 2;
UPDATE departments SET hod_id = 8 WHERE id = 3;
UPDATE departments SET hod_id = 11 WHERE id = 4;
UPDATE departments SET hod_id = 12 WHERE id = 5;
UPDATE departments SET hod_id = 13 WHERE id = 6;
UPDATE departments SET hod_id = 14 WHERE id = 7;
UPDATE departments SET hod_id = 15 WHERE id = 8;
UPDATE departments SET hod_id = 16 WHERE id = 9;
UPDATE departments SET hod_id = 17 WHERE id = 10;
UPDATE departments SET hod_id = 18 WHERE id = 11;

-- 7. Insert Academic Programs
INSERT INTO programs (department_id, program_name, program_code, degree_level, intake_capacity, duration_years, status)
VALUES 
(1, 'Bachelor of Technology in Computer Science & Engineering', 'BTECH-CSE', 'Undergraduate (B.Tech)', 180, 4, 'Active'),
(1, 'Master of Technology in Computer Science', 'MTECH-CSE', 'Postgraduate (M.Tech)', 30, 2, 'Active'),
(1, 'Ph.D. in Computer Science', 'PHD-CSE', 'Doctorate (Ph.D)', 10, 3, 'Active'),
(2, 'Bachelor of Technology in Information Technology', 'BTECH-IT', 'Undergraduate (B.Tech)', 120, 4, 'Active'),
(3, 'B.Tech in Artificial Intelligence & Data Science', 'BTECH-AIDS', 'Undergraduate (B.Tech)', 60, 4, 'Active'),
(7, 'Master of Computer Applications (2-Year)', 'MCA-REG', 'Postgraduate (MCA)', 120, 2, 'Active'),
(7, 'Bachelor of Computer Applications', 'BCA-REG', 'Undergraduate (BCA)', 180, 3, 'Active'),
(8, 'Master of Business Administration (Core)', 'MBA-CORE', 'Postgraduate (MBA)', 240, 2, 'Active'),
(9, 'Bachelor of Business Administration', 'BBA-HONS', 'Undergraduate (BBA)', 180, 3, 'Active'),
(10, 'Bachelor of Architecture (B.Arch)', 'BARCH', 'Undergraduate (B.Arch)', 80, 5, 'Active');
