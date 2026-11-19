interface RecipeArtProps {
  palette: string[];
}

export default function RecipeArt({ palette }: RecipeArtProps) {
  const [bg, food, plate, garn] = palette;

  const leaves = [
    [62, 70, -30],
    [128, 64, 25],
    [140, 122, 70],
    [70, 130, -60],
    [100, 96, 10],
    [112, 140, 40],
  ];

  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <rect width="200" height="200" fill={bg} />
      <circle cx="100" cy="106" r="80" fill="rgba(43,33,25,.08)" />
      <circle cx="100" cy="100" r="80" fill={plate} />
      <circle cx="100" cy="100" r="64" fill="none" stroke="rgba(43,33,25,.08)" strokeWidth="2" />
      <circle cx="100" cy="100" r="54" fill={food} />
      <circle cx="84" cy="88" r="14" fill="rgba(255,255,255,.18)" />
      <circle cx="118" cy="112" r="9" fill="rgba(0,0,0,.12)" />
      <circle cx="94" cy="118" r="6" fill="rgba(255,255,255,.22)" />
      {leaves.map(([x, y, a], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="8"
          ry="3.6"
          fill={garn}
          transform={`rotate(${a} ${x} ${y})`}
        />
      ))}
    </svg>
  );
}
