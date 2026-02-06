import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Battery, History, Settings, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const MainLayout = ({ children }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="flex h-screen w-full bg-background text-text overflow-hidden transition-colors duration-300">
            {/* Sidebar - Desktop */}
            <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col">
                <div className="p-6 border-b border-border">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic tracking-tighter">
                        BLACK PEARL
                    </h1>
                    <p className="text-xs text-muted mt-1 tracking-widest uppercase">Racing Telemetry</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'text-muted hover:text-text hover:bg-surfaceHighlight'
                            }`
                        }
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/bms"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'text-muted hover:text-text hover:bg-surfaceHighlight'
                            }`
                        }
                    >
                        <Battery size={20} />
                        <span>BMS Monitor</span>
                    </NavLink>

                    <NavLink
                        to="/history"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'text-muted hover:text-text hover:bg-surfaceHighlight'
                            }`
                        }
                    >
                        <History size={20} />
                        <span>History</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-border space-y-2">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-muted hover:text-text hover:bg-surfaceHighlight transition-all"
                    >
                        <span className="font-medium">Theme</span>
                        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>

                    <div className="flex items-center gap-3 px-4 py-3 text-muted hover:text-text cursor-pointer transition-colors rounded-lg hover:bg-surfaceHighlight">
                        <Settings size={20} />
                        <span className="font-medium">Settings</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background">
                {/* Mobile Header */}
                <header className="md:hidden h-16 border-b border-border flex items-center px-4 justify-between bg-surface/80 backdrop-blur-md sticky top-0 z-50">
                    <h1 className="text-xl font-bold text-primary italic">BP RACING</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="text-text">
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <button className="text-text">
                            <Menu size={24} />
                        </button>
                    </div>
                </header>

                {/* Scrollable Area */}
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative">
                    <div className="relative z-10 max-w-[1920px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
