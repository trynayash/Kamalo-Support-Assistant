import * as React from 'react';

type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'circle'
  | 'dots'
  | 'grip-vertical'
  | 'layout-sidebar-left'
  | 'loader-2'
  | 'minus'
  | 'search'
  | 'x';

type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
};

const tablerPaths: Record<IconName, string> = {
  'arrow-left': 'M5 12l14 0;M5 12l6 6;M5 12l6 -6',
  'arrow-right': 'M5 12l14 0;M13 18l6 -6;M13 6l6 6',
  check: 'M5 12l5 5l10 -10',
  'chevron-down': 'M6 9l6 6l6 -6',
  'chevron-left': 'M15 6l-6 6l6 6',
  'chevron-right': 'M9 6l6 6l-6 6',
  'chevron-up': 'M6 15l6 -6l6 6',
  circle: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0',
  dots: 'M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  'grip-vertical': 'M8 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M8 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M8 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M14 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M14 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M14 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  'layout-sidebar-left': 'M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12;M9 4v16;M15 10l-2 2l2 2',
  'loader-2': 'M12 3a9 9 0 1 0 9 9',
  minus: 'M5 12l14 0',
  search: 'M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0;M21 21l-6 -6',
  x: 'M18 6l-12 12;M6 6l12 12',
};

function icon(name: IconName, displayName: string) {
  const Icon = ({ size, className, style, ...props }: IconProps) => (
    <svg
      className={['ti', `ti-${name}`, className].filter(Boolean).join(' ')}
      width={size ?? '1em'}
      height={size ?? '1em'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        ...(size !== undefined ? { fontSize: typeof size === 'number' ? `${size}px` : size } : {}),
        ...style,
      }}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    >
      {tablerPaths[name].split(';').map((path, index) => (
        <path key={`${name}-${index}`} d={path} />
      ))}
    </svg>
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