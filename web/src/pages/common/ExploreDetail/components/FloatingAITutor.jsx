import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Loader2, Maximize2, Minimize2, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../../../api/axios';
import { toast } from 'react-hot-toast';

const TypewriterMessage = ({ content, onComplete, scrollRef }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let currentIndex = 0;
    const charsPerTick = 3; // Number of characters to reveal per tick

    const interval = setInterval(() => {
      if (currentIndex < content.length) {
        currentIndex = Math.min(currentIndex + charsPerTick, content.length);
        setDisplayedContent(content.slice(0, currentIndex));
        // Only scroll occasionally to avoid jank
        if (currentIndex % 15 === 0) {
          scrollRef.current?.scrollIntoView({ behavior: 'auto' });
        }
      } else {
        clearInterval(interval);
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, 20); // ms per tick

    return () => clearInterval(interval);
  }, [content]); // Only depend on content to avoid restarting on parent re-renders

  return (
    <div className="prose prose-sm prose-slate max-w-none 
      prose-headings:text-slate-800 prose-headings:font-bold prose-headings:mb-2
      prose-p:leading-relaxed prose-p:mb-2 last:prose-p:mb-0
      prose-ul:my-2 prose-li:my-0.5
      prose-code:bg-slate-100 prose-code:text-indigo-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-slate-800 prose-pre:text-slate-50 prose-pre:p-3 prose-pre:rounded-xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayedContent}
      </ReactMarkdown>
    </div>
  );
};
const FloatingAITutor = ({ trainingEventId, resources = [], className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      content: 'Hello! I am your AI Teaching Assistant for this class. I have read all the course materials. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSendMessage = async (textOverride) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputValue;
    if (!textToSend.trim()) return;

    const newMsg = {
      id: Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    if (typeof textOverride !== 'string') setInputValue('');
    setIsTyping(true);

    try {
      // Map history for API
      const history = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/ai/chat', {
        trainingEventId: trainingEventId,
        newMessage: newMsg.content,
        history: history
      });

      const aiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        content: res.data.content || res.data.reply || res.data,
        timestamp: new Date(),
        isNew: true
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      toast.error(error.response?.data?.message || 'Failed to get response from AI Tutor.');
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        content: "I'm sorry, I'm having trouble accessing my knowledge base right now. Please try again later.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 right-6 z-50 flex items-center justify-center p-0 w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-2xl shadow-indigo-500/40 text-white cursor-pointer group ${className}`}
          >
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity blur-md" />
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 opacity-30 animate-pulse blur-lg" />

            <Bot className="size-8 relative z-10" />

            {/* Notification Badge */}
            <div className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              width: isExpanded ? '800px' : '400px',
              height: isExpanded ? '80vh' : '600px'
            }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-white/20 backdrop-blur-md shadow-inner border border-white/20">
                  <Bot className="size-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] flex items-center gap-2">
                    AI Teaching Assistant
                    <Sparkles className="size-3 text-amber-300 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-indigo-100 font-medium">Trained on all class resources</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors hidden sm:block"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                    {/* Avatar */}
                    {msg.role === 'ai' && (
                      <div className="shrink-0 size-8 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center border border-indigo-200 mt-1">
                        <Bot className="size-4.5 text-indigo-600" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`group relative rounded-2xl px-5 py-3.5 shadow-sm ${msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : msg.isError
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 rounded-tl-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                      }`}>
                      {msg.role === 'ai' ? (
                        msg.isNew ? (
                          <TypewriterMessage
                            content={msg.content}
                            scrollRef={messagesEndRef}
                            onComplete={() => {
                              setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isNew: false } : m));
                            }}
                          />
                        ) : (
                          <div className="prose prose-sm prose-slate max-w-none 
                            prose-headings:text-slate-800 prose-headings:font-bold prose-headings:mb-2
                            prose-p:leading-relaxed prose-p:mb-2 last:prose-p:mb-0
                            prose-ul:my-2 prose-li:my-0.5
                            prose-code:bg-slate-100 prose-code:text-indigo-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-slate-800 prose-pre:text-slate-50 prose-pre:p-3 prose-pre:rounded-xl">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )
                      ) : (
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}

                      <span className={`absolute bottom-1 text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'right-full mr-2 text-slate-400' : 'left-full ml-2 text-slate-400'
                        }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="shrink-0 size-8 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center border border-indigo-200 mt-1">
                      <Bot className="size-4.5 text-indigo-600" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                      <motion.div className="size-1.5 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.div className="size-1.5 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="size-1.5 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              {/* Quick Actions */}
              {resources && resources.length > 0 && messages.length <= 3 && (
                <div className="flex gap-2 overflow-x-auto pb-3 mb-1 scrollbar-hide items-center">
                  <button 
                    onClick={() => handleSendMessage("✨ Summarize the entire class")}
                    className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-violet-100 to-indigo-100 text-indigo-700 hover:from-violet-200 hover:to-indigo-200 border border-indigo-200 rounded-full text-[11px] font-bold transition-all shadow-sm"
                  >
                    ✨ Summarize Class
                  </button>
                  {resources.slice(0, 4).map((res) => (
                    <button 
                      key={res.id}
                      onClick={() => handleSendMessage(`📄 Summarize ${res.title}`)}
                      className="shrink-0 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-semibold transition-colors max-w-[150px] truncate shadow-sm"
                      title={`Summarize ${res.title}`}
                    >
                      📄 {res.title}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-inner focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about the class..."
                  className="w-full bg-transparent border-none text-sm text-slate-700 py-3 pl-4 pr-2 max-h-32 min-h-[48px] resize-none focus:outline-none focus:ring-0 placeholder:text-slate-400"
                  rows={1}
                />
                <div className="shrink-0 pb-1 pr-1">
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors cursor-pointer"
                  >
                    {isTyping ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 -ml-0.5" />}
                  </button>
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Sparkles className="size-3" />
                  AI responses may not be 100% accurate. Verify important information.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAITutor;
