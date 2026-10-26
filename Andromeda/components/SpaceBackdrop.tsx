// Tło całej aplikacji: ciemny kosmos z mgławicą, świecącą orbitą (jak w logo) i gwiazdami.
// Statyczne SVG — rysuje się od razu, bez obrazków do pobrania.
const W = 1600;
const H = 1000;

// gwiazdy w stałych miejscach (bez losowania, żeby serwer i telefon rysowały to samo)
const stars = Array.from({ length: 160 }, (_, i) => {
  const x = (i * 977 + 131) % W;
  const y = (i * 571 + 47) % H;
  const r = i % 9 === 0 ? 1.6 : i % 4 === 0 ? 1.1 : 0.75;
  const o = 0.22 + ((i * 37) % 10) / 16;
  return { x, y, r, o };
});

export default function SpaceBackdrop() {
  return (
    <div className="space" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="sp-neb" cx="0.68" cy="0.42" r="0.62">
            <stop offset="0" stopColor="#2B4FB8" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#3B2A86" stopOpacity="0.25" />
            <stop offset="1" stopColor="#050812" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sp-neb2" cx="0.12" cy="0.9" r="0.5">
            <stop offset="0" stopColor="#4B2C96" stopOpacity="0.35" />
            <stop offset="1" stopColor="#050812" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sp-ring" x1="0" x2="1">
            <stop offset="0" stopColor="#6E7BFF" stopOpacity="0" />
            <stop offset="0.35" stopColor="#7FB4FF" />
            <stop offset="0.7" stopColor="#B08CFF" />
            <stop offset="1" stopColor="#B08CFF" stopOpacity="0" />
          </linearGradient>
          <filter id="sp-glow">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sp-wide">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
        <rect width={W} height={H} fill="#050812" />
        <rect width={W} height={H} fill="url(#sp-neb)" />
        <rect width={W} height={H} fill="url(#sp-neb2)" />
        <g transform="rotate(-18 1060 500)">
          <ellipse cx="1060" cy="500" rx="640" ry="170" stroke="url(#sp-ring)" strokeWidth="60" fill="none" opacity="0.35" filter="url(#sp-wide)" />
          <ellipse cx="1060" cy="500" rx="640" ry="170" stroke="url(#sp-ring)" strokeWidth="3" fill="none" filter="url(#sp-glow)" />
        </g>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
        ))}
      </svg>
    </div>
  );
}
