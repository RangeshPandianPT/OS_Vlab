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
    relative overflow-hidden
    bg-card-light dark:bg-card-dark
    backdrop-blur-xl
    border border-border-light dark:border-border-dark
    rounded-2xl
    shadow-lg
    transition-colors duration-300
    ${isInteractive ? 'cursor-pointer touch-target group' : ''}
    p-4 sm:p-6
    ${className}
  `;

  // Base entrance animation
  const motionProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.25, 0.8, 0.25, 1] },
    ...(isInteractive && {
      whileHover: { y: -6, scale: 1.01 },
      whileTap: { scale: 0.98 }
    })
  };

  const renderContent = () => (
    <>
      {/* Interactive Cyber-Glow overlay */}
      {isInteractive && (
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/0 via-accent/0 to-accent/0 group-hover:from-accent/5 group-hover:to-neon-blue/10 dark:group-hover:from-accent/10 dark:group-hover:to-neon-cyan/20 transition-all duration-500 rounded-2xl pointer-events-none" />
      )}
      {/* Border glow on hover */}
      {isInteractive && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-transparent group-hover:ring-accent/30 dark:group-hover:ring-accent/50 transition-all duration-500 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </>
  );

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
        {...motionProps}
      >
        {renderContent()}
      </motion.div>
    );
  }

  return <motion.div className={cardClasses} {...motionProps}>{renderContent()}</motion.div>;
};

export default Card;
