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
      <rect width="40" height="40" rx="8" fill="#1C1D22" />
      <path
        d="M20 6L31.5 11.2V20.5C31.5 27.2 26.6 32.5 20 34.5C13.4 32.5 8.5 27.2 8.5 20.5V11.2L20 6Z"
        stroke="#DC2626"
        strokeWidth="2.2"
        fill="#282A30"
      />
      <path
        d="M20 12.2L25.5 24.8H14.5L20 12.2Z"
        stroke="#FAFAFA"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="21" r="2.2" fill="#DC2626" />
    </svg>
  );
};
