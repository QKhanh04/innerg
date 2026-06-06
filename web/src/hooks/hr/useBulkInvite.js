import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastService } from '../../services/toastService';
import { invitationsApi } from '../../api/invitationsApi';

export function useBulkInvite() {
    const queryClient = useQueryClient();
    const [step, setStep] = useState('upload');
    const [validateResult, setValidateResult] = useState(null);
    const [bulkResult, setBulkResult] = useState(null);

    const validateMutation = useMutation({
        mutationFn: (file) => invitationsApi.validateFile(file),
        onSuccess: (data) => {
            setValidateResult(data);
            setStep('preview');
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'File validation error';
            toastService.error(msg);
        },
    });

    const bulkSendMutation = useMutation({
        mutationFn: (invites) => invitationsApi.bulkSend(invites),
        onSuccess: (data) => {
            setBulkResult({
                sent: data.successCount ?? 0,
                failed: data.errorCount ?? 0,
                errors: data.errors ?? [],
            });
            setStep('result');
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
        },
        onError: (err) => {
            const msg = err?.response?.data?.error?.message || 'Bulk send failed';
            toastService.error(msg);
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
