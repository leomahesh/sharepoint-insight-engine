'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [aiAnswer, setAiAnswer] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setAiAnswer(null); // Reset
        setResults([]);

        try {
            const res = await fetch(`http://localhost:8000/api/v1/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();

                // Set Answer
                if (data.answer) {
                    setAiAnswer(data.answer);
                }

                // Map results
                const rawResults = data.results || [];
                const mappedResults = rawResults.map((item: any) => ({
                    id: item.id,
                    title: item.filename,
                    snippet: item.snippet,
                    source: "Upload",
                    author: "System",
                    modified: item.metadata?.created_at ? new Date(item.metadata.created_at).toLocaleDateString() : "Unknown",
                    type: item.filename.endsWith('pdf') ? 'pdf' : 'word'
                }));
                setResults(mappedResults);
            } else {
                console.error("Search failed");
            }
        } catch (err) {
            console.error("Search error", err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50">
            <header className="mb-8">
                <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">← Back to Dashboard</Link>
                <h1 className="text-3xl font-bold text-gray-900">Search Documents</h1>
            </header>

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by keyword, author, or content..."
                            className="w-full text-lg p-4 pl-12 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                        >
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>

                <div className="space-y-6">
                    {/* Gemini Answer Section */}
                    {aiAnswer && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-24 h-24 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
                            </div>
                            <h2 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                                ✨ Gemini Answer
                            </h2>
                            <div className="prose text-blue-900/80 max-w-none text-sm leading-relaxed">
                                <p className="whitespace-pre-line">{aiAnswer}</p>
                            </div>
                        </div>
                    )}

                    {results.length > 0 ? (
                        results.map((result) => (
                            <div key={result.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-semibold text-blue-600 mb-1">
                                            <Link href={`/documents/${result.id}`}>{result.title}</Link>
                                        </h2>
                                        <div className="flex items-center text-sm text-gray-500 mb-2 gap-4">
                                            <span>👤 {result.author}</span>
                                            <span>📅 {result.modified}</span>
                                            <span>📂 {result.source}</span>
                                        </div>
                                        <p className="text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-100 text-sm font-mono">
                                            "...{result.snippet}..."
                                        </p>
                                    </div>
                                    <span className="text-2xl">{result.type === 'pdf' ? '📕' : '📘'}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        query && !isSearching && <div className="text-center text-gray-500 py-10">No results found (Try "test" or any keyword)</div>
                    )}
                </div>
            </div>
        </div>
    );
}
