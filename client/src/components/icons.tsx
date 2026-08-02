import { SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

// Base wrapper for line icons (lucide-style: 24x24, currentColor stroke).
function Line({ size = 24, strokeWidth = 2, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const MapPin = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Line>
);

export const LocateFixed = (p: IconProps) => (
  <Line {...p}>
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Line>
);

export const Route = (p: IconProps) => (
  <Line {...p}>
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    <circle cx="18" cy="5" r="3" />
  </Line>
);

export const Clock = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Line>
);

export const Zap = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </Line>
);

export const Coins = (p: IconProps) => (
  <Line {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </Line>
);

export const Car = (p: IconProps) => (
  <Line {...p}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </Line>
);

export const SteeringWheel = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 14.2V22" />
    <path d="M10.3 11 3.4 7" />
    <path d="M13.7 11l6.9-4" />
  </Line>
);

export const Search = (p: IconProps) => (
  <Line {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Line>
);

export const UserRound = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </Line>
);

export const RadioTower = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 18a7 7 0 0 1 0-11" />
    <path d="M8 15a3 3 0 0 1 0-5" />
    <path d="M16 10a3 3 0 0 1 0 5" />
    <path d="M19 7a7 7 0 0 1 0 11" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <path d="M12 13v9" />
  </Line>
);

export const MapIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M14.1 5.55a2 2 0 0 0 1.8 0l3.65-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.9l-4.55 2.27a2 2 0 0 1-1.8 0l-4.2-2.1a2 2 0 0 0-1.8 0l-3.65 1.83A1 1 0 0 1 3 21.38V8.62a1 1 0 0 1 .55-.9L8.1 5.45a2 2 0 0 1 1.8 0z" />
    <path d="M15 5.76v15" />
    <path d="M9 3.24v15" />
  </Line>
);

export const CheckCircle = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </Line>
);

export const Star = ({ filled = false, ...p }: IconProps & { filled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={p.size ?? 24}
    height={p.size ?? 24}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={p.className}
  >
    <path d="M11.5 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .29-.9l5.17-.76a2.12 2.12 0 0 0 1.6-1.16z" />
  </svg>
);

export const Wallet = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </Line>
);

export const Receipt = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
  </Line>
);

export const Plus = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Line>
);

export const ArrowUpRight = (p: IconProps) => (
  <Line {...p}>
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </Line>
);

export const ArrowDownLeft = (p: IconProps) => (
  <Line {...p}>
    <path d="M17 17H7V7" />
    <path d="M17 7 7 17" />
  </Line>
);

export const ArrowRight = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Line>
);

export const LogOut = (p: IconProps) => (
  <Line {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Line>
);

export const X = (p: IconProps) => (
  <Line {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Line>
);

export const History = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </Line>
);

/** Custom filled crab mark in the brand color (text color = fill). */
export const CrabLogo = ({ size = 24, className, ...rest }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...rest}
  >
    {/* legs */}
    <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M6.5 14.5c-1.2.2-2.4.8-3.4 1.7" />
      <path d="M6.7 17c-1.3.3-2.5.9-3.4 1.9" />
      <path d="M17.5 14.5c1.2.2 2.4.8 3.4 1.7" />
      <path d="M17.3 17c1.3.3 2.5.9 3.4 1.9" />
      {/* eye stalks */}
      <path d="M9.7 9 8.6 5.4" />
      <path d="M14.3 9l1.1-3.6" />
    </g>
    {/* eyes */}
    <circle cx="8.2" cy="4.5" r="1.7" />
    <circle cx="15.8" cy="4.5" r="1.7" />
    {/* claws */}
    <path d="M6.8 12C4.9 11.2 3 11.6 2 13c1.1.3 1.9 1 2.2 1.9.6-1 1.5-1.6 2.5-1.7z" />
    <path d="M17.2 12c1.9-.8 3.8-.4 4.8 1-1.1.3-1.9 1-2.2 1.9-.6-1-1.5-1.6-2.5-1.7z" />
    {/* body */}
    <path d="M12 8.4c3.9 0 7 2.5 7 5.9 0 2.3-1.6 4-3.2 4.9-.6.3-.8 1-.5 1.6h-1.7a1.6 1.6 0 0 0-3 0h-1.7c.3-.6.1-1.3-.5-1.6C6.6 18.3 5 16.6 5 14.3c0-3.4 3.1-5.9 7-5.9Z" />
  </svg>
);
