import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { format, differenceInSeconds } from 'date-fns';
import { Search, Calendar } from 'lucide-react';

export const SessionList = ({ sessions, onSelect, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSessions = useMemo(() => {
        if (!searchTerm) return sessions;

        const term = searchTerm.toLowerCase();
        return sessions.filter(s =>
            s.name?.toLowerCase().includes(term) ||
            s.session_id.toLowerCase().includes(term)
        );
    }, [sessions, searchTerm]);

    if (isLoading) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted">Loading sessions...</p>
            </Card>
        );
    }

    if (sessions.length === 0) {
        return (
            <Card className="p-12 text-center">
                <Calendar size={48} className="mx-auto text-muted mb-4" />
                <p className="text-muted text-lg">No sessions recorded yet</p>
                <p className="text-sm text-muted/70 mt-2">
                    Start recording from the Dashboard to create sessions
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <Card className="p-4">
                <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Search sessions by name or ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded text-text placeholder-muted focus:border-primary outline-none transition-colors"
                    />
                </div>
                <p className="text-xs text-muted mt-2">
                    {filteredSessions.length} of {sessions.length} sessions
                </p>
            </Card>

            {/* Session List */}
            <div className="space-y-2">
                {filteredSessions.length === 0 ? (
                    <Card className="p-8 text-center">
                        <p className="text-muted">No sessions match your search</p>
                    </Card>
                ) : (
                    filteredSessions.map(session => (
                        <SessionListItem
                            key={session.session_id}
                            session={session}
                            onClick={() => onSelect(session.session_id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const SessionListItem = ({ session, onClick }) => {
    const duration = differenceInSeconds(
        new Date(session.end_time),
        new Date(session.start_time)
    );

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    return (
        <Card
            className="p-4 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-text">
                        {session.name || `Session ${session.session_id.slice(0, 8)}...`}
                    </h3>
                    <p className="text-sm text-muted mt-1">
                        {format(new Date(session.start_time), 'PPpp')}
                    </p>
                    <p className="text-xs text-muted/70 mt-1 font-mono">
                        ID: {session.session_id}
                    </p>
                </div>
                <div className="text-right">
                    <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">
                        {session.data_point_count.toLocaleString()} pts
                    </div>
                    <p className="text-sm text-muted mt-2">
                        Duration: {formatDuration(duration)}
                    </p>
                </div>
            </div>
        </Card>
    );
};
