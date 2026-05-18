export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="moss-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C6D4B3" />
          <stop offset="1" stopColor="#5B7A4B" />
        </linearGradient>
      </defs>
      <path d="M32 13 L51 42 L13 42 Z" fill="url(#moss-g)" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="20"
        fontWeight="700"
        fontStyle="italic"
        fill="#1B1A17"
      >
        a
      </text>
    </svg>
  );
}
