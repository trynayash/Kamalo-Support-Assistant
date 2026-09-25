import React from 'react';
import { Path, Svg } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

export type KamaloIconName =
  | 'alert-circle'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'arrow-up'
  | 'book-open'
  | 'check'
  | 'check-circle'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-up'
  | 'clock'
  | 'copy'
  | 'cpu'
  | 'database'
  | 'edit'
  | 'edit-3'
  | 'external-link'
  | 'eye'
  | 'eye-off'
  | 'globe'
  | 'home'
  | 'image'
  | 'inbox'
  | 'info'
  | 'life-buoy'
  | 'loader'
  | 'maximize'
  | 'mic'
  | 'menu'
  | 'message-circle'
  | 'message-square'
  | 'paperclip'
  | 'pause'
  | 'plus'
  | 'refresh-cw'
  | 'search'
  | 'send'
  | 'shield'
  | 'sliders'
  | 'sparkles'
  | 'square'
  | 'star'
  | 'sun'
  | 'moon'
  | 'thumbs-down'
  | 'thumbs-up'
  | 'trash-2'
  | 'upload'
  | 'user'
  | 'x';

const paths: Record<KamaloIconName, string[]> = {
  'alert-circle': ['M12 8v4', 'M12 16h.01', 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18'],
  'arrow-right': ['M5 12h14', 'M13 6l6 6l-6 6'],
  'arrow-up-right': ['M7 17L17 7', 'M8 7h9v9'],
  'arrow-up': ['M12 19V5', 'M5 12l7-7l7 7'],
  'book-open': ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  check: ['M20 6 9 17l-5-5'],
  'check-circle': ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 12 14.01l-3-3'],
  'chevron-down': ['M6 9l6 6l6-6'],
  'chevron-right': ['M9 6l6 6l-6 6'],
  'chevron-up': ['M6 15l6-6l6 6'],
  clock: ['M12 6v6l4 2', 'M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20'],
  copy: ['M9 15h11a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2z', 'M5 9H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1'],
  cpu: ['M9 3v2', 'M15 3v2', 'M9 19v2', 'M15 19v2', 'M5 9H3', 'M5 15H3', 'M21 9h-2', 'M21 15h-2', 'M7 7h10v10H7z'],
  database: ['M12 3c4.97 0 9 1.34 9 3v12c0 1.66-4.03 3-9 3s-9-1.34-9-3V6c0-1.66 4.03-3 9-3z', 'M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3', 'M3 6c0 1.66 4.03 3 9 3s9-1.34 9-3'],
  edit: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  'edit-3': ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'],
  'external-link': ['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14 21 3'],
  eye: ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
  'eye-off': ['M9.88 9.88a3 3 0 1 0 4.24 4.24', 'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68', 'M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61', 'm2 2 20 20'],
  globe: ['M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0', 'M3.6 9h16.8', 'M3.6 15h16.8', 'M12 3c2 2.4 3 5.4 3 9s-1 6.6-3 9c-2-2.4-3-5.4-3-9s1-6.6 3-9'],
  home: ['M3 10.5 12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22v-6h6v6'],
  image: ['M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M8.5 10a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3', 'm21 15-5-5L5 21'],
  inbox: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'],
  info: ['M12 8h.01', 'M11 12h1v4h1', 'M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20'],
  'life-buoy': ['M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20', 'm4.93 4.93 4.24 4.24', 'm14.83 9.17 4.24-4.24', 'm14.83 14.83 4.24 4.24', 'm9.17 14.83-4.24 4.24', 'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8'],
  loader: ['M12 2v4', 'M12 18v4', 'm4.93 4.93 2.83 2.83', 'm16.24 16.24 2.83 2.83', 'M2 12h4', 'M18 12h4', 'm4.93 19.07 2.83-2.83', 'm16.24 7.76 2.83-2.83'],
  maximize: ['M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3'],
  mic: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3', 'M8 22h8'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  'message-circle': ['M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'],
  'message-square': ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  paperclip: ['m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'],
  pause: ['M6 4h4v16H6z', 'M14 4h4v16h-4z'],
  plus: ['M12 5v14', 'M5 12h14'],
  'refresh-cw': ['M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16', 'M16 21h5v-5'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16', 'm21 21-4.35-4.35'],
  send: ['m22 2-7 20-4-9-9-4z', 'M22 2 11 13'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  sliders: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'],
  sparkles: ['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z', 'M20 3v4', 'M22 5h-4'],
  square: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z'],
  star: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  sun: [
    'M12 2v2',
    'M12 20v2',
    'm4.93 4.93 1.41 1.41',
    'm17.66 17.66 1.41 1.41',
    'M2 12h2',
    'M20 12h2',
    'm6.34 17.66-1.41 1.41',
    'm19.07 4.93-1.41 1.41',
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  ],
  moon: [
    'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z',
  ],
  // Authentic Lucide Thumbs Up & Thumbs Down:
  'thumbs-up': [
    'M7 10v12',
    'M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z',
  ],
  'thumbs-down': [
    'M17 14V2',
    'M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z',
  ],
  'trash-2': ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', 'M10 11v6', 'M14 11v6'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
};

export function KamaloIcon({
  name,
  size = 18,
  color = 'currentColor',
  filled = false,
  style,
  accessibilityLabel,
}: {
  name: KamaloIconName;
  size?: number;
  color?: string;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const iconPaths = paths[name] || paths['alert-circle'] || [];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {iconPaths.map((pathD, index) => (
        <Path
          key={`${name}-${index}`}
          d={pathD}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={filled ? color : 'none'}
        />
      ))}
    </Svg>
  );
}