// src/components/TopNav.jsx
import React from 'react';

export default function TopNav({ title, subtitle, onBack, onLogout, user, right }) {
    return (
        <div className="bg-red-600 text-white px-4 py-3 sticky top-0 z-30 shadow-lg">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500 text-xl font-bold transition-colors"
                    >
                        ‹
                    </button>
                ) : user && (
                    <div className="w-8 h-8 rounded-full bg-white bg-opacity-25 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {user.avatar}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate leading-tight">{title}</p>
                    {subtitle && <p className="text-red-200 text-xs">{subtitle}</p>}
                </div>
                {right}
                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="text-red-200 text-xs border border-red-400 border-opacity-40 px-2.5 py-1 rounded-lg hover:bg-red-500 flex-shrink-0 transition-colors"
                    >
                        Sign out
                    </button>
                )}
            </div>
        </div>
    );
}