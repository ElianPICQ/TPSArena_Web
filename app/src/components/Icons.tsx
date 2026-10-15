import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

// Même style que src/components/Icons.tsx de la vitrine (trait de 1,8, coins arrondis).
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

export const ProfileIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
  </Svg>
);
export const TrophyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3.5 3.5 0 0 0 3.6 4M16 6h3.5a3.5 3.5 0 0 1-3.6 4M12 13v4M8 20h8M9.5 17h5" />
  </Svg>
);
export const HistoryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const PodiumIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 20V8h6v12M3 20v-7h6M15 20v-9h6v9M2 20h20" />
  </Svg>
);
export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="1.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Svg>
);
export const LogoutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
  </Svg>
);
export const BackIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const InstallIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v11M7.5 9.5L12 14l4.5-4.5M5 17v3h14v-3" />
  </Svg>
);
export const FriendsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 19.5c1-3.2 3.5-4.8 6.5-4.8s5.5 1.6 6.5 4.8" />
    <path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4M17.5 14.9c2 .7 3.3 2.2 4 4.6" />
  </Svg>
);
