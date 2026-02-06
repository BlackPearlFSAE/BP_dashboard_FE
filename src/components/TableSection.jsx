import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, Filter } from 'lucide-react';

export const TableSection = ({ data, groupFilter }) => {
    const [filterTopic, setFilterTopic] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc' by time

    const topics = useMemo(() => {
        const t = new Set();
        data.forEach(d => {
            // Support both old topic_name format and new group-based format
            if (d.topic_name) {
                t.add(d.topic_name);
            } else {
                const group = d.original?.data?.group;
                if (!groupFilter || groupFilter.includes(group)) {
                    t.add(group);
                }
            }
        });
        return ['all', ...Array.from(t).sort()];
    }, [data, groupFilter]);

    const filteredData = useMemo(() => {
        let res = data;
        if (filterTopic !== 'all') {
            res = res.filter(d => {
                const topicName = d.topic_name || d.original?.data?.group;
                return topicName === filterTopic;
            });
        }

        return res.sort((a, b) => {
            return sortOrder === 'asc'
                ? a.timestamp - b.timestamp
                : b.timestamp - a.timestamp;
        });
    }, [data, filterTopic, sortOrder]);

    const formatValue = (item) => {
        // Check for values object
        if (item['values.x'] !== undefined) {
            return `X: ${item['values.x']?.toFixed(3)}, Y: ${item['values.y']?.toFixed(3)}, Z: ${item['values.z']?.toFixed(3)}`;
        }
        if (item.value !== undefined) {
            return typeof item.value === 'number' ? item.value.toFixed(3) : String(item.value);
        }
        if (item.latitude !== undefined) {
            return `Lat: ${item.latitude.toFixed(6)}, Lng: ${item.longitude.toFixed(6)}`;
        }
        return JSON.stringify(item.original?.data?.data || '').slice(0, 50);
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <span className="text-muted/70">RAW DATA</span>
                </h3>

                <div className="flex gap-2">
                    <select
                        className="bg-surface border border-border rounded px-2 py-1 text-xs text-text focus:border-primary outline-none transition-colors duration-300"
                        value={filterTopic}
                        onChange={e => setFilterTopic(e.target.value)}
                    >
                        {topics.map(t => <option key={t} value={t}>{t === 'all' ? 'All Topics' : t}</option>)}
                    </select>

                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="bg-surface border border-border rounded px-2 py-1 text-xs text-text hover:border-primary flex items-center gap-1 transition-colors duration-300"
                    >
                        Time {sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto border border-border rounded-lg bg-surface/30">
                <table className="w-full text-left text-xs">
                    <thead className="bg-surface sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 font-black text-accent border-b border-border tracking-wider">Time</th>
                            <th className="p-3 font-black text-accent border-b border-border tracking-wider">Topic</th>
                            <th className="p-3 font-black text-accent border-b border-border tracking-wider">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.slice(0, 500).map((row, idx) => ( // Limit rendering for perf
                            <tr key={`${row.id}-${idx}`} className="hover:bg-primary/5 border-b border-border/50 transition-colors">
                                <td className="p-2 text-text/80 whitespace-nowrap">
                                    {format(row.timestamp, 'HH:mm:ss.SS')}
                                </td>
                                <td className="p-2 text-primary font-bold whitespace-nowrap break-all">
                                    {row.topic_name}
                                </td>
                                <td className="p-2 text-text font-medium break-all">
                                    {formatValue(row)}
                                </td>
                            </tr>
                        ))}
                        {filteredData.length > 500 && (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-muted italic">
                                    ... {filteredData.length - 500} more rows hidden for performance ...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {filteredData.length === 0 && (
                    <div className="p-8 text-center text-muted">No data matches filters</div>
                )}
            </div>
        </div>
    );
};
