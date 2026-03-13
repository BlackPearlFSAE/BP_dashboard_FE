import React, { useRef } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Upload, Pause, Play, RefreshCw, Clock, FlaskConical } from 'lucide-react';

export const ControlPanel = ({
    interval,
    setInterval,
    isAutoUpdate,
    setIsAutoUpdate,
    onManualUpdate,
    onFileUpload,
    onLoadMock,
    uploadStatus
}) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(file);
            // Reset input so same file can be selected again if needed
            e.target.value = '';
        }
    };

    return (
        <div className="sticky top-0 z-50 p-4 bg-background/90 backdrop-blur-lg border-b border-border mb-6 transition-colors duration-300">
            <div className="flex flex-wrap items-center gap-4 justify-between max-w-[1920px] mx-auto">

                {/* Left Side: Brand & Interval */}
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        BPDV <span className="text-xs font-sans font-normal text-muted opacity-50 ml-1">v2.0</span>
                    </h1>

                    <div className="flex items-center gap-2 bg-surface p-2 rounded border border-border transition-colors duration-300">
                        <Clock size={16} className="text-primary" />
                        <span className="text-xs text-muted uppercase font-bold">Update Rate (s)</span>
                        <input
                            type="number"
                            value={interval}
                            onChange={(e) => setInterval(Number(e.target.value))}
                            className="w-16 bg-background border border-border rounded px-2 py-1 text-sm text-center font-mono focus:border-primary outline-none text-text transition-colors duration-300"
                            min="0.5"
                            step="0.5"
                        />
                    </div>
                </div>

                {/* Right Side: Actions */}
                <div className="flex items-center gap-3">

                    {/* File Upload */}
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".json,.csv"
                            onChange={handleFileChange}
                        />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload size={16} /> Import JSON/CSV
                        </Button>
                        {uploadStatus && <span className="text-xs text-green-400 animate-pulse">{uploadStatus}</span>}
                    </div>

                    <Button variant="outline" onClick={onLoadMock}>
                        <FlaskConical size={16} /> Mock Data
                    </Button>

                    <div className="h-6 w-px bg-white/10 mx-2"></div>

                    {/* Controls */}
                    <Button
                        variant={isAutoUpdate ? 'danger' : 'success'}
                        onClick={() => setIsAutoUpdate(!isAutoUpdate)}
                    >
                        {isAutoUpdate ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Auto</>}
                    </Button>

                    <Button variant="primary" onClick={onManualUpdate}>
                        <RefreshCw size={16} /> Update Now
                    </Button>
                </div>

            </div>
        </div>
    );
};
