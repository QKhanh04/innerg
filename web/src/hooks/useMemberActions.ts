import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/memberApi';
import toast from 'react-hot-toast';

const ERROR_MESSAGES = {
  CANNOT_MODIFY_SELF: 'Cannot perform action on your own account.',
  CANNOT_MODIFY_ADMIN: 'Cannot modify Admin account.',
  USER_NOT_ACTIVE: 'Account must be active.',
  USER_ALREADY_HAS_MENTOR_ROLE: 'This employee is already a Mentor.',
  MENTOR_HAS_UPCOMING_CLASSES: 'Cannot revoke, there are upcoming classes.',
  USER_NOT_FOUND: 'Employee not found.',
};

const handleMutationError = (error: any) => {
  const code = error.response?.data?.error?.code as keyof typeof ERROR_MESSAGES;
  const message = ERROR_MESSAGES[code] || error.response?.data?.error?.message || 'An error occurred, please try again.';
  toast.error(message);
};

export const useMemberActions = () => {
  const queryClient = useQueryClient();

  const handleSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['members'] });
  };

  const updateMutation = useMutation<void, any, { userId: string; data: any }>({
    mutationFn: ({ userId, data }) => membersApi.update(userId, data),
    onSuccess: () => handleSuccess('Member updated successfully.'),
    onError: handleMutationError
  });

  const assignMentorMutation = useMutation<void, any, string>({
    mutationFn: (userId) => membersApi.assignMentor(userId),
    onSuccess: () => handleSuccess('Mentor role assigned successfully.'),
    onError: handleMutationError
  });

  const revokeMentorMutation = useMutation<void, any, string>({
    mutationFn: (userId) => membersApi.revokeMentor(userId),
    onSuccess: () => handleSuccess('Mentor role revoked successfully.'),
    onError: handleMutationError
  });

  const updateStatusMutation = useMutation<void, any, { userId: string; status: string }>({
    mutationFn: ({ userId, status }) => membersApi.updateStatus(userId, status),
    onSuccess: () => handleSuccess('Status updated successfully.'),
    onError: handleMutationError
  });

  const deleteMutation = useMutation<void, any, string>({
    mutationFn: (userId) => membersApi.delete(userId),
    onSuccess: () => handleSuccess('Member deleted successfully.'),
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
