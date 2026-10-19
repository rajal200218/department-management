/**
 * Role-Based Access Control (RBAC) Permission Helpers
 */

export function normalizeRole(role) {
  if (!role) return 'faculty';
  const lower = role.toLowerCase().trim();
  if (lower === 'admin') return 'admin';
  if (lower === 'dean') return 'dean';
  if (lower.includes('hod') || lower === 'head of department') return 'hod';
  if (lower === 'student') return 'student';
  return 'faculty';
}

export function isAdmin(user) {
  return normalizeRole(user?.role) === 'admin';
}

export function isDean(user) {
  return normalizeRole(user?.role) === 'dean';
}

export function isHOD(user) {
  return normalizeRole(user?.role) === 'hod' || Boolean(user?.is_hod);
}

export function isFaculty(user) {
  const r = normalizeRole(user?.role);
  return r === 'faculty' && !isHOD(user);
}

export function isStudent(user) {
  return normalizeRole(user?.role) === 'student' || Boolean(user?.isStudent);
}

export function canAddDepartment(user) {
  return isAdmin(user);
}

export function canEditDepartment(user, deptId) {
  if (isAdmin(user)) return true;
  if (isHOD(user) && deptId && user?.department_id === parseInt(deptId, 10)) return true;
  return false;
}

export function canDeleteDepartment(user) {
  return isAdmin(user);
}

export function canAddFaculty(user, deptId = null) {
  if (isAdmin(user)) return true;
  if (isHOD(user)) {
    if (!deptId) return true;
    return user?.department_id === parseInt(deptId, 10);
  }
  return false;
}

export function canEditFaculty(user, faculty) {
  if (isAdmin(user)) return true;
  if (isHOD(user) && user?.department_id === faculty?.department_id) return true;
  if (user?.id && faculty?.id && user.id === faculty.id) return true;
  return false;
}

export function canDeleteFaculty(user, faculty) {
  if (isAdmin(user)) return true;
  if (isHOD(user) && user?.department_id === faculty?.department_id && !faculty?.is_current_hod) return true;
  return false;
}

export function canManageSchools(user) {
  return isAdmin(user);
}

export function canViewSchools(user) {
  return isAdmin(user) || isDean(user);
}

export function canAddProgram(user, deptId = null) {
  if (isAdmin(user)) return true;
  if (isHOD(user)) {
    if (!deptId) return true;
    return user?.department_id === parseInt(deptId, 10);
  }
  return false;
}

export function canEditProgram(user, prog) {
  if (isAdmin(user)) return true;
  if (isHOD(user) && user?.department_id === prog?.department_id) return true;
  return false;
}

export function canDeleteProgram(user, prog) {
  if (isAdmin(user)) return true;
  if (isHOD(user) && user?.department_id === prog?.department_id) return true;
  return false;
}

export function canManageStudents(user) {
  return isAdmin(user) || isDean(user) || isHOD(user);
}

export function canManageSubjects(user) {
  return isAdmin(user) || isDean(user) || isHOD(user);
}

export function canMarkAttendance(user) {
  return isAdmin(user) || isDean(user) || isHOD(user) || isFaculty(user);
}

export function canManageTimetables(user) {
  return isAdmin(user) || isDean(user) || isHOD(user);
}

export function canManageNotices(user) {
  return isAdmin(user) || isDean(user) || isHOD(user) || isFaculty(user);
}

export function canManageExams(user) {
  return isAdmin(user) || isDean(user) || isHOD(user) || isFaculty(user);
}

export function canManageAssignments(user) {
  return isAdmin(user) || isDean(user) || isHOD(user) || isFaculty(user);
}

export function canAccessLiveSql(user) {
  return isAdmin(user);
}

export function canSyncDb(user) {
  return isAdmin(user);
}
