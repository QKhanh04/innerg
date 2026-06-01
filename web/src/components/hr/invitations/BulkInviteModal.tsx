import React, { useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Send, FileSpreadsheet } from 'lucide-react';
import { useBulkInvite } from '../../../hooks/hr/useBulkInvite';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
}

export default function BulkInviteModal({ onClose }: Props) {
    const { step, validateResult, bulkResult, validateMutation, bulkSendMutation, reset } = useBulkInvite();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validExts = ['.csv', '.xlsx', '.xls'];
        const lowerName = file.name.toLowerCase();
        if (!validExts.some((ext) => lowerName.endsWith(ext))) {
            toast.error('Please select a .csv or .xlsx file');
            return;
        }

        validateMutation.mutate(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const submitValid = () => {
        if (!validateResult?.valid.length) return;
        const items = validateResult.valid.map((r) => ({
            email: r.email,
            roles: r.roles,
            fullName: r.fullName,
            departmentName: r.department,
            position: r.position,
        }));
        bulkSendMutation.mutate(items);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-xl font-extrabold text-[#0a192f]">
                        {step === 'upload' && 'Import from CSV / Excel'}
                        {step === 'preview' && 'Data Preview'}
                        {step === 'result' && 'Send Results'}
                    </h2>
                    <button onClick={handleClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto bg-slate-50/50">
                    {step === 'upload' && (
                        <div className="text-center py-10">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                onChange={handleFileChange}
                            />
                            <div
                                className="w-24 h-24 bg-[#13ecb6]/10 text-[#13ecb6] rounded-full mx-auto flex items-center justify-center mb-6 border-2 border-[#13ecb6]/30 border-dashed"
                            >
                                <Upload className="w-10 h-10" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Upload employee list file</h3>
                            <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                                Supports <b>.csv, .xlsx, .xls</b> formats. The file must contain header rows with columns: <code className="bg-white px-1.5 py-0.5 rounded border">email</code>, <code className="bg-white px-1.5 py-0.5 rounded border">role</code>, <code className="bg-white px-1.5 py-0.5 rounded border">fullname</code> (if any).
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={validateMutation.isPending}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#13ecb6] text-[#0a192f] font-bold rounded-xl shadow-sm shadow-[#13ecb6]/20 hover:brightness-105 transition-all disabled:opacity-50"
                            >
                                {validateMutation.isPending ? 'Checking...' : 'Upload File'}
                            </button>
                        </div>
                    )}

                    {step === 'preview' && validateResult && (
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 rounded-xl">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{validateResult.valid.length}</h4>
                                        <p className="text-slate-500 text-sm font-medium">Valid rows</p>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-red-50 rounded-xl">
                                        <AlertCircle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{validateResult.invalid.length}</h4>
                                        <p className="text-slate-500 text-sm font-medium">Invalid rows</p>
                                    </div>
                                </div>
                            </div>

                            {validateResult.invalid.length > 0 && (
                                <div className="bg-white rounded-2xl border border-red-100 overflow-hidden shadow-sm">
                                    <div className="bg-red-50 px-4 py-3 border-b border-red-100 font-bold text-red-700 flex justify-between items-center">
                                        <span>List of invalid rows</span>
                                        <span className="text-xs font-semibold bg-white px-2 py-1 rounded text-red-600 border border-red-200">Cannot import</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-4">
                                        <ul className="space-y-3">
                                            {validateResult.invalid.map((inv, idx) => (
                                                <li key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm p-3 bg-slate-50 rounded-xl border border-slate-100 gap-2">
                                                    <span className="font-medium text-slate-700">Row {inv.row}: <span className="text-slate-900">{inv.email || '(empty)'}</span></span>
                                                    <span className="text-red-600 bg-red-100/50 px-2 py-1 rounded text-xs font-semibold">{inv.errorMessage}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'result' && bulkResult && (
                        <div className="text-center py-10 space-y-6">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full mx-auto flex items-center justify-center border border-emerald-100">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Added {bulkResult.sent} members successfully!</h3>
                                <p className="text-slate-500">These members have received an email invitation to activate their accounts.</p>
                            </div>

                            {bulkResult.failed > 0 && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 max-w-md mx-auto text-left">
                                    <p className="font-bold text-red-700 mb-2">Failed {bulkResult.failed} rows:</p>
                                    <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                                        {bulkResult.errors.map((err, i) => (
                                            <li key={i}>- Row {err.row} ({err.email}): {err.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white flex-shrink-0">
                    {step === 'preview' && (
                        <>
                            <button
                                type="button"
                                onClick={reset}
                                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel / Upload another file
                            </button>
                            <button
                                type="button"
                                onClick={submitValid}
                                disabled={validateResult?.valid.length === 0 || bulkSendMutation.isPending}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#13ecb6] text-[#0a192f] font-bold rounded-xl hover:brightness-105 disabled:opacity-50 transition-all shadow-sm shadow-[#13ecb6]/20"
                            >
                                {bulkSendMutation.isPending ? 'Sending...' : <><Send className="w-4 h-4" /> Send {validateResult?.valid.length || 0} invitations</>}
                            </button>
                        </>
                    )}
                    {step === 'result' && (
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-[#13ecb6] text-[#0a192f] font-bold rounded-xl hover:brightness-105 transition-all w-full md:w-auto"
                        >
                            Done
                        </button>
                    )}
                    {step === 'upload' && (
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
