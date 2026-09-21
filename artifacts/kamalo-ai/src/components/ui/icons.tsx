import {
  KamaloIcon,
  type KamaloIconProps,
} from '@/components/kamalo-icons';

const alias = (name: KamaloIconProps['name'], displayName: string) => {
  const Icon = ({ ...props }: Omit<KamaloIconProps, 'name'>) => <KamaloIcon name={name} {...props} />;
  Icon.displayName = displayName;
  return Icon;
};

export const ArrowLeft = alias('arrow-left', 'ArrowLeft');
export const ArrowRight = alias('arrow-right', 'ArrowRight');
export const Check = alias('check', 'Check');
export const ChevronDown = alias('chevron-down', 'ChevronDown');
export const ChevronDownIcon = ChevronDown;
export const ChevronLeft = alias('chevron-left', 'ChevronLeft');
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRight = alias('chevron-right', 'ChevronRight');
export const ChevronRightIcon = ChevronRight;
export const ChevronUp = alias('chevron-up', 'ChevronUp');
export const Circle = alias('circle', 'Circle');
export const GripVertical = alias('grip-vertical', 'GripVertical');
export const Loader2Icon = alias('loader-2', 'Loader2Icon');
export const Minus = alias('minus', 'Minus');
export const MoreHorizontal = alias('dots', 'MoreHorizontal');
export const PanelLeftIcon = alias('layout-sidebar-left', 'PanelLeftIcon');
export const Search = alias('search', 'Search');
export const X = alias('x', 'X');