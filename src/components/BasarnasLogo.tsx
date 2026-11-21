import React from 'react';

interface BasarnasLogoProps {
  size?: number;
  className?: string;
}

export const BasarnasLogo: React.FC<BasarnasLogoProps> = ({ size = 34, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect width="40" height="40" rx="9" fill="#C8102E" />
      <path
        d="M20 6.5L31 11.4V20.4C31 26.8 26.3 31.8 20 33.8C13.7 31.8 9 26.8 9 20.4V11.4L20 6.5Z"
        fill="#FFFFFF"
      />
      <path
        d="M20 12.2L25.4 24.4H14.6L20 12.2Z"
        stroke="#C8102E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="20.8" r="2.2" fill="#C8102E" />
    </svg>
  );
};
