interface NotaIconProps {
  className?: string;
  size?: number;
}

export function NotaIcon({ className = '', size = 34 }: NotaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="nota-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(31,122,74,0.18)" />
          <stop offset="100%" stopColor="rgba(31,122,74,0.06)" />
        </linearGradient>
      </defs>
      
      {/* Icon background */}
      <rect 
        width="34" 
        height="34" 
        rx="10" 
        fill="url(#nota-gradient)" 
        stroke="rgba(20,20,20,0.10)" 
        strokeWidth="1"
      />
      
      {/* N letter - stylized */}
      <path
        d="M10 24 V10 L22 24 V10"
        stroke="#1f7a4a"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Decorative dot */}
      <circle cx="24" cy="10" r="2" fill="#1f7a4a" opacity="0.6" />
    </svg>
  );
}
