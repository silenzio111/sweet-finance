import React, { useEffect, useState, useRef } from 'react';
import { formatMoney } from '../data/defaultData';

/**
 * Smooth Animated Number Component using requestAnimationFrame
 * with ease-out cubic curve.
 */
export function AnimatedNumber({ value, duration = 800, prefix = '', suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(Number(value) || 0);
  const startValRef = useRef(Number(value) || 0);
  const endValRef = useRef(Number(value) || 0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startValRef.current = displayValue;
    endValRef.current = Number(value) || 0;
    startTimeRef.current = null;

    let animFrameId;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = startValRef.current + (endValRef.current - startValRef.current) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValRef.current);
      }
    };

    animFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrameId);
  }, [value, duration]);

  const formatted = formatMoney(displayValue);

  return (
    <span className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
