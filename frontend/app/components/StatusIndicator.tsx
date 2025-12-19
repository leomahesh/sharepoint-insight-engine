import { useState, useEffect } from 'react';

export default function StatusIndicator() {
    const [status, setStatus] = useState<any>(null);

    useEffect(() => {
        const fetchStatus = () => {
            fetch('http://localhost:8000/api/v1/ingestion/status')
                .then(res => res.json())
                .then(data => setStatus(data))
                .catch(err => console.error("Status fetch error", err));
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, []);

    if (!status || !status.is_processing) return null;

    return (
        <div className="flex items-center gap-2 bg-blue-600/20 px-3 py-1.5 rounded-full border border-blue-400/30 backdrop-blur-md animate-pulse">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="text-xs font-medium text-blue-100">
                Indexing: {status.current_file} ({status.processed_files}/{status.total_files})
            </span>
        </div>
    );
}
