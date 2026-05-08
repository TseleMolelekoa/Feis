// src/components/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Footer from './Footer';
import { EQ_TYPES, EQUIPMENT, STATUS_STYLES } from '../constants/data';

export default function Dashboard({ user, inspections, equipment, onNavigate, onLogout }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [greeting, setGreeting] = useState("");

    // Set greeting based on time of day
    useEffect(() => {
        const hour = currentTime.getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 17) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, [currentTime]);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Generate notifications based on inspections
    useEffect(() => {
        const newNotifications = [];
        
        // Action required notifications
        const pendingActions = inspections.filter(i => i.status === "Action Required").length;
        if (pendingActions > 0) {
            newNotifications.push({
                id: 1,
                message: `${pendingActions} equipment(s) require immediate action`,
                type: "warning",
                timestamp: new Date()
            });
        }
        
        // Out of service notifications
        const oosCount = inspections.filter(i => i.status === "Out of Service").length;
        if (oosCount > 0) {
            newNotifications.push({
                id: 2,
                message: `${oosCount} equipment(s) are out of service`,
                type: "danger",
                timestamp: new Date()
            });
        }
        
        // Expired equipment notifications (if equipment has expiry)
        const expiredCount = (equipment || EQUIPMENT).filter(e => {
            if (e.expiryDate) {
                return new Date(e.expiryDate) < new Date();
            }
            return false;
        }).length;
        
        if (expiredCount > 0) {
            newNotifications.push({
                id: 3,
                message: `${expiredCount} equipment(s) have expired certificates`,
                type: "danger",
                timestamp: new Date()
            });
        }
        
        // Low inspection rate notification
        const totalEquipment = (equipment || EQUIPMENT).length;
        const inspectedRecently = inspections.filter(i => {
            const daysSince = (new Date() - new Date(i.ts)) / (1000 * 60 * 60 * 24);
            return daysSince <= 30;
        }).length;
        
        if (totalEquipment > 0 && inspectedRecently < totalEquipment * 0.5) {
            newNotifications.push({
                id: 4,
                message: `Less than 50% of equipment inspected in the last 30 days`,
                type: "info",
                timestamp: new Date()
            });
        }
        
        setNotifications(newNotifications);
    }, [inspections, equipment]);

    // Memoized values for performance
    const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
    
    const todayCount = useMemo(() => 
        inspections.filter(i => i.ts && i.ts.startsWith(todayStr)).length,
        [inspections, todayStr]
    );
    
    const actionCount = useMemo(() => 
        inspections.filter(i => i.status === "Action Required").length,
        [inspections]
    );
    
    const oosCount = useMemo(() => 
        inspections.filter(i => i.status === "Out of Service").length,
        [inspections]
    );
    
    const recent = useMemo(() => 
        [...inspections].reverse().slice(0, 5),
        [inspections]
    );
    
    const equipmentList = useMemo(() => equipment || EQUIPMENT, [equipment]);
    
    // Role-based access control
    const canReport = useMemo(() => 
        ["admin", "supervisor"].includes(user?.role?.toLowerCase()), 
        [user?.role]
    );
    
    const canInspect = useMemo(() => 
        ["admin", "supervisor", "inspector"].includes(user?.role?.toLowerCase()), 
        [user?.role]
    );
    
    const canAddEquipment = useMemo(() => 
        ["admin"].includes(user?.role?.toLowerCase()), 
        [user?.role]
    );

    // Menu items with proper permissions
    const menu = useMemo(() => [
        canInspect && { 
            label: "Start Inspection", 
            icon: "🔍", 
            action: "equipment", 
            bg: "bg-gradient-to-r from-red-500 to-red-600", 
            color: "text-white",
            description: "Begin new inspection"
        },
        { 
            label: "Equipment List", 
            icon: "📋", 
            action: "equipment", 
            bg: "bg-gradient-to-r from-blue-500 to-blue-600", 
            color: "text-white",
            description: "View all equipment"
        },
        canAddEquipment && { 
            label: "Add Equipment", 
            icon: "➕", 
            action: "addEquipment", 
            bg: "bg-gradient-to-r from-green-500 to-green-600", 
            color: "text-white",
            description: "Register new equipment"
        },
        canReport && { 
            label: "Reports", 
            icon: "📊", 
            action: "reports", 
            bg: "bg-gradient-to-r from-purple-500 to-purple-600", 
            color: "text-white",
            description: "View inspection reports"
        }
    ].filter(Boolean), [canInspect, canAddEquipment, canReport]);

    // Stats with trends
    const stats = useMemo(() => [
        { 
            label: "Total Equipment", 
            value: equipmentList.length, 
            icon: "🔧", 
            color: "from-gray-600 to-gray-700", 
            action: "equipment", 
            change: `+${Math.round((inspections.length / equipmentList.length) * 100)}% inspected`,
            trend: inspections.length > 0 ? "up" : "down"
        },
        { 
            label: "Today's Inspections", 
            value: todayCount, 
            icon: "✅", 
            color: "from-green-500 to-green-600", 
            action: "reports", 
            change: todayCount > 0 ? `+${todayCount} today` : "No inspections",
            trend: todayCount > 0 ? "up" : "down"
        },
        { 
            label: "Action Required", 
            value: actionCount, 
            icon: "⚠️", 
            color: "from-orange-500 to-orange-600", 
            action: "reports", 
            change: actionCount > 0 ? "Urgent attention" : "All good",
            trend: actionCount > 0 ? "up" : "down"
        },
        { 
            label: "Out of Service", 
            value: oosCount, 
            icon: "🚫", 
            color: "from-red-500 to-red-600", 
            action: "reports", 
            change: oosCount > 0 ? "Needs replacement" : "Operational",
            trend: oosCount > 0 ? "up" : "down"
        }
    ], [equipmentList.length, inspections.length, todayCount, actionCount, oosCount]);

    // Handle navigation with loading state
    const handleNavigate = useCallback(async (action) => {
        setIsLoading(true);
        try {
            await onNavigate(action);
        } catch (error) {
            console.error("Navigation error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [onNavigate]);

    // Clear a specific notification
    const clearNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Get notification styles
    const getNotificationStyle = (type) => {
        switch(type) {
            case "warning": return "bg-yellow-50 border-yellow-200 text-yellow-800";
            case "danger": return "bg-red-50 border-red-200 text-red-800";
            default: return "bg-blue-50 border-blue-200 text-blue-800";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent"></div>
                        <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                </div>
            )}

            {/* Modern Header with Gradient */}
            <div className="bg-gradient-to-r from-red-700 via-red-800 to-red-900 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl">
                                <span className="text-2xl">🔥</span>
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold">Fire Equipment Inspection System</h1>
                                <p className="text-red-200 text-xs md:text-sm">Ensuring safety through comprehensive inspections</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Time Display */}
                            <div className="hidden md:block text-right">
                                <p className="text-xs text-red-200">
                                    {currentTime.toLocaleDateString('en-ZA', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </p>
                                <p className="text-sm font-semibold">{currentTime.toLocaleTimeString('en-ZA')}</p>
                            </div>

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 hover:bg-white/10 rounded-xl transition-colors"
                                    aria-label="Notifications"
                                >
                                    <span className="text-xl">🔔</span>
                                    {notifications.length > 0 && (
                                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>
                                
                                {showNotifications && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowNotifications(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 overflow-hidden">
                                            <div className="p-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-800">Notifications</h4>
                                                <p className="text-xs text-gray-500">Updates and alerts</p>
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.map(notif => (
                                                        <div 
                                                            key={notif.id} 
                                                            className={`p-3 border-b border-gray-100 ${getNotificationStyle(notif.type)}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-medium">{notif.message}</p>
                                                                    <p className="text-xs opacity-75 mt-1">
                                                                        {notif.timestamp.toLocaleTimeString()}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => clearNotification(notif.id)}
                                                                    className="text-xs opacity-50 hover:opacity-100"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-8 text-center text-gray-500">
                                                        <span className="text-3xl mb-2 block">📭</span>
                                                        <p className="text-xs">No new notifications</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* User Profile */}
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                                    {user?.avatar || user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-xs font-semibold">{user?.name || "User"}</p>
                                    <p className="text-xs text-red-200 capitalize">{user?.role || "Viewer"}</p>
                                </div>
                                <button 
                                    onClick={onLogout} 
                                    className="ml-2 text-xs text-red-200 hover:text-white transition-colors"
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {greeting}, {user?.name?.split(" ")[0] || "User"}! 👋
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Here's what's happening with your fire equipment today.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {canInspect && (
                                <button
                                    onClick={() => handleNavigate("equipment")}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md"
                                >
                                    🔍 Start Inspection
                                </button>
                            )}
                            {canAddEquipment && (
                                <button
                                    onClick={() => handleNavigate("addEquipment")}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md"
                                >
                                    ➕ Add Equipment
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid - Modern Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {stats.map(({ label, value, icon, color, action, change, trend }) => (
                        <button
                            key={label}
                            onClick={() => handleNavigate(action)}
                            className={`bg-gradient-to-br ${color} text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl">{icon}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    trend === 'up' ? 'bg-green-500/30' : 'bg-red-500/30'
                                }`}>
                                    {change}
                                </span>
                            </div>
                            <div className="text-2xl font-bold">{value}</div>
                            <div className="text-xs opacity-90 mt-1">{label}</div>
                        </button>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {menu.map(m => (
                        <button
                            key={m.action}
                            onClick={() => handleNavigate(m.action)}
                            className={`${m.bg} text-white rounded-xl p-4 text-center hover:shadow-xl transition-all transform hover:scale-105 group`}
                        >
                            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{m.icon}</div>
                            <div className="text-sm font-semibold">{m.label}</div>
                            {m.description && (
                                <div className="text-xs opacity-75 mt-1 hidden md:block">{m.description}</div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Equipment Categories and Recent Inspections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Equipment by Type */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Equipment Categories</h3>
                            <p className="text-xs text-gray-500 mt-1">Overview of all equipment types</p>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                            {Object.entries(EQ_TYPES).map(([type, config]) => {
                                const count = equipmentList.filter(e => e.type === type).length;
                                const inspected = inspections.filter(i => i.equipmentType === type).length;
                                const percentage = count > 0 ? (inspected / count) * 100 : 0;
                                
                                return (
                                    <button
                                        key={type}
                                        onClick={() => handleNavigate(`type:${type}`)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-xl`}>
                                            {config.emoji}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{config.label}</p>
                                            <p className="text-xs text-gray-500">
                                                {inspected} of {count} inspected this month
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${
                                                        percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-gray-400 text-lg">›</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Inspections */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Recent Inspections</h3>
                            <p className="text-xs text-gray-500 mt-1">Latest 5 inspection records</p>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                            {recent.length > 0 ? (
                                recent.map(ins => {
                                    const config = EQ_TYPES[ins.equipmentType];
                                    if (!config) return null;
                                    
                                    return (
                                        <div key={ins.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-xl flex-shrink-0`}>
                                                    {config.emoji}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                                            {ins.equipmentId}
                                                        </p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_STYLES[ins.status]}`}>
                                                            {ins.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {ins.area} · {ins.location || ins.gpsLocation?.coordinates || "N/A"}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(ins.ts).toLocaleString("en-ZA")} by {ins.inspector}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-gray-400">
                                    <p className="text-4xl mb-2">📋</p>
                                    <p className="text-sm">No inspections yet</p>
                                    <p className="text-xs mt-1">Start your first inspection</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Safety Tips Card */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">💡</div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-yellow-800">Safety Tip</h4>
                            <p className="text-xs text-yellow-700 mt-1">
                                Regular inspection of fire equipment can reduce fire-related incidents by up to 70%.
                                Ensure all equipment is checked monthly and serviced annually.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer user={user} />
        </div>
    );
}