import * as React from 'react';
import { cn } from '@/lib/utils';

type KamaloActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'quiet';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

/**
 * KAMALO's action button keeps the useful part of the supplied EclipseButton
 * idea—a quiet pointer-aware highlight—without the magnetic movement, noise
 * texture, uppercase tracking, or inverted spotlight that makes a support
 * product feel like a generic AI demo.
 */
export const KamaloActionButton = React.forwardRef<HTMLButtonElement, KamaloActionButtonProps>(
  (
    {
      children,
      className,
      disabled,
      isLoading = false,
      leftIcon,
      onPointerLeave,
      onPointerMove,
      rightIcon,
      size = 'default',
      style,
      variant = 'primary',
      ...props
    },
    ref,
  ) => {
    const [pointer, setPointer] = React.useState({ x: 50, y: 50 });

    const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'touch' || disabled || isLoading) {
        onPointerMove?.(event);
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      setPointer({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      onPointerMove?.(event);
    };

    const handlePointerLeave = (event: React.PointerEvent<HTMLButtonElement>) => {
      setPointer({ x: 50, y: 50 });
      onPointerLeave?.(event);
    };

    return (
      <button
        {...props}
        ref={ref}
        type={props.type ?? 'button'}
        disabled={disabled || isLoading}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={cn(
          'kamalo-action-button',
          `kamalo-action-button-${variant}`,
          `kamalo-action-button-${size}`,
          (disabled || isLoading) && 'kamalo-action-button-disabled',
          className,
        )}
        style={{
          '--kamalo-pointer-x': `${pointer.x}px`,
          '--kamalo-pointer-y': `${pointer.y}px`,
          ...style,
        } as React.CSSProperties}
      >
        <span className="kamalo-action-button-glow" aria-hidden="true" />
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {isLoading ? <span className="kamalo-action-button-loader" aria-hidden="true" /> : leftIcon}
          {children}
          {!isLoading && rightIcon}
        </span>
      </button>
    );
  },
);

KamaloActionButton.displayName = 'KamaloActionButton';