interface EywaIconProps {
  className?: string;
  size?: number;
}

export function EywaIcon({ className = '', size = 34 }: EywaIconProps) {
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
        <linearGradient id="eywa-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(31,122,74,0.18)" />
          <stop offset="100%" stopColor="rgba(31,122,74,0.06)" />
        </linearGradient>
      </defs>
      
      {/* Icon background */}
      <rect 
        width="34" 
        height="34" 
        rx="10" 
        fill="url(#eywa-gradient)" 
        stroke="rgba(20,20,20,0.10)" 
        strokeWidth="1"
      />
      
      {/* E letter - stylized */}
      <path
        d="M10 10 H20 M10 17 H18 M10 24 H20"
        stroke="#1f7a4a"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 10 V24"
        stroke="#1f7a4a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Decorative dot */}
      <circle cx="24" cy="10" r="2" fill="#1f7a4a" opacity="0.6" />
    </svg>
  );
}
