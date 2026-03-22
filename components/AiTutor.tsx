import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Settings, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import type { Page } from '../types';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AiTutorProps {
  currentPage: Page;
}

const AiTutor: React.FC<AiTutorProps> = ({ currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    // @ts-ignore
    return localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      setShowSettings(true);
      return;
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contextPrompt = `You are an expert Operating Systems tutor for a university student. The student is currently using a virtual lab on the topic: ${currentPage.replace('-', ' ')}. Keep your answer concise (2-3 short paragraphs max), educational, and directly relate it to OS concepts. Answer their question: ${input}`;
      
      // Since @google/genai is used
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contextPrompt,
      });

      setMessages([...newMessages, { role: 'model', content: response.text || "I couldn't generate a response." }]);
    } catch (error: any) {
      setMessages([...newMessages, { role: 'model', content: `Error: ${error.message || 'Failed to connect to AI.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    setShowSettings(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: '500px', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark bg-blue-500 text-white">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <span className="font-semibold">OS AI Tutor</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className="p-1 hover:bg-white/20 rounded-md transition-colors" aria-label="Settings" title="Settings">
                  <Settings size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-md transition-colors" aria-label="Close" title="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-sm" ref={scrollRef}>
              {showSettings ? (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Gemini API Key</h3>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-4">
                    Enter your Google Gemini API key to enable the AI tutor. It will be saved locally.
                  </p>
                  <form onSubmit={handleSaveKey} className="flex gap-2">
                    <input
                      type="password"
                      value={apiKey === 'PLACEHOLDER_API_KEY' ? '' : apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" className="bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600">Save</button>
                  </form>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-text-muted-light dark:text-text-muted-dark mt-10">
                  <Bot size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Hi! I'm your OS Tutor.</p>
                  <p className="text-xs mt-2">Ask me anything about {currentPage.replace('-', ' ')}!</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user' 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            {!showSettings && (
              <div className="p-3 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-full px-4 py-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-transparent focus:outline-none text-sm"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:text-blue-600 transition-colors"
                    aria-label="Send message"
                    title="Send message"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Toggle AI Tutor"
        title="Toggle AI Tutor"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </motion.button>
    </div>
  );
};

export default AiTutor;
