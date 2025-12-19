
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Message {
    role: 'user' | 'ai';
    content: string;
    sources?: any[];
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Hello! I am your AI Assistant. I can search all documents and generate reports for you. How can I help?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/api/v1/search/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg })
            });
            const data = await res.json();

            setMessages(prev => [...prev, {
                role: 'ai',
                content: data.answer,
                sources: data.sources
            }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] glass-panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="text-xl">🤖</span> AI Insight Assistant
                </h3>
                <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">Powered by Gemini & RAG</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                            }`}>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100/50">
                                    <p className="text-xs font-semibold opacity-70 mb-1">Sources:</p>
                                    <ul className="space-y-1">
                                        {msg.sources.map((src: any, i: number) => (
                                            <li key={i} className="text-xs flex items-center gap-1 opacity-80 truncate">
                                                <span className="w-1 h-1 rounded-full bg-current"></span>
                                                {src.filename}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about documents, e.g. 'Summarize the Ministry report'..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
