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
import { getAvailableGroups, getValuesForGroup } from '../utils/dataProcessor';

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

export const ChartSection = ({ data }) => {
    const { theme } = useTheme();

    // Extract all unique groups
    const groups = useMemo(() => getAvailableGroups(data), [data]);

    const [selectedGroup, setSelectedGroup] = useState(groups[0] || '');
    const [selectedValues, setSelectedValues] = useState([]);

    // Get available value keys for the selected group
    const availableValues = useMemo(() => {
        if (!selectedGroup) return [];
        return getValuesForGroup(data, selectedGroup);
    }, [data, selectedGroup]);

    // Initialize selected values when group changes
    useMemo(() => {
        if (availableValues.length > 0 && selectedValues.length === 0) {
            setSelectedValues([availableValues[0]]);
        }
    }, [availableValues, selectedValues]);

    // Generate color palette for multiple series
    const colors = [
        '#FF6b00', // primary (Orange)
        '#FF2400', // accent (Red-Orange)
        '#FFA500', // secondary (Yellow)
        '#00D9FF', // cyan
        '#7C3AED', // purple
        '#EC4899', // pink
        '#10B981', // green
        '#F59E0B', // amber
    ];

    const getColor = (index) => colors[index % colors.length];

    // Prepare chart data with multi-value support
    const chartData = useMemo(() => {
        const filtered = data.filter(d => d.group === selectedGroup);
        filtered.sort((a, b) => a.timestamp - b.timestamp);

        if (filtered.length === 0) return { type: 'line', data: { datasets: [] } };

        const commonDataset = {
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.1,
        };

        const datasets = selectedValues.map((valueKey, idx) => ({
            ...commonDataset,
            label: `${selectedGroup} (${valueKey})`,
            data: filtered.map(d => ({ 
                x: d.timestamp, 
                y: d.values?.[valueKey] 
            })),
            borderColor: getColor(idx),
            backgroundColor: getColor(idx),
            spanGaps: true,
        }));

        return {
            type: 'line',
            data: { datasets }
        };
    }, [data, selectedGroup, selectedValues]);

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
                pan: { enabled: true, mode: 'xy' },
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }
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
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            label += typeof context.parsed.y === 'boolean' 
                                ? context.parsed.y 
                                : context.parsed.y.toFixed(4);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'second',
                    displayFormats: { second: 'HH:mm:ss' }
                },
                title: { display: true, text: 'Time', color: textColor, font: { weight: 'bold' } },
                ticks: { color: textColor },
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
    }), [theme, textColor, gridColor, tooltipBg, tooltipText]);

    const toggleValueSelection = (valueKey) => {
        setSelectedValues(prev => {
            if (prev.includes(valueKey)) {
                return prev.filter(v => v !== valueKey);
            } else {
                return [...prev, valueKey];
            }
        });
    };

    return (
        <div className="w-full space-y-4">
            <div className="border-b border-border pb-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <span className="text-muted/70">DATA VISUALIZATION</span> // {selectedGroup.toUpperCase()}
                    </h3>
                    <select
                        className="bg-surface border border-border rounded px-3 py-1 text-sm text-text focus:border-primary outline-none transition-colors duration-300"
                        value={selectedGroup}
                        onChange={(e) => {
                            setSelectedGroup(e.target.value);
                            setSelectedValues([]);
                        }}
                    >
                        {groups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>

                {/* Value Selection Multi-Select */}
                <div className="flex flex-wrap gap-2">
                    {availableValues.map(valueKey => (
                        <button
                            key={valueKey}
                            onClick={() => toggleValueSelection(valueKey)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                selectedValues.includes(valueKey)
                                    ? 'bg-primary text-white border border-primary'
                                    : 'bg-surface border border-border text-text hover:border-primary'
                            }`}
                        >
                            {valueKey}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[400px] w-full bg-surface/30 rounded-lg p-2 border border-border relative group cursor-crosshair">
                {chartData.data.datasets.length > 0 ? (
                    <>
                        <ReactChart
                            type={chartData.type}
                            data={chartData.data}
                            options={options}
                            key={selectedGroup}
                        />
                        <div className="absolute top-4 right-4 text-xs text-muted/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Scroll to zoom • Drag to pan
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted">
                        Select a value to display chart
                    </div>
                )}
            </div>
        </div>
    );
};
