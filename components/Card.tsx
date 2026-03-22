import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, onClick, className = '' }) => {
  const isInteractive = Boolean(onClick);
  const cardClasses = `
    bg-card-light dark:bg-card-dark
    backdrop-blur-xl
    border border-border-light dark:border-border-dark
    rounded-2xl
    shadow-lg
    transition-all duration-300
    hover:shadow-2xl hover:-translate-y-1
    ${isInteractive ? 'cursor-pointer touch-target' : ''}
    p-4 sm:p-6
    ${className}
  `;

  const animationProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  };

  // If interactive, expose keyboard accessibility
  if (isInteractive) {
    return (
      <motion.div
        role="button"
        tabIndex={0}
        className={cardClasses}
        onClick={onClick}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        {...animationProps}
      >
        {children}
      </motion.div>
    );
  }

  return <motion.div className={cardClasses} {...animationProps}>{children}</motion.div>;
};

export default Card;
