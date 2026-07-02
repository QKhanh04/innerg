import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Sparkles, Bot, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DocumentViewer from './components/DocumentViewer';
import AIChatbox from './components/AIChatbox';

export default function InteractiveViewer() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state || {};
    
    // Fallback if accessed directly without state
    if (!state.url && !state.resources) {
        return (
            <div className="h-screen flex items-center justify-center flex-col gap-4 bg-slate-50">
                <p className="text-slate-500 font-bold">Invalid Resource Link or Session Expired.</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-indigo-200">Go Back</button>
            </div>
        );
    }

    const { resourceId, resources, trainingEventId } = state;

    // Active Resource State
    const [activeResource, setActiveResource] = useState(() => {
        if (resources && resources.length > 0) {
            return resources.find(r => r.id === resourceId) || resources[0];
        }
        // Fallback for single resource access
        return { id: resourceId, url: state.url, title: state.title, fileType: state.fileType, type: state.type };
    });

    const isLink = activeResource.type === 'Link' || activeResource.fileType === 'Link';

    // UI States
    const [leftWidth, setLeftWidth] = useState(60);
    const [isDragging, setIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState('insight'); // 'insight' | 'chat'

    const handleMouseDown = (e) => {
        setIsDragging(true);
        e.preventDefault();
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        const newLeftWidth = (e.clientX / window.innerWidth) * 100;
        if (newLeftWidth >= 20 && newLeftWidth <= 80) {
            setLeftWidth(newLeftWidth);
        }
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Prevent body scroll when in viewer
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="size-9 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                    </button>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                        <h1 className="text-sm font-extrabold text-slate-800 leading-tight">{activeResource.title}</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{isLink ? 'External Link' : activeResource.fileType}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isLink && activeResource.url && (
                        <a href={activeResource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                            <Download className="size-3.5" />
                            <span className="hidden sm:inline">Download Original</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Split Screen Content */}
            <div className="flex-1 flex overflow-hidden bg-[#F3F4F6] relative">
                {/* Left Sidebar: Document Switcher */}
                {resources && resources.length > 1 && (
                    <div className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 shrink-0 z-10">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-[11px] font-black tracking-widest uppercase text-slate-500">Class Resources</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {resources.map((res) => {
                                const isActive = activeResource.id === res.id;
                                const isResLink = res.type === 'Link' || res.fileType === 'Link';
                                return (
                                    <button
                                        key={res.id}
                                        onClick={() => setActiveResource(res)}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {isResLink ? <Link2 className="size-3.5" /> : <FileText className="size-3.5" />}
                                        </div>
                                        <span className="text-[12px] font-semibold truncate">{res.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative p-3 sm:p-5">
                    {/* Overlay to catch iframe pointer events during drag */}
                    {isDragging && <div className="absolute inset-0 z-50 cursor-col-resize" />}

                    {/* Left Panel: PDF Viewer */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        style={{ width: `${leftWidth}%` }}
                        className="h-[50vh] lg:h-full relative z-10 shrink-0 pr-1.5 sm:pr-2.5"
                    >
                        <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <DocumentViewer key={`doc-${activeResource.id}`} url={activeResource.url} fileType={isLink ? 'Link' : activeResource.fileType} title={activeResource.title} />
                        </div>
                    </motion.div>

                    {/* Draggable Resizer Bar */}
                    <div 
                        onMouseDown={handleMouseDown}
                        className="hidden lg:flex w-3 cursor-col-resize items-center justify-center group z-20"
                    >
                        <div className={`h-12 w-1.5 rounded-full transition-colors ${isDragging ? 'bg-indigo-500' : 'bg-slate-300 group-hover:bg-indigo-400'}`} />
                    </div>

                    {/* Right Panel: AI Tabs */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        style={{ width: `calc(${100 - leftWidth}% - 12px)` }}
                        className="h-[50vh] lg:h-full flex flex-col flex-1 shrink-0 pl-1.5 sm:pl-2.5 mt-4 lg:mt-0"
                    >
                        <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            {/* Tabs Header */}
                            <div className="flex items-center p-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                <button 
                                    onClick={() => setActiveTab('insight')} 
                                    className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'insight' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Sparkles className="size-3.5" /> AI Insight
                                </button>
                                <button 
                                    onClick={() => setActiveTab('chat')} 
                                    className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Bot className="size-3.5" /> Chat Tutor
                                </button>
                            </div>
                            
                            {/* Tab Content */}
                            <div className="flex-1 overflow-hidden relative bg-white">
                                {activeTab === 'insight' ? (
                                    <div className="absolute inset-0 overflow-y-auto p-6">
                                        <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                                            <Sparkles className="size-4 text-indigo-500" />
                                            Key Takeaways
                                        </h3>
                                        <div className="prose prose-sm prose-slate max-w-none text-[13px] leading-relaxed
                                                    prose-p:m-0 prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5 prose-li:text-slate-700
                                                    prose-strong:text-indigo-900 prose-strong:font-bold">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {activeResource.aiLearningSummary || "AI is currently analyzing this document. Please check back later."}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ) : (
                                    <AIChatbox key={`chat-class-${trainingEventId}`} trainingEventId={trainingEventId} documentTitle={activeResource.title} />
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
