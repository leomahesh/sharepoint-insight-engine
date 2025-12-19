import React, { useState, useRef, useEffect } from 'react';

// Define types internally since we don't have a shared types file for this yet
interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

export const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Hello! I analyzed the feedback data. Ask me anything about sentiment trends, specific department issues, or student suggestions.', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Call our backend API instead of direct Gemini SDK
            const response = await fetch('http://localhost:8000/api/v1/search/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: input }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const text = data.answer;

            const botMsg: ChatMessage = { role: 'model', text: text || "I'm not sure how to answer that.", timestamp: new Date() };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: "Error connecting to AI Backend.", timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
            <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">RAG Assistant</h3>
                        <p className="text-[10px] text-slate-400">Context-Aware Analysis</p>
                    </div>
                </div>
                <span className="text-[10px] bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">Gemini 2.5 Pro</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800/50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-500/20'
                                : 'bg-slate-700 text-slate-200 border border-slate-600 shadow-sm rounded-bl-none'
                            }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <p className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700 p-3 rounded-2xl rounded-bl-none border border-slate-600 shadow-sm flex space-x-1 items-center">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-700">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about specific issues or trends..."
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/30"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
