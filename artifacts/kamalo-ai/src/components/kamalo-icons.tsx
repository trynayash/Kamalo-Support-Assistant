import * as React from 'react';
import { cn } from '@/lib/utils';

export type KamaloIconName =
  | 'alert-circle'
  | 'archive'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'backspace'
  | 'book-2'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'circle'
  | 'circle-check'
  | 'clipboard'
  | 'clock'
  | 'cpu'
  | 'dots'
  | 'edit'
  | 'file-plus'
  | 'filter'
  | 'grip-vertical'
  | 'hand-stop'
  | 'inbox'
  | 'language'
  | 'layout-sidebar-left'
  | 'lifebuoy'
  | 'loader-2'
  | 'mail'
  | 'messages'
  | 'menu-2'
  | 'microphone'
  | 'minus'
  | 'paperclip'
  | 'player-stop'
  | 'plus'
  | 'refresh'
  | 'search'
  | 'send-2'
  | 'shield-check'
  | 'sparkles'
  | 'thumb-down'
  | 'thumb-up'
  | 'trash'
  | 'x';

export type KamaloIconProps = Omit<React.HTMLAttributes<HTMLElement>, 'color'> & {
  name: KamaloIconName;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
};

export const KamaloIcon = React.forwardRef<HTMLElement, KamaloIconProps>(
  ({ name, size, color, className, style, strokeWidth: _strokeWidth, ...props }, ref) => (
    <i
      ref={ref as React.Ref<HTMLElement>}
      className={cn('ti', `ti-${name}`, className)}
      style={{
        ...(size !== undefined ? { fontSize: typeof size === 'number' ? `${size}px` : size } : {}),
        ...(color ? { color } : {}),
        ...style,
      }}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    />
  ),
);

KamaloIcon.displayName = 'KamaloIcon';

function createKamaloIcon(name: KamaloIconName, displayName: string) {
  const Icon = React.forwardRef<HTMLElement, Omit<KamaloIconProps, 'name'>>((props, ref) => (
    <KamaloIcon ref={ref} name={name} {...props} />
  ));
  Icon.displayName = displayName;
  return Icon;
}

export const HiOutlineArchiveBox = createKamaloIcon('archive', 'HiOutlineArchiveBox');
export const HiOutlineArrowLeft = createKamaloIcon('arrow-left', 'HiOutlineArrowLeft');
export const HiOutlineArrowPath = createKamaloIcon('refresh', 'HiOutlineArrowPath');
export const HiOutlineArrowUpRight = createKamaloIcon('arrow-up-right', 'HiOutlineArrowUpRight');
export const HiOutlineBackspace = createKamaloIcon('backspace', 'HiOutlineBackspace');
export const HiOutlineBars3 = createKamaloIcon('menu-2', 'HiOutlineBars3');
export const HiOutlineBookOpen = createKamaloIcon('book-2', 'HiOutlineBookOpen');
export const HiOutlineChatBubbleLeftRight = createKamaloIcon('messages', 'HiOutlineChatBubbleLeftRight');
export const HiOutlineCheck = createKamaloIcon('check', 'HiOutlineCheck');
export const HiOutlineCheckCircle = createKamaloIcon('circle-check', 'HiOutlineCheckCircle');
export const HiOutlineChevronDown = createKamaloIcon('chevron-down', 'HiOutlineChevronDown');
export const HiOutlineClipboardDocument = createKamaloIcon('clipboard', 'HiOutlineClipboardDocument');
export const HiOutlineClock = createKamaloIcon('clock', 'HiOutlineClock');
export const HiOutlineCpuChip = createKamaloIcon('cpu', 'HiOutlineCpuChip');
export const HiOutlineDocumentPlus = createKamaloIcon('file-plus', 'HiOutlineDocumentPlus');
export const HiOutlineEnvelope = createKamaloIcon('mail', 'HiOutlineEnvelope');
export const HiOutlineExclamationCircle = createKamaloIcon('alert-circle', 'HiOutlineExclamationCircle');
export const HiOutlineFunnel = createKamaloIcon('filter', 'HiOutlineFunnel');
export const HiOutlineHandRaised = createKamaloIcon('hand-stop', 'HiOutlineHandRaised');
export const HiOutlineHandThumbDown = createKamaloIcon('thumb-down', 'HiOutlineHandThumbDown');
export const HiOutlineHandThumbUp = createKamaloIcon('thumb-up', 'HiOutlineHandThumbUp');
export const HiOutlineInboxStack = createKamaloIcon('inbox', 'HiOutlineInboxStack');
export const HiOutlineLanguage = createKamaloIcon('language', 'HiOutlineLanguage');
export const HiOutlineLifebuoy = createKamaloIcon('lifebuoy', 'HiOutlineLifebuoy');
export const HiOutlineMagnifyingGlass = createKamaloIcon('search', 'HiOutlineMagnifyingGlass');
export const HiOutlineMicrophone = createKamaloIcon('microphone', 'HiOutlineMicrophone');
export const HiOutlinePaperAirplane = createKamaloIcon('send-2', 'HiOutlinePaperAirplane');
export const HiOutlinePaperClip = createKamaloIcon('paperclip', 'HiOutlinePaperClip');
export const HiOutlinePencilSquare = createKamaloIcon('edit', 'HiOutlinePencilSquare');
export const HiOutlinePlus = createKamaloIcon('plus', 'HiOutlinePlus');
export const HiOutlineShieldCheck = createKamaloIcon('shield-check', 'HiOutlineShieldCheck');
export const HiOutlineSparkles = createKamaloIcon('sparkles', 'HiOutlineSparkles');
export const HiOutlineStop = createKamaloIcon('player-stop', 'HiOutlineStop');
export const HiOutlineTrash = createKamaloIcon('trash', 'HiOutlineTrash');
export const HiOutlineXMark = createKamaloIcon('x', 'HiOutlineXMark');
