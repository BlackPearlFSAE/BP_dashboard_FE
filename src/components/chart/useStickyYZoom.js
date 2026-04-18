import { useEffect, useRef, useState } from 'react';

const ZOOM_FACTOR = 1.1;

export const useStickyYZoom = (containerRef, chartRef) => {
    const [stickyY, setStickyY] = useState(null);
    const stickyRef = useRef(stickyY);
    stickyRef.current = stickyY;

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e) => {
            if (!e.shiftKey) return;
            const chart = chartRef.current;
            if (!chart) return;
            e.preventDefault();

            const yScale = chart.scales.y;
            if (!yScale) return;

            const rect = el.getBoundingClientRect();
            const cursorY = yScale.getValueForPixel(e.clientY - rect.top);
            const current = stickyRef.current ?? { min: yScale.min, max: yScale.max };

            const factor = e.deltaY > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
            const newMin = cursorY - (cursorY - current.min) * factor;
            const newMax = cursorY + (current.max - cursorY) * factor;
            setStickyY({ min: newMin, max: newMax });
        };

        const onDblClick = () => setStickyY(null);

        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('dblclick', onDblClick);
        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('dblclick', onDblClick);
        };
    }, [containerRef, chartRef]);

    return [stickyY, setStickyY];
};
