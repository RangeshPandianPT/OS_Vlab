
import React from 'react';

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

  // If interactive, expose keyboard accessibility
  if (isInteractive) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cardClasses}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {children}
      </div>
    );
  }

  return <div className={cardClasses}>{children}</div>;
};

export default Card;
