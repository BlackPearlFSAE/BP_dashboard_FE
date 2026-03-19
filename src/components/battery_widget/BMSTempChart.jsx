import React, { useMemo } from 'react';
import { Chart as ReactChart } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

export const BMSTempChart = ({ data }) => {
    const { theme } = useTheme();

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { datasets: [] };

        // TEMP_SENSE is array[2]
        const tempSeries = [0, 1].map(i => {
            const tempData = data
                .map(d => ({
                    x: d.timestamp,
                    y: d[`TEMP_SENSE.${i}`]
                }))
                .filter(point => point.y !== undefined && point.y !== null);

            return {
                label: `Temperature Sensor ${i}`,
                data: tempData,
                borderColor: i === 0 ? '#FF6b00' : '#FFA500',
                backgroundColor: i === 0 ? '#FF6b00' : '#FFA500',
                borderWidth: 2,
                pointRadius: 2,
                tension: 0.1,
            };
        }).filter(series => series.data.length > 0);

        return { datasets: tempSeries };
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
                position: 'top',
                labels: {
                    color: textColor,
                    font: { family: 'Bricolage Grotesque', weight: 'bold' }
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
                    text: 'Temperature (°C)',
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
            <div className="h-[300px] flex items-center justify-center text-muted">
                <p>No temperature data available</p>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full relative group cursor-crosshair">
            <ReactChart type="line" data={chartData} options={options} />
            <div className="absolute top-4 right-4 text-xs text-muted/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Scroll to zoom • Drag to pan timeline
            </div>
        </div>
    );
};
