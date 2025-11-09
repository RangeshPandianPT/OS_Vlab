import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  precision?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, precision = 0 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    if (prevValue === value) return;

    const duration = 300; // Animation duration in ms
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      
      const currentValue = prevValue + (value - prevValue) * progressRatio;
      setDisplayValue(currentValue);

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        prevValueRef.current = value;
      }
    };

    requestAnimationFrame(animate);

  }, [value]);

  return <span>{displayValue.toFixed(precision)}</span>;
};

export default AnimatedNumber;