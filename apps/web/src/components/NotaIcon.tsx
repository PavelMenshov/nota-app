interface NotaIconProps {
  className?: string;
  size?: number;
}

/**
 * Nota logo: stylized "N" with dot accent on a rounded green background.
 * Flat, single-tone green — no gradients or shine. Matches assets/logo.svg and public/logo.svg.
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
      <rect width="100" height="100" rx="22" fill="#1a7c47" />
      <path
        d="M22 78V22h8v36l22-36h8v44h-8V50L30 78H22z"
        fill="white"
        fillRule="evenodd"
      />
      <circle cx="66" cy="24" r="5" fill="white" />
    </svg>
  );
}
