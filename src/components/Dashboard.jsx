import React from 'react';
import { SessionCard } from './SessionCard';
import { motion } from 'framer-motion';

export const Dashboard = ({ sessions, onDeleteSession }) => {
    if (!sessions || sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted/50">
                <div className="text-6xl mb-4">📭</div>
                <h2 className="text-2xl font-bold font-mono uppercase tracking-widest text-text">No Data Available</h2>
                <p className="mt-2 text-sm text-muted">Waiting for incoming data stream...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1920px] mx-auto p-4 md:p-6 space-y-6 pb-20">
            {sessions.map((session) => (
                <SessionCard
                    key={session.key}
                    session={session}
                    onDelete={onDeleteSession}
                />
            ))}
        </div>
    );
};
