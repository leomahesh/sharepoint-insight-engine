
'use client';

import { useState, useEffect } from 'react';

export default function Flasher() {
    const [message, setMessage] = useState<string>("");
    const [active, setActive] = useState<boolean>(true);

    useEffect(() => {
        fetch('http://localhost:8000/api/v1/config/flasher')
            .then(res => res.json())
            .then(data => {
                setMessage(data.message);
                setActive(data.active);
            })
            .catch(err => console.error("Failed to fetch flasher config", err));
    }, []);

    if (!active || !message) return null;

    return (
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white overflow-hidden py-2 relative shadow-md z-40">
            <div className="animate-marquee whitespace-nowrap font-bold text-sm tracking-wide">
                <span className="mx-4">{message}</span>
                <span className="mx-4 text-orange-200">•</span>
                <span className="mx-4">{message}</span>
                <span className="mx-4 text-orange-200">•</span>
                <span className="mx-4">{message}</span>
                <span className="mx-4 text-orange-200">•</span>
                <span className="mx-4">{message}</span>
            </div>
            <style jsx>{`
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
        </div>
    );
}
