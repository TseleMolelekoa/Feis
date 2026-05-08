// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { USERS } from '../constants/data'; // Remove ROLE_COLORS import

const ROLES = [
    { key: "admin", label: "Admin", icon: "⚙️", idx: 0 },
    { key: "supervisor", label: "Supervisor", icon: "👷", idx: 2 },
    { key: "inspector", label: "Inspector", icon: "🔍", idx: 3 },
    { key: "miner", label: "Miner", icon: "⛏️", idx: 1 }
];

export default function LoginPage({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [selectedRole, setSelectedRole] = useState(null);

    const handleRoleSelect = (role) => {
        setSelectedRole(role.key);
        setUsername(USERS[role.idx].username);
        setPassword(USERS[role.idx].password);
        setError("");
    };

    const handleSubmit = () => {
        const user = USERS.find(u => u.username === username && u.password === password);
        if (!user) {
            setError("Invalid credentials. Select a role above to auto-fill.");
            return;
        }
        onLogin(user);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{
            background: "linear-gradient(135deg, #111827 0%, #1e1b4b 50%, #0f172a 100%)"
        }}>
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3 animate-bounce">🔥</div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">FEIS</h1>
                    <p className="text-red-300 text-sm mt-1">Fire Equipment Inspection System</p>
                    <p className="text-gray-500 text-xs mt-1">Ensuring safety through comprehensive inspections</p>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-5 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                            Select your role
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                            {ROLES.map(role => (
                                <button
                                    key={role.key}
                                    onClick={() => handleRoleSelect(role)}
                                    className={`flex flex-col items-center py-3 px-1 rounded-xl border-2 transition-all text-xs font-semibold ${
                                        selectedRole === role.key
                                            ? "border-red-500 bg-red-50 text-red-700"
                                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                    }`}
                                >
                                    <span className="text-xl mb-1">{role.icon}</span>
                                    {role.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3">
                                ⚠️ {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Username
                            </label>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                placeholder="Enter username"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type={showPassword ? "text" : "password"}
                                    onKeyPress={handleKeyPress}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 pr-10 transition-all"
                                    placeholder="Enter password"
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm hover:text-gray-600"
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all text-sm tracking-wide shadow-md"
                        >
                            SIGN IN →
                        </button>
                    </div>
                </div>

                <p className="text-center text-gray-500 text-xs mt-5">
                    © 2026 FEIS -Fire Equipment Inspection Safety System!
                </p>
            </div>
        </div>
    );
}