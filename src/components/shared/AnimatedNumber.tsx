import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  precision?: number;
  className?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  precision = 0,
  className = '',
}) => {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(value);
  const DURATION = 600; // ms

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return (
    <span className={className}>
      {display.toFixed(precision)}
    </span>
  );
};

export default AnimatedNumber;
