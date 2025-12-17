'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Mock search function
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock results
        setResults([
            {
                id: "101",
                title: `Result for ${query} - Meeting Notes`,
                snippet: `Discussion regarding ${query} and future plans for the quarter...`,
                source: "SharePoint/Team/General",
                author: "Alice Smith",
                modified: "2023-10-20",
                type: 'word'
            },
            {
                id: "102",
                title: `Specification - ${query}`,
                snippet: `Technical details about the implementation of ${query} and architecture...`,
                source: "SharePoint/Engineering/Specs",
                author: "Bob Jones",
                modified: "2023-09-15",
                type: 'pdf'
            }
        ]);
        setIsSearching(false);
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

                <div className="space-y-4">
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
