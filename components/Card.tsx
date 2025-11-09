
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, onClick, className = '' }) => {
  const cardClasses = `
    bg-card-light dark:bg-card-dark 
    backdrop-blur-xl 
    border border-border-light dark:border-border-dark 
    rounded-2xl 
    shadow-lg 
    transition-all duration-300 
    hover:shadow-2xl hover:-translate-y-1
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
