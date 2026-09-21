import { Path, Svg } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

export type KamaloIconName =
  | 'alert-circle'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'arrow-up'
  | 'book-open'
  | 'check'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-up'
  | 'clock'
  | 'cpu'
  | 'globe'
  | 'home'
  | 'image'
  | 'inbox'
  | 'life-buoy'
  | 'loader'
  | 'mic'
  | 'menu'
  | 'message-circle'
  | 'message-square'
  | 'paperclip'
  | 'plus'
  | 'refresh-cw'
  | 'search'
  | 'send'
  | 'square'
  | 'star'
  | 'thumbs-down'
  | 'thumbs-up'
  | 'trash-2'
  | 'upload'
  | 'x';

const paths: Record<KamaloIconName, string[]> = {
  'alert-circle': ['M12 8v4', 'M12 16h.01', 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18'],
  'arrow-right': ['M5 12h14', 'M13 6l6 6l-6 6'],
  'arrow-up-right': ['M7 17L17 7', 'M8 7h9v9'],
  'arrow-up': ['M12 19V5', 'M5 12l7-7l7 7'],
  'book-open': ['M3 5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z', 'M21 5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v16a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2z'],
  check: ['M5 12l4 4L19 6'],
  'chevron-down': ['M6 9l6 6l6-6'],
  'chevron-right': ['M9 6l6 6l-6 6'],
  'chevron-up': ['M6 15l6-6l6 6'],
  clock: ['M12 7v5l3 3', 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18'],
  cpu: ['M9 3v2', 'M15 3v2', 'M9 19v2', 'M15 19v2', 'M5 9H3', 'M5 15H3', 'M21 9h-2', 'M21 15h-2', 'M7 7h10v10H7z'],
  globe: ['M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0', 'M3.6 9h16.8', 'M3.6 15h16.8', 'M12 3c2 2.4 3 5.4 3 9s-1 6.6-3 9c-2-2.4-3-5.4-3-9s1-6.6 3-9'],
  home: ['M3 11l9-8l9 8', 'M5 10v10h14V10', 'M9 20v-6h6v6'],
  image: ['M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M8 9a1 1 0 1 0 0 .01', 'M4 16l4-4l4 4l3-3l5 5'],
  inbox: ['M4 13h4l2 3h4l2-3h4', 'M4 13l1-8h14l1 8', 'M5 19h14'],
  'life-buoy': ['M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18', 'M8.5 8.5l-4 4', 'M15.5 8.5l4 4', 'M8.5 15.5l-4-4', 'M15.5 15.5l4-4', 'M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6'],
  loader: ['M12 3v3', 'M12 18v3', 'M3 12h3', 'M18 12h3', 'M5.6 5.6l2.1 2.1', 'M16.3 16.3l2.1 2.1', 'M18.4 5.6l-2.1 2.1', 'M7.7 16.3l-2.1 2.1'],
  mic: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3', 'M5 11a7 7 0 0 0 14 0', 'M12 18v4', 'M8 22h8'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  'message-circle': ['M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H11l-5 4v-4.5A3 3 0 0 1 4 12z'],
  'message-square': ['M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-4 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  paperclip: ['M8 13l5.5-5.5a3 3 0 0 1 4.2 4.2L11 18.4a5 5 0 0 1-7.1-7.1l7-7', 'M8 13l5-5'],
  plus: ['M12 5v14', 'M5 12h14'],
  'refresh-cw': ['M20 11a8 8 0 0 0-14.7-3L3 11', 'M3 4v7h7', 'M4 13a8 8 0 0 0 14.7 3L21 13', 'M21 20v-7h-7'],
  search: ['M11 19a8 8 0 1 0 0-16a8 8 0 0 0 0 16', 'M21 21l-4.3-4.3'],
  send: ['M4 4l16 8l-16 8l3-8z', 'M7 12h13'],
  square: ['M5 5h14v14H5z'],
  star: ['M12 3l2.8 5.7l6.2.9l-4.5 4.4l1.1 6.2L12 17.3l-5.6 2.9l1.1-6.2L3 9.6l6.2-.9z'],
  'thumbs-down': ['M7 10v10', 'M4 10h3V4H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1', 'M7 10h8.8a2 2 0 0 1 1.9 2.5l-1.2 4.5A4 4 0 0 1 13.6 20H7'],
  'thumbs-up': ['M7 14V4', 'M4 14h3v6H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1', 'M7 14h8.8a2 2 0 0 0 1.9-2.5l-1.2-4.5A4 4 0 0 0 13.6 4H7'],
  'trash-2': ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
  upload: ['M12 16V4', 'M7 9l5-5l5 5', 'M5 20h14'],
  x: ['M6 6l12 12', 'M6 18L18 6'],
};

export function KamaloIcon({
  name,
  size = 18,
  color = '#173d43',
  style,
  accessibilityLabel,
}: {
  name: KamaloIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {paths[name].map((path, index) => (
        <Path
          key={`${name}-${index}`}
          d={path}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}