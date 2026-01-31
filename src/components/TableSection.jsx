import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { getAvailableGroups } from '../utils/dataProcessor';

export const TableSection = ({ data }) => {
    const [filterGroup, setFilterGroup] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc' by time

    const groups = useMemo(() => {
        const g = getAvailableGroups(data);
        return ['all', ...g];
    }, [data]);

    const filteredData = useMemo(() => {
        let res = data;
        if (filterGroup !== 'all') {
            res = res.filter(d => d.group === filterGroup);
        }

        return res.sort((a, b) => {
            return sortOrder === 'asc'
                ? a.timestamp - b.timestamp
                : b.timestamp - a.timestamp;
        });
    }, [data, filterGroup, sortOrder]);

    const formatValue = (item) => {
        // Format values object
        if (item.values && typeof item.values === 'object') {
            return Object.entries(item.values)
                .map(([key, val]) => {
                    if (typeof val === 'number') return `${key}: ${val.toFixed(3)}`;
                    return `${key}: ${val}`;
                })
                .join(' | ');
        }
        return 'N/A';
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
                        value={filterGroup}
                        onChange={e => setFilterGroup(e.target.value)}
                    >
                        {groups.map(g => <option key={g} value={g}>{g === 'all' ? 'All Groups' : g}</option>)}
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
                            <th className="p-3 font-black text-accent border-b border-border tracking-wider">Group</th>
                            <th className="p-3 font-black text-accent border-b border-border tracking-wider">Values</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.slice(0, 500).map((row, idx) => ( // Limit rendering for perf
                            <tr key={`${row.id}-${idx}`} className="hover:bg-primary/5 border-b border-border/50 transition-colors">
                                <td className="p-2 text-text/80 whitespace-nowrap">
                                    {format(row.timestamp, 'HH:mm:ss.SS')}
                                </td>
                                <td className="p-2 text-primary font-bold whitespace-nowrap">
                                    {row.group}
                                </td>
                                <td className="p-2 text-text font-medium break-all text-xs">
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
