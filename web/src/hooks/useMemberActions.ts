import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/memberApi';
import toast from 'react-hot-toast';

const ERROR_MESSAGES = {
  CANNOT_MODIFY_SELF: 'Không thể thao tác trên tài khoản của chính bạn.',
  CANNOT_MODIFY_ADMIN: 'Không thể thay đổi tài khoản Admin.',
  USER_NOT_ACTIVE: 'Tài khoản phải đang hoạt động.',
  USER_ALREADY_HAS_MENTOR_ROLE: 'Nhân viên này đã là Mentor.',
  MENTOR_HAS_UPCOMING_CLASSES: 'Không thể thu hồi, còn lớp học sắp diễn ra.',
  USER_NOT_FOUND: 'Không tìm thấy nhân viên.',
};

const handleMutationError = (error) => {
  const code = error.response?.data?.error?.code;
  const message = ERROR_MESSAGES[code] || error.response?.data?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
  toast.error(message);
};

export const useMemberActions = () => {
  const queryClient = useQueryClient();

  const handleSuccess = (message) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['members'] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }) => membersApi.update(userId, data),
    onSuccess: () => handleSuccess('Cập nhật nhân viên thành công.'),
    onError: handleMutationError
  });

  const assignMentorMutation = useMutation({
    mutationFn: (userId) => membersApi.assignMentor(userId),
    onSuccess: () => handleSuccess('Gán role Mentor thành công.'),
    onError: handleMutationError
  });

  const revokeMentorMutation = useMutation({
    mutationFn: (userId) => membersApi.revokeMentor(userId),
    onSuccess: () => handleSuccess('Thu hồi role Mentor thành công.'),
    onError: handleMutationError
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }) => membersApi.updateStatus(userId, status),
    onSuccess: () => handleSuccess('Cập nhật trạng thái thành công.'),
    onError: handleMutationError
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => membersApi.delete(userId),
    onSuccess: () => handleSuccess('Xóa nhân viên thành công.'),
    onError: handleMutationError
  });

  return {
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    assignMentor: assignMentorMutation.mutate,
    isAssigningMentor: assignMentorMutation.isPending,
    revokeMentor: revokeMentorMutation.mutate,
    isRevokingMentor: revokeMentorMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    deleteMember: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
