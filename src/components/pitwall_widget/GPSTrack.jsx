import React, { useMemo } from 'react';
import { Chart as ReactChart } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

export const GPSTrack = ({ data }) => {
    const { theme } = useTheme();

    const chartData = useMemo(() => {
        const gpsPoints = data
            .filter(d => typeof d.gps_lat === 'number' && typeof d.gps_lng === 'number' && d.gps_lat !== 0)
            .sort((a, b) => a.timestamp - b.timestamp);

        if (gpsPoints.length === 0) return null;

        // Color by speed if available
        const hasSpeed = gpsPoints.some(d => typeof d.gps_speed === 'number');
        const maxSpeed = hasSpeed ? Math.max(...gpsPoints.map(d => d.gps_speed || 0), 1) : 1;

        const points = gpsPoints.map(d => ({
            x: d.gps_lng,
            y: d.gps_lat,
        }));

        // Color segments by speed
        const segmentColors = gpsPoints.map(d => {
            if (!hasSpeed) return '#FF7F11';
            const ratio = (d.gps_speed || 0) / maxSpeed;
            // Green (slow) -> Yellow -> Red (fast)
            if (ratio < 0.5) {
                const t = ratio * 2;
                return `rgb(${Math.round(t * 255)}, ${Math.round(200 + t * 55)}, 0)`;
            }
            const t = (ratio - 0.5) * 2;
            return `rgb(255, ${Math.round(255 * (1 - t))}, 0)`;
        });

        return {
            datasets: [{
                label: 'GPS Track',
                data: points,
                borderColor: segmentColors,
                backgroundColor: '#FF7F11',
                segment: {
                    borderColor: (ctx) => segmentColors[ctx.p0DataIndex] || '#FF7F11',
                },
                borderWidth: 2,
                pointRadius: 0,
                showLine: true,
                tension: 0.2,
            }, {
                // Current position dot
                label: 'Current',
                data: [points[points.length - 1]],
                borderColor: '#FF3F00',
                backgroundColor: '#FF3F00',
                pointRadius: 6,
                pointStyle: 'circle',
                showLine: false,
            }],
        };
    }, [data]);

    const textColor = theme === 'dark' ? '#e0e0e0' : '#111827';
    const gridColor = theme === 'dark' ? '#333' : '#e5e7eb';

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `Lat: ${ctx.parsed.y.toFixed(6)}, Lng: ${ctx.parsed.x.toFixed(6)}`,
                },
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Lng', color: textColor, font: { size: 10 } },
                ticks: { color: textColor, maxTicksLimit: 5, callback: (v) => v.toFixed(4) },
                grid: { color: gridColor },
            },
            y: {
                title: { display: true, text: 'Lat', color: textColor, font: { size: 10 } },
                ticks: { color: textColor, maxTicksLimit: 5, callback: (v) => v.toFixed(4) },
                grid: { color: gridColor },
            },
        },
    };

    if (!chartData) {
        return (
            <div className="flex flex-col h-full">
                <span className="text-xs font-mono text-muted uppercase tracking-wider mb-2">GPS TRACK</span>
                <div className="flex-1 flex items-center justify-center text-muted text-sm">
                    No GPS data
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <span className="text-xs font-mono text-muted uppercase tracking-wider mb-2">GPS TRACK</span>
            <div className="flex-1 min-h-0">
                <ReactChart type="scatter" data={chartData} options={options} />
            </div>
        </div>
    );
};
