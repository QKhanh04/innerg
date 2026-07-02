import React from 'react';
import { FileText, Link2, AlertCircle } from 'lucide-react';

export default function DocumentViewer({ url, fileType, title }) {
    if (!url) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <AlertCircle className="size-12 opacity-50" />
                <p className="text-sm font-semibold">No document source provided.</p>
            </div>
        );
    }

    // Lấy extension từ fileType truyền vào, nếu không có thì bóc tách từ chính cái URL ra
    const fileExt = (fileType || url.split('.').pop() || '').toLowerCase();
    const isPdf = fileExt.includes('pdf');
    const isDoc = fileExt.includes('docx') || fileExt.includes('doc');
    const isPpt = fileExt.includes('pptx') || fileExt.includes('ppt');
    const isLink = fileType === 'Link';

    // Sử dụng Google Docs Viewer nhúng qua iframe để render nhanh các định dạng văn phòng
    let viewerUrl = url;
    if (isDoc || isPpt) {
        viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }

    if (isLink) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 bg-slate-50">
                <Link2 className="size-12 text-indigo-300" />
                <p className="text-sm font-bold text-slate-600">This is an external link.</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    Open in New Tab
                </a>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-[#f1f3f4]">
            <iframe
                src={viewerUrl}
                className="w-full h-full border-none"
                title={title}
            />
        </div>
    );
}
