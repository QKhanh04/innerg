import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from '../../../../api/axios';
import { cn } from '../../../../lib/utils';

export default function AIChatbox({ trainingEventId, documentTitle }) {
    const [messages, setMessages] = useState([
        { id: 1, role: 'ai', content: `Hello! I'm your InnerG AI Assistant. You are currently viewing **${documentTitle || 'this file'}**, but I have read **ALL** the course materials for this class. How can I help you?` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;
        const userText = input.trim();
        
        // Extract previous history excluding the welcome message (id: 1)
        const currentHistory = messages.filter(m => m.id !== 1).map(m => ({
            role: m.role,
            content: m.content
        }));

        setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userText }]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await axios.post('/ai/chat', {
                trainingEventId: trainingEventId,
                newMessage: userText,
                history: currentHistory
            });

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                content: response.data.content
            }]);
        } catch (error) {
            console.error("AI Chat Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                content: "Sorry, I encountered an error while connecting to the AI system. Please try again later."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
                        <Bot className="size-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold text-slate-800">InnerG AI Tutor</h3>
                        <p className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                            <span className="relative flex size-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span></span>
                            Online & Ready
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                    <Sparkles className="size-3.5 text-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">GPT-4o</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50">
                {messages.map((msg) => (
                    <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}
                    >
                        <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm", msg.role === 'user' ? "bg-slate-800" : "bg-indigo-600")}>
                            {msg.role === 'user' ? <User className="size-4 text-white" /> : <Bot className="size-4 text-white" />}
                        </div>
                        <div className={cn("p-4 rounded-2xl text-sm leading-relaxed overflow-x-auto", msg.role === 'user' ? "bg-slate-800 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm")}>
                            {msg.role === 'user' ? (
                                msg.content
                            ) : (
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-extrabold text-slate-800" {...props} />,
                                        em: ({node, ...props}) => <em className="italic" {...props} />,
                                        h1: ({node, ...props}) => <h1 className="text-xl font-black mb-3 text-slate-900 mt-4" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-3 text-slate-900 mt-4" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 text-slate-900 mt-3" {...props} />,
                                        a: ({node, ...props}) => <a className="text-indigo-600 hover:underline font-medium" {...props} />,
                                        code: ({node, inline, ...props}) => 
                                            inline 
                                                ? <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-[13px] font-mono font-medium" {...props} /> 
                                                : <pre className="bg-slate-800 text-slate-50 p-4 rounded-xl overflow-x-auto text-[13px] mb-3 mt-1 shadow-inner"><code className="font-mono" {...props} /></pre>,
                                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-200 pl-4 py-1 italic text-slate-600 bg-indigo-50/50 my-3 rounded-r-lg" {...props} />
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            )}
                        </div>
                    </motion.div>
                ))}
                
                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%]">
                        <div className="size-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                            <Bot className="size-4 text-white" />
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm shadow-sm flex items-center gap-1.5">
                            <span className="size-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="size-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="size-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                    <textarea 
                        rows={1}
                        className="w-full bg-transparent resize-none outline-none text-sm text-slate-800 placeholder-slate-400 p-2 max-h-32"
                        placeholder="Ask anything about this class..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="size-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white flex items-center justify-center shrink-0 transition-colors"
                    >
                        <Send className="size-4" />
                    </button>
                </div>
                <div className="flex items-center justify-center gap-1 mt-3">
                    <AlertCircle className="size-3 text-slate-400" />
                    <p className="text-[10px] font-bold text-slate-400">AI can make mistakes. Consider verifying important information.</p>
                </div>
            </div>
        </div>
    );
}
