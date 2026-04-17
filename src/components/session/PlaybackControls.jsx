import { useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useTelemetryConfig } from '../../context/TelemetryConfigContext';

const formatClock = (ms) => {
    if (!Number.isFinite(ms) || ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const millis = Math.floor(ms % 1000);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
};

export const PlaybackControls = ({
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    startMs,
    endMs
}) => {
    const { renderInterval } = useTelemetryConfig();
    const durationMs = Math.max(0, (endMs ?? 0) - (startMs ?? 0));
    const elapsedMs = durationMs * currentTime;

    // Auto-advance in real wall-clock time, ticking at the configured render interval
    useEffect(() => {
        if (!isPlaying || durationMs <= 0) return;

        const tickMs = Math.max(16, renderInterval || 100);
        const interval = setInterval(() => {
            setCurrentTime(prev => {
                const next = prev + tickMs / durationMs;
                if (next >= 1) {
                    setIsPlaying(false);
                    return 1;
                }
                return next;
            });
        }, tickMs);

        return () => clearInterval(interval);
    }, [isPlaying, setCurrentTime, setIsPlaying, renderInterval, durationMs]);

    const handleSkipBack = () => {
        setCurrentTime(prev => Math.max(prev - 0.1, 0));
    };

    const handleSkipForward = () => {
        setCurrentTime(prev => Math.min(prev + 0.1, 1));
    };

    const handleReset = () => {
        setCurrentTime(0);
        setIsPlaying(false);
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                {/* Progress Bar */}
                <div className="relative">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.001"
                        value={currentTime}
                        onChange={e => setCurrentTime(parseFloat(e.target.value))}
                        className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer
                                   [&::-webkit-slider-thumb]:appearance-none
                                   [&::-webkit-slider-thumb]:w-4
                                   [&::-webkit-slider-thumb]:h-4
                                   [&::-webkit-slider-thumb]:rounded-full
                                   [&::-webkit-slider-thumb]:bg-primary
                                   [&::-webkit-slider-thumb]:cursor-pointer
                                   [&::-webkit-slider-thumb]:hover:bg-primary/80
                                   [&::-webkit-slider-thumb]:transition-colors"
                    />
                    <div
                        className="absolute top-0 left-0 h-2 bg-primary rounded-lg pointer-events-none"
                        style={{ width: `${currentTime * 100}%` }}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={handleReset}
                            title="Reset to start"
                        >
                            <SkipBack size={20} />
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleSkipBack}
                            title="Skip back 10%"
                        >
                            <SkipBack size={16} />
                        </Button>

                        <Button
                            variant="primary"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-16"
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleSkipForward}
                            title="Skip forward 10%"
                        >
                            <SkipForward size={16} />
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => setCurrentTime(1)}
                            title="Skip to end"
                        >
                            <SkipForward size={20} />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted font-mono">
                            Time:
                        </span>
                        <span className="text-lg font-mono font-bold text-primary text-right tabular-nums">
                            {formatClock(elapsedMs)}
                            <span className="text-muted font-normal"> / {formatClock(durationMs)}</span>
                        </span>
                    </div>
                </div>

                <div className="text-xs text-muted text-center">
                    Use slider to scrub through timeline, or play/pause for automatic playback
                </div>
            </div>
        </Card>
    );
};
