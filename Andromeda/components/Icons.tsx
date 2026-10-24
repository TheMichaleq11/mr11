// Ikony liniowe (inline SVG), dziedziczą kolor z tekstu.
type P = { size?: number };
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const Galaxy = ({ size = 24 }: P) => (
  <svg {...base(size)} strokeWidth={1.6}>
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)" />
    <ellipse cx="12" cy="12" rx="5.5" ry="2" transform="rotate(-30 12 12)" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    <circle cx="19.5" cy="4.5" r="0.6" fill="currentColor" />
  </svg>
);
export const Home = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
);
export const Calendar = ({ size = 24 }: P) => (
  <svg {...base(size)}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
export const Chart = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M3 20h18M7 16V10M12 16V5M17 16v-3" /></svg>
);
export const Book = ({ size = 24 }: P) => (
  <svg {...base(size)}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
  </svg>
);
export const ChevronLeft = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}><path d="m15 18-6-6 6-6" /></svg>
);
export const ChevronRight = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}><path d="m9 18 6-6-6-6" /></svg>
);
export const User = ({ size = 16 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const Pin = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const LogOut = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
);
export const External = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M14 3h7v7M10 14 21 3M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /></svg>
);
