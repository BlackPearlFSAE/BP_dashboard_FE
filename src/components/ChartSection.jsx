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
    BarController,
    ScatterController,
    BarElement,
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
    BarController,
    ScatterController,
    BarElement,
    zoomPlugin
);

export const ChartSection = ({ data }) => {
    const { theme } = useTheme();

    // Extract all unique groups
    const groups = useMemo(() => getAvailableGroups(data), [data]);

    const [selectedGroup, setSelectedGroup] = useState(groups[0] || '');
    const [selectedValues, setSelectedValues] = useState([]);
    const [chartType, setChartType] = useState('line'); // 'line' or 'bar'

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

        if (filtered.length === 0) return { type: chartType, data: { datasets: [] } };

        const commonDataset = {
            borderWidth: 2,
            pointRadius: chartType === 'bar' ? 0 : 2,
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
            backgroundColor: chartType === 'bar' ? getColor(idx) : getColor(idx),
            spanGaps: true,
        }));

        return {
            type: chartType,
            data: { datasets }
        };
    }, [data, selectedGroup, selectedValues, chartType]);

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

    // --- Selective Download Logic ---
    const handleDownload = (format) => {
        const filtered = data
            .filter(d => d.group === selectedGroup)
            .sort((a, b) => a.timestamp - b.timestamp);

        if (filtered.length === 0 || selectedValues.length === 0) {
            alert("No data to download!");
            return;
        }

        const dataToExport = filtered.map(item => {
            const row = { timestamp: item.timestamp };
            selectedValues.forEach(key => {
                row[key] = item.values?.[key];
            });
            return row;
        });

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
            triggerDownload(blob, `chart_data_${selectedGroup}.json`);
        } else if (format === 'csv') {
            const headers = ['timestamp', ...selectedValues];
            const csvContent = [
                headers.join(","),
                ...dataToExport.map(row =>
                    headers.map(h => {
                        let val = row[h] ?? "";
                        if (typeof val === 'object') val = JSON.stringify(val);
                        return val;
                    }).join(",")
                )
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv" });
            triggerDownload(blob, `chart_data_${selectedGroup}.csv`);
        }
    };

    const triggerDownload = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full space-y-4">
            <div className="border-b border-border pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
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

                    <div className="flex items-center gap-2">
                        {/* Chart Type Selector */}
                        <div className="flex items-center bg-surface border border-border rounded overflow-hidden">
                            <button
                                onClick={() => setChartType('line')}
                                className={`px-3 py-1 text-xs font-bold transition-colors ${chartType === 'line' ? 'bg-primary text-white' : 'text-text hover:bg-white/5'}`}
                            >
                                Line
                            </button>
                            <button
                                onClick={() => setChartType('bar')}
                                className={`px-3 py-1 text-xs font-bold transition-colors ${chartType === 'bar' ? 'bg-primary text-white' : 'text-text hover:bg-white/5'}`}
                            >
                                Bar
                            </button>
                        </div>

                        {/* Download Buttons */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleDownload('json')}
                                className="px-3 py-1 bg-surface border border-border rounded text-xs text-text hover:border-primary transition-colors flex items-center gap-1"
                                title="Download Visible JSON"
                            >
                                ↓ JSON
                            </button>
                            <button
                                onClick={() => handleDownload('csv')}
                                className="px-3 py-1 bg-surface border border-border rounded text-xs text-text hover:border-primary transition-colors flex items-center gap-1"
                                title="Download Visible CSV"
                            >
                                ↓ CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Value Selection Multi-Select */}
                <div className="flex flex-wrap gap-2">
                    {availableValues.map(valueKey => (
                        <button
                            key={valueKey}
                            onClick={() => toggleValueSelection(valueKey)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${selectedValues.includes(valueKey)
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
                            key={`${selectedGroup}-${chartType}`}
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
