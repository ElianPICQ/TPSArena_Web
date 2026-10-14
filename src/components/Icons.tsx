import type { SVGProps } from 'react';
import type { Platform } from '../lib/platforms';

type IconProps = SVGProps<SVGSVGElement>;

function Svg(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}

export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12M7 10l5 5 5-5M4 19h16" />
  </Svg>
);
export const CopyIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Svg>
);
export const CameraIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const ChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const ChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);
export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

// Pictogrammes génériques des systèmes (pas de logos de marque).
const WindowsGlyph = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 5.5l7.5-1v7H3zM12.5 4.2L21 3v8.5h-8.5zM3 12.5h7.5v7L3 18.5zM12.5 12.5H21V21l-8.5-1.2z" />
  </Svg>
);
const LinuxGlyph = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="4" width="19" height="16" rx="2" />
    <path d="M6.5 9l3 3-3 3M12 15h5" />
  </Svg>
);
const MacGlyph = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
  </Svg>
);

export function PlatformIcon({ platform, ...p }: IconProps & { platform: Platform }) {
  if (platform === 'windows') return <WindowsGlyph {...p} />;
  if (platform === 'linux') return <LinuxGlyph {...p} />;
  return <MacGlyph {...p} />;
}
