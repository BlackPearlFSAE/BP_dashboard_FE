import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { FileJson, FileSpreadsheet, Download } from 'lucide-react';

export const ExportControls = ({ sessionData, session }) => {
    const handleExportJSON = () => {
        const rawRows = sessionData.map(d => d.original || d);
        const blob = new Blob([JSON.stringify(rawRows, null, 2)], {
            type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${session.name || session.session_id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const rows = sessionData;
        if (!rows.length) {
            alert('No data to export');
            return;
        }

        const keysSet = new Set();
        rows.forEach(r => {
            Object.keys(r).forEach(k => {
                if (k !== 'original') keysSet.add(k);
            });
        });
        const headers = Array.from(keysSet).sort();

        const csvContent = [
            headers.join(","),
            ...rows.map(r => headers.map(h => {
                let val = r[h] ?? "";
                if (typeof val === 'object') val = JSON.stringify(val);
                return JSON.stringify(val);
            }).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${session.name || session.session_id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-text flex items-center gap-2">
                        <Download size={20} className="text-primary" />
                        Export Session Data
                    </h3>
                    <p className="text-sm text-muted mt-1">
                        Download session data in JSON or CSV format
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExportJSON}>
                        <FileJson size={18} />
                        Export JSON
                    </Button>
                    <Button variant="outline" onClick={handleExportCSV}>
                        <FileSpreadsheet size={18} />
                        Export CSV
                    </Button>
                </div>
            </div>
        </Card>
    );
};
