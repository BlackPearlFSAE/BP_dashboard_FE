import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ChartSection } from './ChartSection';
import { TableSection } from './TableSection';
import { Download, Trash2, FileJson, FileSpreadsheet } from 'lucide-react';
import { deleteSession } from '../utils/api';

export const SessionCard = ({ session, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    // Replicate Export Logic
    const handleExportJSON = () => {
        // Revert normalized data to original structure if needed, or just dump normalized? 
        // User request: "export structure same as original"
        // The original code dumped `allData[key].data`, which was the RAW API response items for that session.
        // So I should keep the original items in my normalized data to enable this.

        const rawRows = session.data.map(d => d.original);
        const blob = new Blob([JSON.stringify(rawRows, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `session_${session.session_id}_exp_${session.experiment_id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        // For CSV, flatten the structure: one row per data point with all values
        const rows = session.data;
        if (!rows.length) return;

        // Collect all unique value keys across all rows
        const keysSet = new Set();
        rows.forEach(r => {
            if (r.values && typeof r.values === 'object') {
                Object.keys(r.values).forEach(k => keysSet.add(k));
            }
        });
        
        const headers = ['timestamp', 'group', ...Array.from(keysSet).sort()];

        const csvContent = [
            headers.join(","),
            ...rows.map(r => {
                const base = [
                    r.timestamp,
                    r.group
                ];
                const values = headers.slice(2).map(h => {
                    let val = r.values?.[h] ?? "";
                    if (typeof val === 'object') val = JSON.stringify(val);
                    return JSON.stringify(val);
                });
                return [...base, ...values].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `session_${session.session_id}_exp_${session.experiment_id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this session?")) return;
        setIsDeleting(true);
        const success = await deleteSession(session.session_id, session.experiment_id);
        if (success && onDelete) {
            onDelete(session.key);
        }
        setIsDeleting(false);
    };

    return (
        <Card className="mb-8 border-l-4 border-l-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-wrap items-center justify-between mb-6 border-b border-border pb-4">
                <div>
                    <h2 className="text-2xl font-bold font-mono text-text flex items-center gap-3">
                        <span className="text-secondary text-sm uppercase tracking-widest">Session</span>
                        {session.session_id}
                        <span className="text-muted/50">|</span>
                        <span className="text-primary text-sm uppercase tracking-widest">Exp</span>
                        {session.experiment_id}
                    </h2>
                    <div className="text-xs text-muted mt-1 font-mono">
                        {session.data.length} Data Points • Lat: {session.data[0]?.latitude?.toFixed(4) || 'N/A'}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={handleExportJSON} title="Export JSON">
                        <FileJson size={18} /> JSON
                    </Button>
                    <Button variant="ghost" onClick={handleExportCSV} title="Export CSV">
                        <FileSpreadsheet size={18} /> CSV
                    </Button>
                    <div className="h-6 w-px bg-white/10 mx-1"></div>
                    <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                        <Trash2 size={18} /> {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[500px]">
                <div className="min-h-0 bg-surface rounded-lg p-2 border border-border">
                    <ChartSection data={session.data} />
                </div>
                <div className="min-h-0 bg-surface rounded-lg p-2 border border-border">
                    <TableSection data={session.data} />
                </div>
            </div>
        </Card>
    );
};
