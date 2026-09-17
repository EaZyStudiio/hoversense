import { useEffect, useRef } from 'react';

interface UseTouchDragScrollOptions {
  enabled: boolean;
}

export function useTouchDragScroll<T extends HTMLElement>(
  options: UseTouchDragScrollOptions,
  externalRef?: React.RefObject<T | null>
) {
  const internalRef = useRef<T | null>(null);
  const containerRef = externalRef || internalRef;
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0, scrollTop: 0 });
  const hasMovedRef = useRef(false);
  const velocityHistoryRef = useRef<{ y: number; time: number }[]>([]);
  const inertiaRafRef = useRef<number | null>(null);

  const { enabled } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.classList.add('touch-sim-active');

    const cancelInertia = () => {
      if (inertiaRafRef.current !== null) {
        cancelAnimationFrame(inertiaRafRef.current);
        inertiaRafRef.current = null;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      cancelInertia();
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollTop: container.scrollTop,
      };
      velocityHistoryRef.current = [{ y: e.clientY, time: performance.now() }];
      container.classList.add('touch-sim-dragging');

      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const rawDeltaY = e.clientY - startPosRef.current.y;
      const deltaX = e.clientX - startPosRef.current.x;

      if (!hasMovedRef.current && (Math.abs(rawDeltaY) > 3 || Math.abs(deltaX) > 3)) {
        hasMovedRef.current = true;
      }

      if (hasMovedRef.current) {
        // Fast, natural mobile touch drag multiplier (1.75x)
        const amplifiedDeltaY = rawDeltaY * 1.75;
        container.scrollTop = startPosRef.current.scrollTop - amplifiedDeltaY;

        const now = performance.now();
        const history = velocityHistoryRef.current;
        history.push({ y: e.clientY, time: now });
        if (history.length > 8) history.shift();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      container.classList.remove('touch-sim-dragging');

      try {
        if (container.hasPointerCapture(e.pointerId)) {
          container.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }

      if (hasMovedRef.current) {
        const history = velocityHistoryRef.current;
        const now = performance.now();
        // Sample recent samples in the last 100ms for accurate flick velocity
        const recent = history.filter((pt) => now - pt.time < 120);
        const sampleStart = recent[0] || history[0];
        const sampleEnd = history[history.length - 1];

        if (sampleStart && sampleEnd) {
          const dt = sampleEnd.time - sampleStart.time;
          if (dt > 8) {
            const vy = (sampleEnd.y - sampleStart.y) / dt; // px/ms
            if (Math.abs(vy) > 0.10) {
              // High-momentum iOS-style flick physics: 75x impulse, 0.955 soft decay
              let currentVelocity = vy * 75;
              const momentumStep = () => {
                currentVelocity *= 0.955;
                container.scrollTop -= currentVelocity;
                if (Math.abs(currentVelocity) > 0.35) {
                  inertiaRafRef.current = requestAnimationFrame(momentumStep);
                } else {
                  inertiaRafRef.current = null;
                }
              };
              inertiaRafRef.current = requestAnimationFrame(momentumStep);
            }
          }
        }
      }
    };

    const handleClickCapture = (e: MouseEvent) => {
      if (hasMovedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        hasMovedRef.current = false;
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);
    container.addEventListener('click', handleClickCapture, true);

    return () => {
      cancelInertia();
      container.classList.remove('touch-sim-active', 'touch-sim-dragging');
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
      container.removeEventListener('click', handleClickCapture, true);
    };
  }, [enabled]);

  return containerRef;
}
