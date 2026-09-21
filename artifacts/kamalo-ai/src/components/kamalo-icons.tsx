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

export type KamaloIconProps = Omit<React.SVGProps<SVGSVGElement>, 'color'> & {
  name: KamaloIconName;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
};

const tablerPaths: Record<KamaloIconName, string> = {
  'alert-circle': 'M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0;M12 8v4;M12 16h.01',
  archive: 'M3 6a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2;M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10;M10 12l4 0',
  'arrow-left': 'M5 12l14 0;M5 12l6 6;M5 12l6 -6',
  'arrow-right': 'M5 12l14 0;M13 18l6 -6;M13 6l6 6',
  'arrow-up-right': 'M17 7l-10 10;M8 7l9 0l0 9',
  backspace: 'M20 6a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-11l-5 -5a1.5 1.5 0 0 1 0 -2l5 -5l11 0;M12 10l4 4m0 -4l-4 4',
  'book-2': 'M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12;M19 16h-12a2 2 0 0 0 -2 2;M9 8h6',
  check: 'M5 12l5 5l10 -10',
  'chevron-down': 'M6 9l6 6l6 -6',
  'chevron-left': 'M15 6l-6 6l6 6',
  'chevron-right': 'M9 6l6 6l-6 6',
  'chevron-up': 'M6 15l6 -6l6 6',
  circle: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0',
  'circle-check': 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0;M9 12l2 2l4 -4',
  clipboard: 'M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2;M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2',
  clock: 'M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0;M12 7v5l3 3',
  cpu: 'M5 6a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1l0 -12;M9 9h6v6h-6l0 -6;M3 10h2;M3 14h2;M10 3v2;M14 3v2;M21 10h-2;M21 14h-2;M14 21v-2;M10 21v-2',
  dots: 'M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  edit: 'M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1;M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415;M16 5l3 3',
  'file-plus': 'M14 3v4a1 1 0 0 0 1 1h4;M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2;M12 11l0 6;M9 14l6 0',
  filter: 'M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227',
  'grip-vertical': 'M8 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M8 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M8 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M14 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M14 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0;M14 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  'hand-stop': 'M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5;M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5;M14 5.5a1.5 1.5 0 0 1 3 0v6.5;M17 7.5a1.5 1.5 0 1 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47',
  inbox: 'M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12;M4 13h3l3 3h4l3 -3h3',
  language: 'M9 6.371c0 4.418 -2.239 6.629 -5 6.629;M4 6.371h7;M5 9c0 2.144 2.252 3.908 6 4;M12 20l4 -9l4 9;M19.1 18h-6.2;M6.694 3l.793 .582',
  'layout-sidebar-left': 'M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12;M9 4v16;M15 10l-2 2l2 2',
  lifebuoy: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0;M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0;M15 15l3.35 3.35;M9 15l-3.35 3.35;M5.65 5.65l3.35 3.35;M18.35 5.65l-3.35 3.35',
  'loader-2': 'M12 3a9 9 0 1 0 9 9',
  mail: 'M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10;M3 7l9 6l9 -6',
  messages: 'M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10;M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2',
  'menu-2': 'M4 6l16 0;M4 12l16 0;M4 18l16 0',
  microphone: 'M9 5a3 3 0 0 1 3 -3a3 3 0 0 1 3 3v5a3 3 0 0 1 -3 3a3 3 0 0 1 -3 -3l0 -5;M5 10a7 7 0 0 0 14 0;M8 21l8 0;M12 17l0 4',
  minus: 'M5 12l14 0',
  paperclip: 'M15 7l-6.5 6.5a1.5 1.5 0 0 0 3 3l6.5 -6.5a3 3 0 0 0 -6 -6l-6.5 6.5a4.5 4.5 0 0 0 9 9l6.5 -6.5',
  'player-stop': 'M5 7a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l0 -10',
  plus: 'M12 5l0 14;M5 12l14 0',
  refresh: 'M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4;M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4',
  search: 'M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0;M21 21l-6 -6',
  'send-2': 'M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124;M6.5 12h14.5',
  'shield-check': 'M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06;M15 19l2 2l4 -4',
  sparkles: 'M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6',
  'thumb-down': 'M7 13v-8a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v7a1 1 0 0 0 1 1h3a4 4 0 0 1 4 4v1a2 2 0 0 0 4 0v-5h3a2 2 0 0 0 2 -2l-1 -5a2 3 0 0 0 -2 -2h-7a3 3 0 0 0 -3 3',
  'thumb-up': 'M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3',
  trash: 'M4 7l16 0;M10 11l0 6;M14 11l0 6;M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12;M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3',
  x: 'M18 6l-12 12;M6 6l12 12',
};

export const KamaloIcon = React.forwardRef<SVGSVGElement, KamaloIconProps>(
  ({ name, size, color, className, style, strokeWidth = 2, ...props }, ref) => (
    <svg
      ref={ref}
      className={cn('ti', `ti-${name}`, className)}
      width={size ?? '1em'}
      height={size ?? '1em'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        ...(size !== undefined ? { fontSize: typeof size === 'number' ? `${size}px` : size } : {}),
        ...(color ? { color } : {}),
        ...style,
      }}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    >
      {tablerPaths[name].split(';').map((path, index) => (
        <path key={`${name}-${index}`} d={path} />
      ))}
    </svg>
  ),
);

KamaloIcon.displayName = 'KamaloIcon';

function createKamaloIcon(name: KamaloIconName, displayName: string) {
  const Icon = React.forwardRef<SVGSVGElement, Omit<KamaloIconProps, 'name'>>((props, ref) => (
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
