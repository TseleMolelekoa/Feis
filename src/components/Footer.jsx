// src/components/Footer.jsx
import React from 'react';

export default function Footer({ user, currentYear = new Date().getFullYear() }) {
    const [showSupport, setShowSupport] = React.useState(false);
    const [showAbout, setShowAbout] = React.useState(false);

    return (
        <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-auto">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🔥</span>
                            <h3 className="text-lg font-bold">FEIS</h3>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Fire Equipment Inspection System
                        </p>
                        <p className="text-gray-500 text-xs">
                            Ensuring safety through comprehensive inspections
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                            Quick Links
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                                    <span>📋</span> Inspection Guidelines
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                                    <span>📊</span> Safety Reports
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                                    <span>🎓</span> Training Materials
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                                    <span>📞</span> Emergency Contacts
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Support & Help */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                            Support
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => setShowSupport(!showSupport)}
                                    className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 w-full text-left"
                                >
                                    <span>❓</span> Help Center
                                </button>
                                {showSupport && (
                                    <div className="mt-2 pl-6 space-y-1">
                                        <p className="text-xs text-gray-500">24/7 Support: +27 123 456 789</p>
                                        <p className="text-xs text-gray-500">Email: support@feis.co.za</p>
                                    </div>
                                )}
                            </li>
                            <li>
                                <button
                                    onClick={() => setShowAbout(!showAbout)}
                                    className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 w-full text-left"
                                >
                                    <span>ℹ️</span> About FEIS
                                </button>
                                {showAbout && (
                                    <div className="mt-2 pl-6">
                                        <p className="text-xs text-gray-500">Version 2.0.0</p>
                                        <p className="text-xs text-gray-500">Last updated: March 2026</p>
                                    </div>
                                )}
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                                    <span>📧</span> Contact Support
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* System Status */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                            System Status
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Server Status:</span>
                                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Operational
                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Last Sync:</span>
                                <span className="text-xs text-gray-300">Just now</span>
                            </div>
                            {user && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Logged in as:</span>
                                    <span className="text-xs text-gray-300">{user.name}</span>
                                </div>
                            )}
                            <div className="pt-2">
                                <div className="bg-gray-700 rounded-full h-1 overflow-hidden">
                                    <div className="bg-green-500 h-full w-3/4 rounded-full"></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">System Health: 98%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-gray-700 mt-6 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-xs">
                            © {currentYear} FEIS-Fire Equipment Inspection System. All rights reserved.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                                Privacy Policy
                            </a>
                            <a href="#" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                                Terms of Service
                            </a>
                            <a href="#" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                                Cookie Policy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}