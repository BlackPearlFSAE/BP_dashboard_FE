import React, { useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    TimeSeriesScale,
    LineController,
    ScatterController
} from 'chart.js';
import { Chart as ReactChart } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { format } from 'date-fns';
import 'chartjs-adapter-date-fns';
import { useTheme } from '../context/ThemeContext';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    TimeSeriesScale,
    LineController,
    ScatterController,
    zoomPlugin
);

export const ChartSection = ({ data, groupFilter }) => {
    const { theme } = useTheme();

    // Extract all unique topics (filtered by groupFilter if provided)
    const topics = useMemo(() => {
        const t = new Set();
        data.forEach(d => {
            // Support both old topic_name format and new group-based format
            if (d.topic_name) {
                t.add(d.topic_name);
            } else {
                // Extract keys from flattened data
                const group = d.original?.data?.group;
                if (!groupFilter || groupFilter.includes(group)) {
                    Object.keys(d).forEach(key => {
                        if (!['id', 'session_id', 'experiment_id', 'timestamp', 'createdAt', 'original', 'topic_name', 'latitude', 'longitude'].includes(key) && typeof d[key] === 'number') {
                            t.add(key);
                        }
                    });
                }
            }
        });
        return Array.from(t).sort();
    }, [data, groupFilter]);

    const [selectedTopic, setSelectedTopic] = useState(topics.includes('gps/location') ? 'gps/location' : topics[0] || '');

    // Prepare chart data
    const chartData = useMemo(() => {
        const commonDataset = { borderWidth: 2, pointRadius: 2, tension: 0.1 };

        // New group-based format: selectedTopic is a direct numeric field on each item
        const isDirectField = data.some(d => typeof d[selectedTopic] === 'number');
        if (isDirectField) {
            const filtered = data
                .filter(d => typeof d[selectedTopic] === 'number')
                .sort((a, b) => a.timestamp - b.timestamp);
            return {
                type: 'line',
                data: {
                    datasets: [{
                        ...commonDataset,
                        label: selectedTopic,
                        data: filtered.map(d => ({ x: d.timestamp, y: d[selectedTopic] })),
                        borderColor: '#FF6b00',
                        backgroundColor: '#FF6b00',
                    }]
                }
            };
        }

        // Old topic-name format
        const filtered = data
            .filter(d => d.topic_name === selectedTopic)
            .sort((a, b) => a.timestamp - b.timestamp);

        if (selectedTopic === 'gps/location') {
            return {
                type: 'scatter',
                data: {
                    datasets: [{
                        ...commonDataset,
                        label: 'GPS Path',
                        data: filtered.map(d => ({ x: d.longitude, y: d.latitude, timestamp: d.timestamp })),
                        borderColor: '#FF6b00',
                        backgroundColor: '#FF6b00',
                        showLine: true
                    }]
                }
            };
        }

        const firstPayload = filtered[0] || {};
        let datasets = [];
        if (firstPayload['values.x'] !== undefined) {
            datasets = [
                { label: 'X', key: 'values.x', color: '#FF2400' },
                { label: 'Y', key: 'values.y', color: '#FF6b00' },
                { label: 'Z', key: 'values.z', color: '#FFA500' },
            ].map(axis => ({
                ...commonDataset,
                label: `${selectedTopic} (${axis.label})`,
                data: filtered.map(d => ({ x: d.timestamp, y: d[axis.key] })),
                borderColor: axis.color,
                backgroundColor: axis.color,
            }));
        } else if (firstPayload.value !== undefined) {
            datasets = [{
                ...commonDataset,
                label: selectedTopic,
                data: filtered.map(d => ({ x: d.timestamp, y: d.value })),
                borderColor: '#FF6b00',
                backgroundColor: '#FF6b00',
            }];
        } else {
            const key = Object.keys(firstPayload).find(k => typeof firstPayload[k] === 'number' && k !== 'timestamp' && k !== 'session_id');
            if (key) {
                datasets = [{
                    ...commonDataset,
                    label: `${selectedTopic} (${key})`,
                    data: filtered.map(d => ({ x: d.timestamp, y: d[key] })),
                    borderColor: '#FF6b00',
                    backgroundColor: '#FF6b00',
                }];
            }
        }
        return { type: 'line', data: { datasets } };

    }, [data, selectedTopic]);

    // Theme-based colors
    const textColor = theme === 'dark' ? '#e0e0e0' : '#111827';
    const gridColor = theme === 'dark' ? '#333' : '#e5e7eb';
    const tooltipBg = theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
    const tooltipText = theme === 'dark' ? '#fff' : '#000';

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                labels: { color: textColor, font: { family: 'Bricolage Grotesque', weight: 'bold' } }
            },
            zoom: {
                pan: { enabled: true, mode: 'x' },
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'x',
                    onZoomComplete: ({ chart }) => {
                        chart.options.scales.y.min = undefined;
                        chart.options.scales.y.max = undefined;
                        chart.update('none');
                    }
                },
                onPanComplete: ({ chart }) => {
                    chart.options.scales.y.min = undefined;
                    chart.options.scales.y.max = undefined;
                    chart.update('none');
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: tooltipBg,
                titleColor: '#FF6b00',
                bodyColor: tooltipText,
                borderColor: gridColor,
                borderWidth: 1,
                bodyFont: { family: 'Bricolage Grotesque' },
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toFixed(4);
                        }
                        return label;
                    }
                }
            }
        },
        scales: chartData.type === 'scatter' ? {
            x: {
                title: { display: true, text: 'Longitude', color: textColor, font: { weight: 'bold' } },
                ticks: { color: textColor },
                grid: { color: gridColor }
            },
            y: {
                title: { display: true, text: 'Latitude', color: textColor, font: { weight: 'bold' } },
                ticks: { color: textColor },
                grid: { color: gridColor }
            }
        } : {
            x: {
                type: 'time',
                time: {
                    displayFormats: {
                        millisecond: 'HH:mm:ss.SSS',
                        second: 'HH:mm:ss',
                        minute: 'HH:mm',
                        hour: 'MM/dd HH:mm',
                        day: 'MM/dd',
                        month: 'yyyy/MM',
                    }
                },
                title: { display: true, text: 'Time', color: textColor, font: { weight: 'bold' } },
                ticks: { color: textColor, maxTicksLimit: 10 },
                grid: { color: gridColor }
            },
            y: {
                title: { display: true, text: 'Value', color: textColor, font: { weight: 'bold' } },
                ticks: { color: textColor },
                grid: { color: gridColor }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    }), [chartData.type, theme, textColor, gridColor, tooltipBg, tooltipText]);


    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <span className="text-muted/70">DATA VISUALIZATION</span> // {selectedTopic.toUpperCase()}
                </h3>
                <select
                    className="bg-surface border border-border rounded px-3 py-1 text-sm text-text focus:border-primary outline-none max-w-[100px] truncate transition-colors duration-300"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                >
                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="h-[400px] w-full bg-surface/30 rounded-lg p-2 border border-border relative group cursor-crosshair">
                <ReactChart
                    type={chartData.type}
                    data={chartData.data}
                    options={options}
                    key={selectedTopic}
                />

                <div className="absolute top-4 right-4 text-xs text-muted/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Scroll to zoom • Drag to pan timeline
                </div>
            </div>
        </div>
    );
};
