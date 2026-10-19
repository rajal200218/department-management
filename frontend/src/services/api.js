const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Retrieve current user and token from localStorage
  const token = localStorage.getItem('nuv_token');
  let user = null;
  try {
    const savedUser = localStorage.getItem('nuv_user');
    if (savedUser) user = JSON.parse(savedUser);
  } catch (e) {
    user = null;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(user ? {
      'X-User-Role': user.role || 'faculty',
      'X-User-Dept': user.department_id ? String(user.department_id) : '',
      'X-User-Email': user.email || '',
      'X-User-Id': user.id ? String(user.id) : ''
    } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && endpoint !== '/auth/login') {
        // Clear invalid/expired session
        localStorage.removeItem('nuv_token');
        localStorage.removeItem('nuv_user');
        window.dispatchEvent(new CustomEvent('nuv_auth_expired', { detail: data.message || 'Session expired' }));
      }
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  getProfile: () => request('/auth/profile'),
  verifySession: () => request('/auth/verify'),
  changePassword: (data) => request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  resetPassword: (data) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  forgotPassword: (email) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  verifyResetOtp: (email, otpCode) => request('/auth/verify-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otpCode })
  }),
  resetPasswordWithOtp: (data) => request('/auth/reset-password-with-otp', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Dashboard & SQL query logs
  getDashboardStats: (session = null) => {
    const query = session ? `?session=${encodeURIComponent(session)}` : '';
    return request(`/dashboard/stats${query}`);
  },
  getQueryLogs: () => request('/dashboard/logs'),

  // Academic Sessions API (PostgreSQL backed)
  getSessions: () => request('/sessions'),
  createSession: (data) => request('/sessions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  setActiveSession: (id) => request(`/sessions/${id}/set-active`, {
    method: 'PUT'
  }),

  // Departments CRUD
  getDepartments: (params = {}) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(k => {
      if (cleanParams[k] === null || cleanParams[k] === undefined || cleanParams[k] === '') {
        delete cleanParams[k];
      }
    });
    const queryStr = new URLSearchParams(cleanParams).toString();
    return request(`/departments${queryStr ? `?${queryStr}` : ''}`);
  },
  getDepartmentById: (id, session = null) => {
    const query = session ? `?session=${encodeURIComponent(session)}` : '';
    return request(`/departments/${id}${query}`);
  },
  createDepartment: (data) => request('/departments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateDepartment: (id, data) => request(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteDepartment: (id) => request(`/departments/${id}`, {
    method: 'DELETE'
  }),
  assignHod: (id, hodId) => request(`/departments/${id}/assign-hod`, {
    method: 'POST',
    body: JSON.stringify({ hod_id: hodId })
  }),

  // Schools CRUD
  getSchools: () => request('/schools'),
  getSchoolById: (id) => request(`/schools/${id}`),
  createSchool: (data) => request('/schools', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateSchool: (id, data) => request(`/schools/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteSchool: (id) => request(`/schools/${id}`, {
    method: 'DELETE'
  }),

  // Faculty CRUD
  getFaculty: (departmentId = null, session = null) => {
    const params = {};
    if (departmentId) params.department_id = departmentId;
    if (session) params.session = session;
    const queryStr = new URLSearchParams(params).toString();
    return request(`/faculty${queryStr ? `?${queryStr}` : ''}`);
  },
  getFacultyById: (id) => request(`/faculty/${id}`),
  createFaculty: (data) => request('/faculty', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateFaculty: (id, data) => request(`/faculty/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteFaculty: (id) => request(`/faculty/${id}`, {
    method: 'DELETE'
  }),

  // Programs CRUD
  getPrograms: (departmentId = null, session = null) => {
    const params = {};
    if (departmentId) params.department_id = departmentId;
    if (session) params.session = session;
    const queryStr = new URLSearchParams(params).toString();
    return request(`/programs${queryStr ? `?${queryStr}` : ''}`);
  },
  getProgramById: (id) => request(`/programs/${id}`),
  createProgram: (data) => request('/programs', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateProgram: (id, data) => request(`/programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteProgram: (id) => request(`/programs/${id}`, {
    method: 'DELETE'
  }),

  // Students CRUD & Academic Profile
  getStudents: (params = {}) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(k => {
      if (cleanParams[k] === null || cleanParams[k] === undefined || cleanParams[k] === '') {
        delete cleanParams[k];
      }
    });
    const queryStr = new URLSearchParams(cleanParams).toString();
    return request(`/students${queryStr ? `?${queryStr}` : ''}`);
  },
  getStudentById: (id) => request(`/students/${id}`),
  createStudent: (data) => request('/students', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateStudent: (id, data) => request(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteStudent: (id) => request(`/students/${id}`, {
    method: 'DELETE'
  }),

  // Subjects & Courses CRUD
  getSubjects: (params = {}) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(k => {
      if (cleanParams[k] === null || cleanParams[k] === undefined || cleanParams[k] === '') {
        delete cleanParams[k];
      }
    });
    const queryStr = new URLSearchParams(cleanParams).toString();
    return request(`/subjects${queryStr ? `?${queryStr}` : ''}`);
  },
  getSubjectById: (id) => request(`/subjects/${id}`),
  createSubject: (data) => request('/subjects', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateSubject: (id, data) => request(`/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteSubject: (id) => request(`/subjects/${id}`, {
    method: 'DELETE'
  }),

  // Attendance Management
  getAttendance: (params = {}) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(k => {
      if (cleanParams[k] === null || cleanParams[k] === undefined || cleanParams[k] === '') {
        delete cleanParams[k];
      }
    });
    const queryStr = new URLSearchParams(cleanParams).toString();
    return request(`/attendance${queryStr ? `?${queryStr}` : ''}`);
  },
  markAttendance: (data) => request('/attendance/mark', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getAttendanceReport: (params = {}) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(k => {
      if (cleanParams[k] === null || cleanParams[k] === undefined || cleanParams[k] === '') {
        delete cleanParams[k];
      }
    });
    const queryStr = new URLSearchParams(cleanParams).toString();
    return request(`/attendance/report${queryStr ? `?${queryStr}` : ''}`);
  },

  // Timetables Management
  getTimetables: (params = {}) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(k => {
      if (cleanParams[k] === null || cleanParams[k] === undefined || cleanParams[k] === '') {
        delete cleanParams[k];
      }
    });
    const queryStr = new URLSearchParams(cleanParams).toString();
    return request(`/timetables${queryStr ? `?${queryStr}` : ''}`);
  },
  createTimetable: (data) => request('/timetables', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateTimetable: (id, data) => request(`/timetables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteTimetable: (id) => request(`/timetables/${id}`, {
    method: 'DELETE'
  }),

  // Notices & Announcements
  getNotices: (params = {}) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(k => {
      if (cleanParams[k] === null || cleanParams[k] === undefined || cleanParams[k] === '') {
        delete cleanParams[k];
      }
    });
    const queryStr = new URLSearchParams(cleanParams).toString();
    return request(`/notices${queryStr ? `?${queryStr}` : ''}`);
  },
  createNotice: (data) => request('/notices', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateNotice: (id, data) => request(`/notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteNotice: (id) => request(`/notices/${id}`, {
    method: 'DELETE'
  }),

  // Examinations & Results
  getExams: (params = {}) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(k => {
      if (cleanParams[k] === null || cleanParams[k] === undefined || cleanParams[k] === '') {
        delete cleanParams[k];
      }
    });
    const queryStr = new URLSearchParams(cleanParams).toString();
    return request(`/exams${queryStr ? `?${queryStr}` : ''}`);
  },
  getExamById: (id) => request(`/exams/${id}`),
  createExam: (data) => request('/exams', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateExam: (id, data) => request(`/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteExam: (id) => request(`/exams/${id}`, {
    method: 'DELETE'
  }),
  saveExamResults: (examId, data) => request(`/exams/${examId}/results`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMyExamResults: () => request('/exams/student/my-results'),

  // Assignments & Submissions
  getAssignments: (params = {}) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(k => {
      if (cleanParams[k] === null || cleanParams[k] === undefined || cleanParams[k] === '') {
        delete cleanParams[k];
      }
    });
    const queryStr = new URLSearchParams(cleanParams).toString();
    return request(`/assignments${queryStr ? `?${queryStr}` : ''}`);
  },
  getAssignmentById: (id) => request(`/assignments/${id}`),
  createAssignment: (data) => request('/assignments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateAssignment: (id, data) => request(`/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteAssignment: (id) => request(`/assignments/${id}`, {
    method: 'DELETE'
  }),
  submitAssignment: (id, data) => request(`/assignments/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  gradeSubmission: (submissionId, data) => request(`/assignments/submissions/${submissionId}/grade`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
