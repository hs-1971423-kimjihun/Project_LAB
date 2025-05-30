import React from "react";

interface Props {
  color?: string;
}

export const SANSwitch = ({ color = "#200E32" }: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Main switch body */}
      <rect
        x="2"
        y="8"
        width="20"
        height="8"
        rx="1"
        ry="1"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
      />
      
      {/* Front panel */}
      <rect
        x="2.5"
        y="8.5"
        width="19"
        height="7"
        rx="0.5"
        ry="0.5"
        fill="none"
        stroke="#4A5568"
        strokeWidth="0.3"
      />
      
      {/* Ethernet ports row 1 */}
      <rect x="3.5" y="10" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="5" y="10" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="6.5" y="10" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="8" y="10" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="9.5" y="10" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="11" y="10" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="12.5" y="10" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="14" y="10" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      
      {/* Ethernet ports row 2 */}
      <rect x="3.5" y="11.2" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="5" y="11.2" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="6.5" y="11.2" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="8" y="11.2" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="9.5" y="11.2" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="11" y="11.2" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="12.5" y="11.2" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      <rect x="14" y="11.2" width="1.2" height="0.8" rx="0.1" fill="#E2E8F0" />
      
      {/* SFP+ ports (larger ports for fiber) */}
      <rect x="16" y="10" width="1.5" height="1" rx="0.1" fill="#CBD5E0" />
      <rect x="18" y="10" width="1.5" height="1" rx="0.1" fill="#CBD5E0" />
      <rect x="16" y="11.5" width="1.5" height="1" rx="0.1" fill="#CBD5E0" />
      <rect x="18" y="11.5" width="1.5" height="1" rx="0.1" fill="#CBD5E0" />
      
      {/* Status LEDs */}
      <circle cx="4" cy="13.5" r="0.15" fill="#10B981" />
      <circle cx="4.8" cy="13.5" r="0.15" fill="#10B981" />
      <circle cx="5.6" cy="13.5" r="0.15" fill="#F59E0B" />
      <circle cx="6.4" cy="13.5" r="0.15" fill="#6B7280" />
      
      {/* Management port */}
      <rect x="19.5" y="13" width="1" height="0.6" rx="0.1" fill="#4A5568" />
      
      {/* Brand label area */}
      <rect x="8" y="13.2" width="6" height="1" rx="0.2" fill="#F7FAFC" stroke="#E2E8F0" strokeWidth="0.1" />
      
      {/* Ventilation slots */}
      <line x1="3" y1="14.5" x2="21" y2="14.5" stroke="#718096" strokeWidth="0.1" />
      <line x1="3" y1="14.7" x2="21" y2="14.7" stroke="#718096" strokeWidth="0.1" />
      <line x1="3" y1="14.9" x2="21" y2="14.9" stroke="#718096" strokeWidth="0.1" />
    </svg>
  );
};