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

    // Detect if current environment is a touch device or coarse pointer
    const isCoarse = typeof window !== 'undefined' && (
      window.matchMedia('(pointer: coarse)').matches ||
      ('ontouchstart' in window) ||
      navigator.maxTouchPoints > 0
    );

    if (isCoarse) {
      // Coarse pointer / mobile: Rely entirely on native kinetic scrolling
      return;
    }

    container.classList.add('touch-sim-active');

    const cancelInertia = () => {
      if (inertiaRafRef.current !== null) {
        cancelAnimationFrame(inertiaRafRef.current);
        inertiaRafRef.current = null;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Exclusively handle primary mouse button; touch/pen are ignored
      if (e.pointerType !== 'mouse' || e.button !== 0) return;

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
      if (!isDraggingRef.current || e.pointerType !== 'mouse') return;

      const rawDeltaY = e.clientY - startPosRef.current.y;
      const rawDeltaX = e.clientX - startPosRef.current.x;

      if (!hasMovedRef.current) {
        // 8px deadzone prevents accidental click cancellation during micro-movements
        if (Math.hypot(rawDeltaX, rawDeltaY) > 8) {
          hasMovedRef.current = true;
        }
      }

      if (hasMovedRef.current) {
        // Direct 1:1 displacement tracking without erratic multipliers
        container.scrollTop = startPosRef.current.scrollTop - rawDeltaY;

        const now = performance.now();
        const history = velocityHistoryRef.current;
        history.push({ y: e.clientY, time: now });

        // Maintain a rolling 100ms sample window
        const cutoff = now - 100;
        while (history.length > 0 && history[0].time < cutoff) {
          history.shift();
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current || e.pointerType !== 'mouse') return;
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

        // Check for staleness: if the pointer paused (> 60ms) before release, momentum is zero
        if (history.length >= 2) {
          const lastSample = history[history.length - 1];
          const firstSample = history[0];
          const pauseDuration = now - lastSample.time;

          if (pauseDuration <= 60) {
            const dt = lastSample.time - firstSample.time;
            if (dt >= 12) {
              const vy = (lastSample.y - firstSample.y) / dt; // px/ms

              // Flick threshold: minimum 0.15 px/ms
              if (Math.abs(vy) > 0.15) {
                // Clamped velocity limit (max 2.5 px/ms)
                const clampedVy = Math.max(-2.5, Math.min(2.5, vy));
                let currentStep = clampedVy * 16;

                const momentumStep = () => {
                  currentStep *= 0.92;
                  container.scrollTop -= currentStep;
                  if (Math.abs(currentStep) > 0.5) {
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
    container.addEventListener('wheel', cancelInertia, { passive: true });

    return () => {
      cancelInertia();
      container.classList.remove('touch-sim-active', 'touch-sim-dragging');
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
      container.removeEventListener('click', handleClickCapture, true);
      container.removeEventListener('wheel', cancelInertia);
    };
  }, [enabled]);

  return containerRef;
}
