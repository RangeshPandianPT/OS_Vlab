import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  hideDetails?: boolean;
}

// Splits className into padding utilities (with optional responsive prefix) and everything else.
// Padding utilities found in className become the inner content padding,
// replacing the default so passing className="p-4" never double-pads.
function splitPaddingClasses(className: string): { paddingClasses: string; otherClasses: string } {
  const paddingRe = /\b(?:(?:2xl|xl|lg|md|sm|xs):)?(?:p[xytrblse]?)-\S+/g;
  const paddingClasses = (className.match(paddingRe) ?? []).join(' ');
  const otherClasses = className.replace(paddingRe, '').replace(/\s+/g, ' ').trim();
  return { paddingClasses, otherClasses };
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', elevated = false, hideDetails = false, children, style, ...props }, ref) => {

    const { paddingClasses, otherClasses } = splitPaddingClasses(className);

    // Screw-corner gradient for the industrial aesthetic
    const screwGradient = `
      radial-gradient(circle at 12px 12px, rgba(0,0,0,0.15) 2px, transparent 3px),
      radial-gradient(circle at calc(100% - 12px) 12px, rgba(0,0,0,0.15) 2px, transparent 3px),
      radial-gradient(circle at 12px calc(100% - 12px), rgba(0,0,0,0.15) 2px, transparent 3px),
      radial-gradient(circle at calc(100% - 12px) calc(100% - 12px), rgba(0,0,0,0.15) 2px, transparent 3px)
    `;

    const combinedStyle = !hideDetails
      ? { backgroundImage: screwGradient, ...style }
      : style;

    // When the user supplies padding in className, honour it exactly.
    // Otherwise fall back to the design-system defaults.
    const innerPadding = paddingClasses
      ? paddingClasses
      : hideDetails
        ? 'p-6'
        : 'p-6 pt-8 md:p-8 md:pt-10';

    return (
      <div
        ref={ref}
        className={`relative bg-background flex flex-col rounded-2xl border border-white/40 transition-all duration-300 ${
          elevated
            ? 'shadow-floating -translate-y-1'
            : 'shadow-card hover:-translate-y-1 hover:shadow-floating'
        } ${otherClasses}`}
        style={combinedStyle as React.CSSProperties}
        {...props}
      >
        {/* Machine vent slots — only shown when !hideDetails */}
        {!hideDetails && (
          <div className="absolute top-4 right-4 flex gap-1 pointer-events-none z-10">
            <div className="h-4 w-1 rounded-full bg-muted shadow-recessed" />
            <div className="h-4 w-1 rounded-full bg-muted shadow-recessed" />
            <div className="h-4 w-1 rounded-full bg-muted shadow-recessed" />
          </div>
        )}

        <div className={`flex flex-col flex-1 ${innerPadding} min-h-0`}>
          {children}
        </div>
      </div>
    );
  }
);
Card.displayName = 'Card';
