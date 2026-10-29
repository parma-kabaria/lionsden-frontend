import type { BoxProps } from '@mui/material/Box';

import React from 'react';

import Box from '@mui/material/Box';

export type BungalowStatusType =
  | 'booked'
  | 'unbooked'
  | 'maintenance'
  | 'occupied'
  | 'available'
  | 'vacant'
  | 'under_maintenance';

interface StatusIconProps extends Omit<BoxProps, 'color'> {
  type: BungalowStatusType;
  size?: number;
  color?: string;
}

// 1. Vector SVG for Booked / Occupied Bed (red guest sleeping in bed, pure transparent icon)
export function BookedBedSvg({ size = 24, color = '#ef4444' }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 100 85"
      width={size}
      height={size}
      fill={color}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Tall Headboard on Left */}
      <rect x="8" y="14" width="12" height="56" rx="2" />
      {/* Sleeping Guest Head */}
      <circle cx="30" cy="28" r="9" />
      {/* Blanket with smooth curved top */}
      <path d="M 40 24 H 74 C 84 24, 92 32, 92 42 V 43 H 20 V 38 C 20 36, 22 35, 25 35 H 37 C 39 35, 40 33, 40 31 Z" />
      {/* Mattress bar */}
      <rect x="18" y="43" width="74" height="10" />
      {/* Bed Base & Legs with bottom Arch */}
      <path d="M 8 53 H 92 V 70 H 80 V 62 C 80 57, 76 54, 70 54 H 30 C 24 54, 20 57, 20 62 V 70 H 8 Z" />
    </svg>
  );
}

// 2. Vector SVG for Unbooked / Available Bed Frame (green transparent bed)
export function UnbookedBedSvg({ size = 24, color = '#00a76f' }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 100 85"
      width={size}
      height={size}
      fill={color}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Tall Headboard on Left */}
      <rect x="8" y="14" width="12" height="56" rx="2" />
      {/* Empty Mattress Base */}
      <rect x="18" y="43" width="74" height="10" />
      {/* Bed Base & Legs with bottom Arch */}
      <path d="M 8 53 H 92 V 70 H 80 V 62 C 80 57, 76 54, 70 54 H 30 C 24 54, 20 57, 20 62 V 70 H 8 Z" />
    </svg>
  );
}

// 3. Vector SVG for Maintenance House (amber house with tools, pure transparent icon)
export function MaintenanceHouseSvg({ size = 24, color = '#f59e0b' }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="0 5 100 88"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Chimney on roof */}
      <path d="M 68 38 V 16 H 80 V 50" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Gable Roof */}
      <path d="M 10 46 L 49 14 L 88 46" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* House Body */}
      <path d="M 19 45 V 88 H 79 V 45" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Crossed Hammer and Wrench */}
      <g strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Hammer diagonal */}
        <line x1="34" y1="74" x2="63" y2="46" />
        {/* Hammer Claw Head */}
        <path d="M 52 45 C 54 40, 60 36, 68 37 C 69 41, 70 47, 65 52 L 60 48" />

        {/* Wrench diagonal */}
        <line x1="64" y1="74" x2="38" y2="48" />
        {/* Wrench Jaw on top */}
        <path d="M 32 46 C 28 42, 28 35, 34 32 C 37 36, 42 36, 44 33 C 48 37, 47 43, 42 47" />
        {/* Wrench bottom jaw */}
        <circle cx="66" cy="76" r="2.5" fill={color} />
      </g>
    </svg>
  );
}

export function StatusIcon({
  type,
  size = 24,
  color,
  sx,
  ...other
}: StatusIconProps) {
  const normalized = type.toLowerCase();
  const isBooked = normalized === 'booked' || normalized === 'occupied';
  const isUnbooked = normalized === 'unbooked' || normalized === 'available' || normalized === 'vacant';

  if (isBooked) {
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...sx }} {...other}>
        <BookedBedSvg size={size} color={color || '#ef4444'} />
      </Box>
    );
  }

  if (isUnbooked) {
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...sx }} {...other}>
        <UnbookedBedSvg size={size} color={color || '#00a76f'} />
      </Box>
    );
  }

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...sx }} {...other}>
      <MaintenanceHouseSvg size={size} color={color || '#f59e0b'} />
    </Box>
  );
}
