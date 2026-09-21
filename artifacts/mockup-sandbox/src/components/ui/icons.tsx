import * as React from 'react';

type IconProps = React.HTMLAttributes<HTMLElement> & {
  size?: number | string;
};

function icon(name: string, displayName: string) {
  const Icon = ({ size, className, style, ...props }: IconProps) => (
    <i
      className={['ti', `ti-${name}`, className].filter(Boolean).join(' ')}
      style={{
        ...(size !== undefined ? { fontSize: typeof size === 'number' ? `${size}px` : size } : {}),
        ...style,
      }}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    />
  );
  Icon.displayName = displayName;
  return Icon;
}

export const ArrowLeft = icon('arrow-left', 'ArrowLeft');
export const ArrowRight = icon('arrow-right', 'ArrowRight');
export const Check = icon('check', 'Check');
export const ChevronDown = icon('chevron-down', 'ChevronDown');
export const ChevronDownIcon = ChevronDown;
export const ChevronLeft = icon('chevron-left', 'ChevronLeft');
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRight = icon('chevron-right', 'ChevronRight');
export const ChevronRightIcon = ChevronRight;
export const ChevronUp = icon('chevron-up', 'ChevronUp');
export const Circle = icon('circle', 'Circle');
export const GripVertical = icon('grip-vertical', 'GripVertical');
export const Loader2Icon = icon('loader-2', 'Loader2Icon');
export const Minus = icon('minus', 'Minus');
export const MoreHorizontal = icon('dots', 'MoreHorizontal');
export const PanelLeftIcon = icon('layout-sidebar-left', 'PanelLeftIcon');
export const Search = icon('search', 'Search');
export const X = icon('x', 'X');