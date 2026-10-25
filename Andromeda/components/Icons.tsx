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
export const Ticket = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" /><path d="M13 6v2M13 11v2M13 16v2" /></svg>
);
export const Clipboard = ({ size = 24 }: P) => (
  <svg {...base(size)}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1M9 11l2 2 4-4M9 17h6" /></svg>
);
export const CalendarDays = ({ size = 24 }: P) => (
  <svg {...base(size)}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>
);
export const MapPin = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const IdCard = ({ size = 24 }: P) => (
  <svg {...base(size)}><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="12" r="2.5" /><path d="M14 10h5M14 14h3" /></svg>
);
export const Wallet = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M20 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6" /><circle cx="16.5" cy="13.5" r="1" fill="currentColor" /></svg>
);
export const Survey = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" /></svg>
);
export const News = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M4 4h13v16H6a2 2 0 0 1-2-2z" /><path d="M17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3" /></svg>
);
export const Grid = ({ size = 24 }: P) => (
  <svg {...base(size)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
);
export const Pencil = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);
export const Award = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M22 10 12 5 2 10l10 5z" /><path d="M6 12v5c3 2 9 2 12 0v-5M22 10v6" /></svg>
);
export const Users = ({ size = 24 }: P) => (
  <svg {...base(size)}><circle cx="9" cy="8" r="3.5" /><path d="M2 21a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M22 21a7 7 0 0 0-4-6.3" /></svg>
);
export const FileText = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg>
);
export const Mail = ({ size = 18 }: P) => (
  <svg {...base(size)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
export const Door = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M4 21h16M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" /><circle cx="14.5" cy="12.5" r="0.8" fill="currentColor" /></svg>
);
export const Search = ({ size = 18 }: P) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
