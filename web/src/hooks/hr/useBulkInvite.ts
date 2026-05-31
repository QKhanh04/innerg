import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { invitationsApi } from '../../api/invitationsApi';
import type { ValidateFileResult, BulkInviteItem } from '../../types/invitation.types';

type BulkStep = 'upload' | 'preview' | 'result';

export function useBulkInvite() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<BulkStep>('upload');
  const [validateResult, setValidateResult] = useState<ValidateFileResult | null>(null);
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number; errors: any[] } | null>(null);

  const validateMutation = useMutation({
    mutationFn: (file: File) => invitationsApi.validateFile(file),
    onSuccess: (data) => {
      setValidateResult(data);
      setStep('preview');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'File validation error';
      toast.error(msg);
    },
  });

  const bulkSendMutation = useMutation({
    mutationFn: (invites: BulkInviteItem[]) => invitationsApi.bulkSend(invites),
    onSuccess: (data) => {
      setBulkResult({
        sent: data.successCount ?? 0,
        failed: data.errorCount ?? 0,
        errors: data.errors ?? [],
      });
      setStep('result');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Bulk send failed';
      toast.error(msg);
    },
  });

  const reset = () => {
    setStep('upload');
    setValidateResult(null);
    setBulkResult(null);
  };

  return {
    step,
    validateResult,
    bulkResult,
    validateMutation,
    bulkSendMutation,
    reset,
  };
}
