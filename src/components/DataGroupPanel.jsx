import React, { useMemo } from 'react';
import { Card } from './ui/Card';
import { ChartSection } from './ChartSection';
import { TableSection } from './TableSection';

export const DataGroupPanel = ({ title, groups, data, icon, description }) => {
    // Filter data by group names
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const group = item.original?.data?.group;
            return group && groups.includes(group);
        });
    }, [data, groups]);

    return (
        <Card className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                {icon}
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-text">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted mt-1">{description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted font-mono">
                        {filteredData.length} data points
                    </span>
                    <div className={`h-2 w-2 rounded-full ${filteredData.length > 0 ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                </div>
            </div>

            {filteredData.length === 0 ? (
                <div className="flex items-center justify-center h-100 text-muted">
                    <div className="text-center">
                        <p className="text-lg mb-2">No data available</p>
                        <p className="text-sm">Waiting for telemetry data...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div>
                        <ChartSection data={filteredData} groupFilter={groups} />
                    </div>
                    <div>
                        <TableSection data={filteredData} groupFilter={groups} />
                    </div>
                </div>
            )}
        </Card>
    );
};
