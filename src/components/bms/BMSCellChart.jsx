import React, { useMemo } from 'react';
import { Chart as ReactChart } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

const CELL_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
];

export const BMSCellChart = ({ data }) => {
    const { theme } = useTheme();

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { datasets: [] };

        // V_CELL is array[10], plot all 10 cells over time
        const cellSeries = Array.from({ length: 10 }, (_, i) => {
            const cellData = data
                .map(d => ({
                    x: d.timestamp,
                    y: d[`V_CELL.${i}`] // flattened by dataProcessor
                }))
                .filter(point => point.y !== undefined && point.y !== null);

            return {
                label: `Cell ${i}`,
                data: cellData,
                borderColor: CELL_COLORS[i],
                backgroundColor: CELL_COLORS[i],
                borderWidth: 2,
                pointRadius: 1,
                tension: 0.1,
            };
        }).filter(series => series.data.length > 0);

        return { datasets: cellSeries };
    }, [data]);

    const textColor = theme === 'dark' ? '#e0e0e0' : '#111827';
    const gridColor = theme === 'dark' ? '#333' : '#e5e7eb';

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                display: true,
                position: 'right',
                labels: {
                    color: textColor,
                    font: { family: 'Bricolage Grotesque', size: 11 }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                titleColor: '#FF6b00',
                bodyColor: textColor,
                borderColor: gridColor,
                borderWidth: 1,
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
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'second',
                    displayFormats: { second: 'HH:mm:ss' }
                },
                title: {
                    display: true,
                    text: 'Time',
                    color: textColor,
                    font: { weight: 'bold' }
                },
                ticks: { color: textColor },
                grid: { color: gridColor }
            },
            y: {
                title: {
                    display: true,
                    text: 'Voltage (V)',
                    color: textColor,
                    font: { weight: 'bold' }
                },
                ticks: { color: textColor },
                grid: { color: gridColor }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    if (chartData.datasets.length === 0) {
        return (
            <div className="h-[400px] flex items-center justify-center text-muted">
                <p>No cell voltage data available</p>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full relative group cursor-crosshair">
            <ReactChart type="line" data={chartData} options={options} />
            <div className="absolute top-4 right-4 text-xs text-muted/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Scroll to zoom • Drag to pan timeline
            </div>
        </div>
    );
};
