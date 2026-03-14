import React, { useRef } from 'react';
import { Button } from './ui/Button';
import { Upload, FlaskConical } from 'lucide-react';

export const ControlPanel = ({
    onFileUpload,
    onLoadMock,
    uploadStatus
}) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(file);
            e.target.value = '';
        }
    };

    return (
        <div className="sticky top-0 z-50 p-4 bg-background/90 backdrop-blur-lg border-b border-border mb-6 transition-colors duration-300">
            <div className="flex flex-wrap items-center gap-4 justify-between max-w-[1920px] mx-auto">

                {/* Left Side: Brand */}
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        BPDV <span className="text-xs font-sans font-normal text-muted opacity-50 ml-1">v2.0</span>
                    </h1>
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
                </div>

            </div>
        </div>
    );
};
