'use client';

import React, { useState } from 'react';
import { Mic, Share2, BookOpen, Loader2, Play, AlertCircle } from 'lucide-react';
import mermaid from 'mermaid';

interface StudioTilesProps {
    selectedFile: File | null;
    fileContent: string; // We might need to fetch content if not passed, but let's assume raw text is available or handled by backend if we pass file ID. 
    // For this MVP, we will pass the raw text content if available, or just the filename and let backend handle retrieval if we were doing file IDs.
    // The current backend endpoints expect 'content'.
}

export default function StudioTiles({ selectedFile, fileContent }: StudioTilesProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [podcastScript, setPodcastScript] = useState<string | null>(null);
    const [mindMapSyntax, setMindMapSyntax] = useState<string | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const handleGenerateValues = async (type: 'podcast' | 'mindmap' | 'quiz') => {
        if (!fileContent) {
            setError("Please upload and select a file first.");
            return;
        }
        setError(null);
        setLoading(type);

        try {
            const res = await fetch(`${API_URL}/api/v1/studio/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: fileContent }),
            });

            if (!res.ok) throw new Error(`Failed to generate ${type}`);

            const data = await res.json();

            if (type === 'podcast') setPodcastScript(data.script);
            if (type === 'mindmap') {
                setMindMapSyntax(data.mermaid_syntax);
                setTimeout(() => {
                    mermaid.initialize({ startOnLoad: true });
                    mermaid.contentLoaded();
                    // Force re-render of mermaid diagram if needed
                    const element = document.getElementById('mermaid-graph');
                    if (element) {
                        element.removeAttribute('data-processed');
                        mermaid.run({ nodes: [element] });
                    }
                }, 100);
            }
            if (type === 'quiz') setQuizQuestions(data.questions);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Podcast Tile */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <Mic size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Audio Overview</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">Generate a deep-dive podcast script.</p>

                {!podcastScript ? (
                    <button
                        onClick={() => handleGenerateValues('podcast')}
                        disabled={!!loading}
                        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                    >
                        {loading === 'podcast' ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        <span>Generate Script</span>
                    </button>
                ) : (
                    <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto text-sm text-gray-700">
                        <h4 className="font-bold mb-2">Podcast Script:</h4>
                        <p className="whitespace-pre-wrap">{podcastScript}</p>
                    </div>
                )}
            </div>

            {/* Mind Map Tile */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Share2 size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Mind Map</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">Visualize connections.</p>

                {!mindMapSyntax ? (
                    <button
                        onClick={() => handleGenerateValues('mindmap')}
                        disabled={!!loading}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                    >
                        {loading === 'mindmap' ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />}
                        <span>Visualize</span>
                    </button>
                ) : (
                    <div className="bg-gray-50 p-2 rounded-lg h-64 overflow-auto flex items-center justify-center">
                        <div id="mermaid-graph" className="mermaid">
                            {mindMapSyntax}
                        </div>
                    </div>
                )}
            </div>

            {/* Quiz Tile */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                        <BookOpen size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Quiz</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">Test your knowledge.</p>

                {!quizQuestions ? (
                    <button
                        onClick={() => handleGenerateValues('quiz')}
                        disabled={!!loading}
                        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                    >
                        {loading === 'quiz' ? <Loader2 className="animate-spin" size={18} /> : <BookOpen size={18} />}
                        <span>Generate Quiz</span>
                    </button>
                ) : (
                    <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto space-y-4">
                        {quizQuestions.map((q, idx) => (
                            <div key={idx} className="border-b border-gray-200 pb-2 last:border-0">
                                <p className="font-semibold text-sm mb-2">{idx + 1}. {q.question}</p>
                                <div className="space-y-1">
                                    {q.options.map((opt: string, i: number) => (
                                        <div key={i} className={`text-xs p-1 rounded ${opt === q.answer ? 'bg-green-100 text-green-800 font-medium' : 'bg-white text-gray-600'}`}>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {error && (
                <div className="col-span-1 md:col-span-3 bg-red-50 text-red-600 p-4 rounded-lg flex items-center space-x-2">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
