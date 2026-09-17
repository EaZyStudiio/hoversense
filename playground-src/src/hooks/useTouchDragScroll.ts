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

      const deltaY = e.clientY - startPosRef.current.y;
      const deltaX = e.clientX - startPosRef.current.x;

      if (!hasMovedRef.current && (Math.abs(deltaY) > 4 || Math.abs(deltaX) > 4)) {
        hasMovedRef.current = true;
      }

      if (hasMovedRef.current) {
        container.scrollTop = startPosRef.current.scrollTop - deltaY;

        const now = performance.now();
        const history = velocityHistoryRef.current;
        history.push({ y: e.clientY, time: now });
        if (history.length > 5) history.shift();
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
        if (history.length >= 2) {
          const first = history[0];
          const last = history[history.length - 1];
          const dt = last.time - first.time;
          if (dt > 10 && dt < 200) {
            const vy = (last.y - first.y) / dt;
            if (Math.abs(vy) > 0.15) {
              let currentVelocity = vy * 14;
              const momentumStep = () => {
                currentVelocity *= 0.91;
                container.scrollTop -= currentVelocity;
                if (Math.abs(currentVelocity) > 0.4) {
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
