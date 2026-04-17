import React, { useState } from 'react';
import JSZip from 'jszip';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileJson, FileSpreadsheet, Download } from 'lucide-react';

const META_KEYS = new Set([
    'id', 'session_id', 'session_name', 'timestamp', 'createdAt', 'original', 'group'
]);

const isBMS = (group) => group && group.startsWith('bmu');

// Merge rows whose timestamps fall in the same bucket (BUCKET_MS tolerance).
// MCU groups sometimes stamp their publish tick 1-2ms apart, creating orphan
// timestamps that would otherwise produce empty rows on export.
const BUCKET_MS = 50;

const mergeByTimestamp = (data) => {
    if (!data.length) return [];
    const byBucket = new Map();
    for (const row of data) {
        const ts = row.timestamp;
        const bucket = Math.floor(ts / BUCKET_MS) * BUCKET_MS;
        if (!byBucket.has(bucket)) byBucket.set(bucket, { timestamp: ts });
        const merged = byBucket.get(bucket);
        // Keep earliest timestamp as the bucket's canonical ts
        if (ts < merged.timestamp) merged.timestamp = ts;
        for (const [k, v] of Object.entries(row)) {
            if (k === 'timestamp') continue;
            if (META_KEYS.has(k)) { merged[k] = merged[k] ?? v; continue; }
            if (v === undefined || v === null) continue;
            if (merged[k] === undefined || merged[k] === null || merged[k] === 0) {
                merged[k] = v;
            }
        }
    }
    return [...byBucket.values()].sort((a, b) => a.timestamp - b.timestamp);
};

// Split sessionData into vehicle vs BMS buckets, merge each
const splitAndMerge = (sessionData) => {
    const vehicle = [];
    const bms = [];
    for (const row of sessionData) {
        (isBMS(row.group) ? bms : vehicle).push(row);
    }
    return { vehicle: mergeByTimestamp(vehicle), bms: mergeByTimestamp(bms) };
};

// Discover all non-meta field names from merged rows
const discoverFields = (merged) => {
    const s = new Set();
    for (const row of merged) {
        for (const k of Object.keys(row)) {
            if (!META_KEYS.has(k)) s.add(k);
        }
    }
    return [...s].sort();
};

const fmtVal = (v) => {
    if (v === undefined || v === null) return '';
    if (typeof v === 'boolean') return v ? '1' : '0';
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(4);
    return String(v);
};

// Build CSV content string
const buildCSV = (merged) => {
    if (!merged.length) return null;
    const fields = discoverFields(merged);
    const cols = ['DataPoint', 'UnixTime', 'SessionTime', ...fields];
    const t0 = merged[0].timestamp;
    const rows = merged.map((row, i) => {
        const ts = row.timestamp || 0;
        return [i + 1, ts, ts - t0, ...fields.map(f => fmtVal(row[f]))].join(',');
    });
    return [cols.join(','), ...rows].join('\n');
};

// Build JSON array
const buildJSON = (merged) =>
    merged.map(d => {
        const out = { timestamp: d.timestamp };
        for (const [k, v] of Object.entries(d)) {
            if (META_KEYS.has(k)) continue;
            if (v !== undefined && v !== null) out[k] = v;
        }
        return out;
    });

// Trigger download from blob
const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const ExportControls = ({ sessionData, session }) => {
    const [exporting, setExporting] = useState(false);
    const baseName = session.name || session.session_id.slice(0, 8);

    const handleExport = async (format) => {
        if (!sessionData.length) { alert('No data to export'); return; }
        setExporting(true);

        try {
            const { vehicle, bms } = splitAndMerge(sessionData);
            const zip = new JSZip();
            const ext = format;

            if (vehicle.length) {
                const content = format === 'csv'
                    ? buildCSV(vehicle)
                    : JSON.stringify(buildJSON(vehicle), null, 2);
                zip.file(`${baseName}_vehicle.${ext}`, content);
            }

            if (bms.length) {
                const content = format === 'csv'
                    ? buildCSV(bms)
                    : JSON.stringify(buildJSON(bms), null, 2);
                zip.file(`${baseName}_bms.${ext}`, content);
            }

            const blob = await zip.generateAsync({ type: 'blob' });
            downloadBlob(blob, `${baseName}.zip`);
        } finally {
            setExporting(false);
        }
    };

    const groupCount = new Set(sessionData.map(d => d.group)).size;

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-text flex items-center gap-2">
                        <Download size={20} className="text-primary" />
                        Export Session Data
                    </h3>
                    <p className="text-sm text-muted mt-1">
                        {sessionData.length.toLocaleString()} points | {groupCount} groups |
                        Downloads as .zip (vehicle + bms)
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => handleExport('json')} disabled={exporting}>
                        <FileJson size={18} />
                        {exporting ? 'Packing...' : 'Export JSON'}
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('csv')} disabled={exporting}>
                        <FileSpreadsheet size={18} />
                        {exporting ? 'Packing...' : 'Export CSV'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
