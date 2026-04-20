import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Zap, Battery, History, Settings, Sun, Moon, Circle, Square } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSession } from '../context/SessionContext';

const NAV_LINKS = [
    { to: '/', icon: LayoutDashboard, label: 'Pitwall', end: true },
    { to: '/dynamics', icon: Activity, label: 'Dynamics' },
    { to: '/powertrain', icon: Zap, label: 'Powertrain' },
    { to: '/battery', icon: Battery, label: 'Battery' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

/** Navbar session recorder — spans full width, always visible */
const SessionStrip = () => {
    const { activeSession, isRecording, isLoading, startSession, stopSession, renameSession } = useSession();
    const [sessionName, setSessionName] = useState('');
    const [elapsed, setElapsed] = useState(0);
    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);

    // Sync name input when session changes (e.g. another tab starts one)
    useEffect(() => {
        setSessionName(activeSession?.name || '');
    }, [activeSession]);

    // Elapsed timer
    useEffect(() => {
        if (!isRecording || !activeSession) { setElapsed(0); return; }
        const start = new Date(activeSession.start_time).getTime();
        const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [isRecording, activeSession]);

    const handleStart = async () => {
        setIsStarting(true);
        try { await startSession(sessionName.trim()); }
        catch { /* SessionContext logs */ }
        finally { setIsStarting(false); }
    };

    const handleStop = async () => {
        if (!window.confirm('Stop recording session?')) return;
        setIsStopping(true);
        try { await stopSession(); setSessionName(''); }
        catch { /* SessionContext logs */ }
        finally { setIsStopping(false); }
    };

    const handleNameBlur = async () => {
        if (activeSession && sessionName !== activeSession.name) {
            try { await renameSession(activeSession.session_id, sessionName); }
            catch { /* SessionContext logs */ }
        }
    };

    const canRecord = sessionName.trim().length > 0;

    if (isLoading) return null;

    return (
        <div className="flex items-center gap-3 w-full">
            {isRecording ? (
                <>
                    <Circle size={12} fill="#ef4444" className="text-red-500 animate-pulse shrink-0" />
                    <span className="font-mono font-bold text-red-500 text-base shrink-0">
                        REC {formatDuration(elapsed)}
                    </span>
                    <input
                        type="text"
                        value={sessionName}
                        onChange={e => setSessionName(e.target.value)}
                        onBlur={handleNameBlur}
                        onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                        placeholder="Session name"
                        className="flex-1 max-w-xs bg-background border border-border rounded px-3 py-1.5 text-sm text-text placeholder-muted focus:border-primary outline-none transition-colors"
                    />
                    <button
                        onClick={handleStop}
                        disabled={isStopping}
                        className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        <Square size={12} fill="currentColor" />
                        {isStopping ? 'Stopping...' : 'Stop'}
                    </button>
                </>
            ) : (
                <>
                    <span className="text-sm font-mono text-muted uppercase tracking-widest shrink-0">Session</span>
                    <div className="relative flex-1 max-w-xs">
                        <input
                            type="text"
                            value={sessionName}
                            onChange={e => setSessionName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && canRecord && handleStart()}
                            placeholder="Name required to record"
                            className={`w-full bg-background border rounded px-3 py-1.5 text-sm text-text placeholder-muted focus:border-primary outline-none transition-colors ${
                                canRecord ? 'border-border' : 'border-border/50'
                            }`}
                        />
                    </div>
                    <button
                        onClick={handleStart}
                        disabled={isStarting || !canRecord}
                        title={!canRecord ? 'Enter a session name to record' : undefined}
                        className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded bg-green-500/20 hover:bg-green-500/40 text-green-400 text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Circle size={12} />
                        {isStarting ? 'Starting...' : 'Record'}
                    </button>
                </>
            )}
        </div>
    );
};

export const MainLayout = ({ children }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="flex h-screen w-full bg-background text-text overflow-hidden transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-56 bg-surface border-r border-border hidden md:flex flex-col">
                <div className="p-5 border-b border-border">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic tracking-tighter">
                        BLACKPEARL
                    </h1>
                    <p className="text-[10px] text-muted tracking-widest uppercase mt-0.5">Dashboard · Beta</p>
                </div>

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {NAV_LINKS.map(({ to, icon: Icon, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${
                                    isActive
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'text-muted hover:text-text hover:bg-surfaceHighlight'
                                }`
                            }
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Theme */}
                <div className="border-t border-border p-3">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-muted hover:text-text hover:bg-surfaceHighlight transition-all text-sm"
                    >
                        <span className="font-medium">Theme</span>
                        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                </div>
            </aside>

            {/* Main content column */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
                {/* Top navbar — session recorder, always visible */}
                <header className="h-12 shrink-0 bg-surface border-b border-border flex items-center px-4 gap-4">
                    <SessionStrip />
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="relative z-10 max-w-[1920px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
