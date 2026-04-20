import { useMemo, useState } from 'react';
import { TimeSeriesChart } from './chart/TimeSeriesChart';
import { displayName } from '../utils/sensorDisplayNames';

const META_KEYS = new Set([
    'id', 'session_id', 'session_name', 'experiment_id', 'timestamp',
    'createdAt', 'original', 'topic_name', 'group', 'latitude', 'longitude',
]);

export const ChartSection = ({ data, groupFilter, playheadMs, t0 }) => {
    // Discover numeric keys present in the data (filtered by groupFilter).
    const topics = useMemo(() => {
        const t = new Set();
        for (const d of data) {
            const group = d.group || d.original?.data?.group;
            if (groupFilter && !groupFilter.includes(group)) continue;
            for (const k of Object.keys(d)) {
                if (META_KEYS.has(k)) continue;
                if (typeof d[k] === 'number') t.add(k);
            }
        }
        return Array.from(t).sort();
    }, [data, groupFilter]);

    const [selectedTopic, setSelectedTopic] = useState('');
    const effectiveTopic = selectedTopic && topics.includes(selectedTopic)
        ? selectedTopic
        : (topics[0] || '');

    const series = useMemo(() => {
        if (!effectiveTopic) return [];
        return [{ key: effectiveTopic, label: displayName(effectiveTopic), color: '#FF6b00' }];
    }, [effectiveTopic]);

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <span className="text-muted/70">DATA VISUALIZATION</span> // {displayName(effectiveTopic).toUpperCase()}
                </h3>
                <select
                    className="bg-surface border border-border rounded px-3 py-1 text-sm text-text focus:border-primary outline-none max-w-[100px] truncate transition-colors duration-300"
                    value={effectiveTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                >
                    {topics.map(t => <option key={t} value={t}>{displayName(t)}</option>)}
                </select>
            </div>

            <div className="w-full bg-surface/30 rounded-lg p-2 border border-border">
                <TimeSeriesChart
                    data={data}
                    series={series}
                    defaultWindowSec={30}
                    playheadMs={playheadMs}
                    t0={t0}
                    height="h-[400px]"
                    key={effectiveTopic}
                />
            </div>
        </div>
    );
};
