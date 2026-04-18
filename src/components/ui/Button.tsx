import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', style, children, ...props }, ref) => {
    // Base layout & typography matching Industrial Skeuomorphism
    const baseClass = "inline-flex items-center justify-center uppercase font-bold tracking-[0.05em] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";
    
    const sizeClasses = {
      sm: "h-10 px-4 text-xs rounded-md",
      md: "h-12 px-6 text-sm rounded-lg md:min-h-[48px]", // Touch target min 48px
      lg: "h-14 px-8 text-base rounded-xl"
    };

    const variantClasses = {
      primary: "bg-accent text-accent-fg shadow-card hover:brightness-110 active:translate-y-[2px] active:shadow-pressed border border-white/20",
      secondary: "bg-background text-text-primary shadow-card hover:text-accent active:translate-y-[2px] active:shadow-pressed",
      ghost: "bg-transparent text-text-muted hover:bg-muted hover:shadow-recessed active:translate-y-[2px]"
    };

    // Red-tinted shadows for primary buttons
    const customStyle = variant === 'primary' ? { 
      '--shadow-dark': 'rgba(166,50,60,0.4)', 
      '--shadow-light': 'rgba(255,100,110,0.4)',
      ...style 
    } : style;

    return (
      <button
        ref={ref}
        className={`${baseClass} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        style={customStyle as React.CSSProperties}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
