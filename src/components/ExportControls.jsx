import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { FileJson, FileSpreadsheet, Download } from 'lucide-react';

// Merge data points by timestamp (group points within a time window)
// Prefers non-null, non-zero values when merging
const mergeByTimestamp = (data, windowMs = 100) => {
    if (!data.length) return [];

    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
    const merged = [];
    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i++) {
        const row = sorted[i];
        if (Math.abs(row.timestamp - current.timestamp) <= windowMs) {
            for (const [k, v] of Object.entries(row)) {
                if (k === 'original' || k === 'id') continue;
                // Overwrite if current value is missing or zero but new value is real
                if (v !== undefined && v !== null && v !== 0) {
                    if (current[k] === undefined || current[k] === null || current[k] === 0) {
                        current[k] = v;
                    }
                }
            }
        } else {
            merged.push(current);
            current = { ...row };
        }
    }
    merged.push(current);
    return merged;
};

export const ExportControls = ({ sessionData, session }) => {
    const handleExportJSON = () => {
        const merged = mergeByTimestamp(sessionData);
        const rows = merged.map(d => {
            const values = {};
            for (const [k, v] of Object.entries(d)) {
                if (['id', 'session_id', 'timestamp', 'createdAt', 'original'].includes(k)) continue;
                if (v !== undefined && v !== null) values[k] = v;
            }
            return {
                timestamp: d.timestamp,
                session_id: d.session_id,
                createdAt: d.createdAt,
                ...values
            };
        });
        const blob = new Blob([JSON.stringify(rows, null, 2)], {
            type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${session.name || session.session_id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        if (!sessionData.length) {
            alert('No data to export');
            return;
        }

        // Define columns matching the telemetry CSV format
        const CSV_COLUMNS = [
            'DataPoint', 'UnixTime', 'SessionTime',
            'Wheel_RPM_Left', 'Wheel_RPM_Right',
            'Stroke1_mm', 'Stroke2_mm',
            'GPS_Lat', 'GPS_Lng', 'GPS_Age', 'GPS_Course', 'GPS_Speed',
            'IMU_AccelX', 'IMU_AccelY', 'IMU_AccelZ',
            'IMU_GyroX', 'IMU_GyroY', 'IMU_GyroZ'
        ];

        // Field mapping: CSV column -> possible keys in normalized data
        const FIELD_MAP = {
            Wheel_RPM_Left: ['Wheel_RPM_Left', 'wheel_rpm_left', 'RPM_Left', 'rpm_left'],
            Wheel_RPM_Right: ['Wheel_RPM_Right', 'wheel_rpm_right', 'RPM_Right', 'rpm_right'],
            Stroke1_mm: ['Stroke1_mm', 'stroke1_mm', 'Stroke1', 'stroke1'],
            Stroke2_mm: ['Stroke2_mm', 'stroke2_mm', 'Stroke2', 'stroke2'],
            GPS_Lat: ['GPS_Lat', 'gps_lat', 'lat', 'Lat', 'latitude'],
            GPS_Lng: ['GPS_Lng', 'gps_lng', 'lng', 'Lng', 'longitude'],
            GPS_Age: ['GPS_Age', 'gps_age'],
            GPS_Course: ['GPS_Course', 'gps_course', 'course'],
            GPS_Speed: ['GPS_Speed', 'gps_speed', 'speed'],
            IMU_AccelX: ['IMU_AccelX', 'imu_accelx', 'AccelX', 'accel_x', 'ax'],
            IMU_AccelY: ['IMU_AccelY', 'imu_accely', 'AccelY', 'accel_y', 'ay'],
            IMU_AccelZ: ['IMU_AccelZ', 'imu_accelz', 'AccelZ', 'accel_z', 'az'],
            IMU_GyroX: ['IMU_GyroX', 'imu_gyrox', 'GyroX', 'gyro_x', 'gx'],
            IMU_GyroY: ['IMU_GyroY', 'imu_gyroy', 'GyroY', 'gyro_y', 'gy'],
            IMU_GyroZ: ['IMU_GyroZ', 'imu_gyroz', 'GyroZ', 'gyro_z', 'gz'],
        };

        const resolveField = (row, csvCol) => {
            const candidates = FIELD_MAP[csvCol];
            if (!candidates) return null;
            for (const key of candidates) {
                if (row[key] !== undefined && row[key] !== null) return row[key];
            }
            return null;
        };

        // Merge data points within 100ms window
        const merged = mergeByTimestamp(sessionData, 100);

        // Fill forward: carry last known value for fields that are still null
        const lastKnown = {};
        for (const row of merged) {
            for (const col of Object.keys(FIELD_MAP)) {
                const val = resolveField(row, col);
                if (val !== null && val !== 0) {
                    lastKnown[col] = val;
                }
            }
        }

        const firstTimestamp = merged[0].timestamp;

        const fmt = (val, decimals) => {
            if (val === null || val === undefined) return '';
            const num = Number(val);
            if (isNaN(num)) return '';
            return num.toFixed(decimals);
        };

        const csvRows = merged.map((row, idx) => {
            const unixTime = row.timestamp || 0;
            const sessionTime = unixTime - firstTimestamp;

            return [
                idx + 1,
                unixTime,
                sessionTime,
                fmt(resolveField(row, 'Wheel_RPM_Left'), 2),
                fmt(resolveField(row, 'Wheel_RPM_Right'), 2),
                fmt(resolveField(row, 'Stroke1_mm'), 2),
                fmt(resolveField(row, 'Stroke2_mm'), 2),
                fmt(resolveField(row, 'GPS_Lat'), 6),
                fmt(resolveField(row, 'GPS_Lng'), 6),
                fmt(resolveField(row, 'GPS_Age'), 2),
                fmt(resolveField(row, 'GPS_Course'), 2),
                fmt(resolveField(row, 'GPS_Speed'), 2),
                fmt(resolveField(row, 'IMU_AccelX'), 4),
                fmt(resolveField(row, 'IMU_AccelY'), 4),
                fmt(resolveField(row, 'IMU_AccelZ'), 4),
                fmt(resolveField(row, 'IMU_GyroX'), 4),
                fmt(resolveField(row, 'IMU_GyroY'), 4),
                fmt(resolveField(row, 'IMU_GyroZ'), 4),
            ].join(',');
        });

        const csvContent = [CSV_COLUMNS.join(','), ...csvRows].join('\n');

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${session.name || session.session_id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-text flex items-center gap-2">
                        <Download size={20} className="text-primary" />
                        Export Session Data
                    </h3>
                    <p className="text-sm text-muted mt-1">
                        Download session data in JSON or CSV format
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExportJSON}>
                        <FileJson size={18} />
                        Export JSON
                    </Button>
                    <Button variant="outline" onClick={handleExportCSV}>
                        <FileSpreadsheet size={18} />
                        Export CSV
                    </Button>
                </div>
            </div>
        </Card>
    );
};
