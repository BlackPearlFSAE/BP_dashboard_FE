import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { FileJson, FileSpreadsheet, Download } from 'lucide-react';

export const ExportControls = ({ sessionData, session }) => {
    const handleExportJSON = () => {
        const rawRows = sessionData.map(d => d.original || d);
        const blob = new Blob([JSON.stringify(rawRows, null, 2)], {
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

        // Resolve a field value from a merged row using possible key names
        const resolveField = (row, csvCol) => {
            const candidates = FIELD_MAP[csvCol];
            if (!candidates) return 0;
            for (const key of candidates) {
                if (row[key] !== undefined && row[key] !== null) return row[key];
            }
            return 0;
        };

        // Merge data points by timestamp (group points within 50ms window)
        const sorted = [...sessionData].sort((a, b) => a.timestamp - b.timestamp);
        const merged = [];
        let current = { ...sorted[0] };

        for (let i = 1; i < sorted.length; i++) {
            const row = sorted[i];
            if (Math.abs(row.timestamp - current.timestamp) <= 50) {
                // Merge fields from same time window
                for (const [k, v] of Object.entries(row)) {
                    if (k !== 'original' && k !== 'id' && (current[k] === undefined || current[k] === null)) {
                        current[k] = v;
                    }
                }
            } else {
                merged.push(current);
                current = { ...row };
            }
        }
        merged.push(current);

        // Compute SessionTime relative to first timestamp
        const firstTimestamp = merged[0].timestamp;

        // Format number: use fixed decimals matching the reference format
        const fmt = (val, decimals) => {
            const num = Number(val);
            if (isNaN(num)) return '0.' + '0'.repeat(decimals);
            return num.toFixed(decimals);
        };

        const csvRows = merged.map((row, idx) => {
            const unixTime = row.timestamp || 0;
            const sessionTime = unixTime - firstTimestamp;

            return [
                idx + 1,                                    // DataPoint
                unixTime,                                   // UnixTime
                sessionTime,                                // SessionTime
                fmt(resolveField(row, 'Wheel_RPM_Left'), 2),
                fmt(resolveField(row, 'Wheel_RPM_Right'), 2),
                fmt(resolveField(row, 'Stroke1_mm'), 2),
                fmt(resolveField(row, 'Stroke2_mm'), 2),
                fmt(resolveField(row, 'GPS_Lat'), 4),
                fmt(resolveField(row, 'GPS_Lng'), 4),
                fmt(resolveField(row, 'GPS_Age'), 2),
                fmt(resolveField(row, 'GPS_Course'), 2),
                fmt(resolveField(row, 'GPS_Speed'), 2),
                fmt(resolveField(row, 'IMU_AccelX'), 3),
                fmt(resolveField(row, 'IMU_AccelY'), 3),
                fmt(resolveField(row, 'IMU_AccelZ'), 3),
                fmt(resolveField(row, 'IMU_GyroX'), 3),
                fmt(resolveField(row, 'IMU_GyroY'), 3),
                fmt(resolveField(row, 'IMU_GyroZ'), 3),
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
