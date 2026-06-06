import api from './axios';

export const mentorApi = {
  // Lấy thống kê tổng quan
  getDashboardStats: async () => {
    const response = await api.get('/Mentor/dashboard/stats');
    return response.data;
  },

  // Lấy cấu hình lịch rảnh
  getAvailability: async () => {
    const response = await api.get('/Mentor/availability');
    return response.data;
  },

  // Cập nhật cấu hình lịch rảnh
  updateAvailability: async (weeklySchedule) => {
    const response = await api.put('/Mentor/availability', { weeklySchedule });
    return response.data;
  },

  // Lấy danh sách lớp học do Mentor phụ trách
  getHostedClasses: async () => {
    const response = await api.get('/Mentor/classes');
    return response.data;
  },

  // Lấy danh sách học viên đang chờ duyệt
  getPendingEnrollments: async () => {
    const response = await api.get('/Mentor/enrollments/pending');
    return response.data;
  },

  // Duyệt đơn đăng ký
  approveEnrollment: async (enrollmentId) => {
    const response = await api.post(`/Mentor/enrollments/${enrollmentId}/approve`);
    return response.data;
  },

  // Từ chối đơn đăng ký
  rejectEnrollment: async (enrollmentId) => {
    const response = await api.post(`/Mentor/enrollments/${enrollmentId}/reject`);
    return response.data;
  },

  // Lấy danh sách học viên của buổi học
  getEnrolledUsersForSession: async (eventId) => {
    const response = await api.get(`/Mentor/classes/${eventId}/enrolled-users`);
    return response.data;
  },

  // Gửi điểm danh (Roll Call)
  submitRollCall: async (eventId, attendedUserIds, note = "") => {
    const response = await api.post(`/Mentor/classes/${eventId}/roll-call`, {
      attendedUserIds,
      note
    });
    return response.data;
  },

  // Tạo lớp học mới
  createClass: async (classData) => {
    const response = await api.post('/Mentor/classes', classData);
    return response.data;
  },

  // Cập nhật lớp học
  updateClass: async (classId, classData) => {
    const response = await api.put(`/Mentor/classes/${classId}`, classData);
    return response.data;
  },

  // Hủy yêu cầu duyệt lớp
  cancelClass: async (classId) => {
    const response = await api.post(`/Mentor/classes/${classId}/cancel`);
    return response.data;
  }
};
