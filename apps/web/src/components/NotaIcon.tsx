interface NotaIconProps {
  className?: string;
  size?: number;
}

/**
 * Nota logo: stylized "N" with dot accent on a rounded green background.
 * Matches assets/logo.svg and public/logo.svg.
 */
export function NotaIcon({ className = '', size = 34 }: Readonly<NotaIconProps>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="nota-bg-component" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1f7a4a" />
          <stop offset="100%" stopColor="#165a36" />
        </linearGradient>
        <linearGradient id="nota-shine-component" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#nota-bg-component)" />
      <rect width="100" height="100" rx="22" fill="url(#nota-shine-component)" />
      <path
        d="M22 78V22h8v36l22-36h8v44h-8V50L30 78H22z"
        fill="white"
        fillRule="evenodd"
      />
      <circle cx="66" cy="24" r="5" fill="white" />
    </svg>
  );
}
