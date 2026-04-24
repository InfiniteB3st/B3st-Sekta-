import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Terminal, Zap, ShieldAlert, Sparkles } from 'lucide-react';
import { getEskaMilaResponse } from '../services/gemini';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface EskaMilaBotProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosticData: any;
}

export const EskaMilaBot: React.FC<EskaMilaBotProps> = ({ isOpen, onClose, diagnosticData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('eska_mila_logs');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{
        role: 'bot',
        content: "I am Eska Mila. Initializing omniscience... Diagnostics read. How can I assist with your system architecture today?",
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eska_mila_logs', JSON.stringify(messages));
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getEskaMilaResponse(input, diagnosticData);
      const botMsg: Message = {
        role: 'bot',
        content: response || "Handshake failure.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "CRITICAL: Brain-link severed.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed bottom-10 right-10 w-[450px] h-[650px] bg-[#050505] border border-primary/20 rounded-[2.5rem] shadow-[0_0_100px_rgba(255,177,0,0.1)] z-[100000] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,177,0,0.4)]">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Eska Mila</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-primary font-black uppercase tracking-widest">Omniscient Brain</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
        >
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
              <div className={cn(
                "p-5 rounded-3xl text-sm max-w-[85%] leading-relaxed",
                msg.role === 'user' 
                  ? "bg-primary text-black font-bold rounded-tr-none" 
                  : "bg-white/5 text-gray-200 border border-white/5 rounded-tl-none italic"
              )}>
                {msg.content}
              </div>
              <span className="text-[8px] text-gray-600 font-bold mt-2 uppercase px-2">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-3 text-primary">
              <Terminal size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Calculating Transmission...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-8 border-t border-white/5 bg-black/40">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query the Brain..."
              className="w-full bg-[#111] border border-white/5 rounded-2xl p-5 pr-16 text-white text-sm focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-gray-700"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-3 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest text-center mt-4 italic">
            Direct Link to Diagnostic Node 01 Locked
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
