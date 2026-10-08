"use client";

import { useId, type ReactNode } from "react";
import type { JobTypeVisual, JobTypeVisualKey } from "@/data/job-type-diagnosis/visuals";

type HairStyle = "ponytail" | "twin" | "bob" | "wavy" | "straight" | "bun";
type DressStyle = "v" | "strapless" | "collar";

type SceneConfig = {
  bg: [string, string];
  hair: HairStyle;
  hairColor: string;
  dress: DressStyle;
  dressColor: string;
  necklace?: string;
  earrings?: string;
};

const SKIN = "#f8dcc8";

const SCENES: Record<JobTypeVisualKey, SceneConfig> = {
  "girls-bar": {
    bg: ["#2b1830", "#4a2140"],
    hair: "ponytail",
    hairColor: "#5a3a2c",
    dress: "v",
    dressColor: "#e0779f",
    earrings: "#f3d08a",
  },
  "concept-cafe": {
    bg: ["#fde9f2", "#ece6fb"],
    hair: "twin",
    hairColor: "#6b4436",
    dress: "collar",
    dressColor: "#f2b3cb",
  },
  snack: {
    bg: ["#fbf3e6", "#ead6c2"],
    hair: "bob",
    hairColor: "#4a3026",
    dress: "v",
    dressColor: "#8e2f45",
    necklace: "#fff8ec",
  },
  lounge: {
    bg: ["#f6eddd", "#e3cfab"],
    hair: "wavy",
    hairColor: "#3e2a22",
    dress: "strapless",
    dressColor: "#211b18",
    necklace: "#d9bb7c",
    earrings: "#d9bb7c",
  },
  club: {
    bg: ["#161825", "#2a2e46"],
    hair: "straight",
    hairColor: "#2e201b",
    dress: "v",
    dressColor: "#343b62",
    necklace: "#d9bb7c",
    earrings: "#d9bb7c",
  },
  "new-club": {
    bg: ["#141210", "#2e2619"],
    hair: "bun",
    hairColor: "#3a2a20",
    dress: "strapless",
    dressColor: "#f6efe3",
    necklace: "#e2c27e",
    earrings: "#e2c27e",
  },
};

function sparklePath(x: number, y: number, r: number): string {
  const q = r * 0.25;
  return `M${x} ${y - r}L${x + q} ${y - q}L${x + r} ${y}L${x + q} ${y + q}L${x} ${y + r}L${x - q} ${y + q}L${x - r} ${y}L${x - q} ${y - q}Z`;
}

function heartPath(x: number, y: number, s: number): string {
  return `M${x} ${y + s * 0.9}C${x - s * 1.6} ${y - s * 0.1} ${x - s * 0.7} ${y - s * 1.1} ${x} ${y - s * 0.35}C${x + s * 0.7} ${y - s * 1.1} ${x + s * 1.6} ${y - s * 0.1} ${x} ${y + s * 0.9}Z`;
}

function starPoints(x: number, y: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${(x + radius * Math.cos(angle)).toFixed(1)},${(y + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(" ");
}

function Sparkle({ x, y, r, color, opacity = 1 }: { x: number; y: number; r: number; color: string; opacity?: number }) {
  return <path d={sparklePath(x, y, r)} fill={color} opacity={opacity} />;
}

function BackHair({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case "ponytail":
      return (
        <g fill={color}>
          <path d="M100 48C122 50 128 80 118 108C112 94 108 80 102 68Z" />
          <path d="M54 68C52 44 66 38 80 38C94 38 108 44 106 68C107 80 104 90 99 94L61 94C56 90 53 80 54 68Z" />
        </g>
      );
    case "twin":
      return (
        <g fill={color}>
          <path d="M58 58C40 64 36 92 44 114C48 98 54 86 61 76Z" />
          <path d="M102 58C120 64 124 92 116 114C112 98 106 86 99 76Z" />
          <path d="M54 68C52 44 66 38 80 38C94 38 108 44 106 68C107 82 103 92 98 96L62 96C57 92 53 82 54 68Z" />
        </g>
      );
    case "bob":
      return (
        <path
          fill={color}
          d="M53 68C51 43 66 37 80 37C94 37 109 43 107 68C109 84 105 96 99 101L61 101C55 96 51 84 53 68Z"
        />
      );
    case "wavy":
      return (
        <path
          fill={color}
          d="M52 66C48 40 64 35 80 35C96 35 112 40 108 66C112 82 106 92 112 104C116 116 106 128 95 123C91 113 88 108 84 104L76 104C72 108 69 113 65 123C54 128 44 116 48 104C54 92 48 82 52 66Z"
        />
      );
    case "straight":
      return (
        <path
          fill={color}
          d="M52 66C50 40 64 35 80 35C96 35 110 40 108 66L113 124C104 129 92 126 89 117L80 100L71 117C68 126 56 129 47 124Z"
        />
      );
    case "bun":
      return (
        <g fill={color}>
          <circle cx="80" cy="32" r="12" />
          <path d="M55 70C53 46 66 39 80 39C94 39 107 46 105 70C104 80 100 86 96 89L64 89C60 86 56 80 55 70Z" />
        </g>
      );
  }
}

function FrontHair({ style, color }: { style: HairStyle; color: string }) {
  if (style === "twin") {
    return (
      <path
        fill={color}
        d="M56 70C55 50 66 43 80 43C94 43 105 50 104 70L99 62L93 67L87 60L80 66L73 60L67 67L61 62Z"
      />
    );
  }
  if (style === "bun") {
    return (
      <path
        fill={color}
        d="M57 70C56 52 66 45 80 45C94 45 104 52 103 70C97 60 89 55 80 55C72 55 63 60 57 70Z"
      />
    );
  }
  return (
    <path
      fill={color}
      d="M56 72C54 50 66 42 80 42C96 42 106 52 104 72C99 61 92 55 82 54C76 61 67 66 56 72Z"
    />
  );
}

function Dress({ style, color }: { style: DressStyle; color: string }) {
  if (style === "strapless") {
    return (
      <g>
        <path fill={SKIN} d="M26 210C28 132 50 112 80 112C110 112 132 132 134 210Z" />
        <path
          fill={color}
          d="M34 210C34 152 40 128 52 125Q80 134 108 125C120 128 126 152 126 210Z"
        />
      </g>
    );
  }
  return (
    <g>
      <path fill={SKIN} d="M64 108L96 108L80 132Z" />
      <path
        fill={color}
        d="M26 210C28 134 48 115 67 112L80 129L93 112C112 115 132 134 134 210Z"
      />
      {style === "collar" ? (
        <g>
          <ellipse cx="71" cy="116" rx="10" ry="5.5" fill="#ffffff" />
          <ellipse cx="89" cy="116" rx="10" ry="5.5" fill="#ffffff" />
          <path d="M80 121L72 116L72 126Z M80 121L88 116L88 126Z" fill="#b58bd6" />
          <circle cx="80" cy="121" r="2.4" fill="#9a6fc0" />
        </g>
      ) : null}
    </g>
  );
}

function Woman({ scene }: { scene: SceneConfig }) {
  return (
    <g>
      <BackHair style={scene.hair} color={scene.hairColor} />
      <rect x="72" y="86" width="16" height="28" rx="6" fill={SKIN} />
      <Dress style={scene.dress} color={scene.dressColor} />
      {scene.necklace ? (
        <path
          d={scene.dress === "strapless" ? "M64 110Q80 124 96 110" : "M70 111Q80 121 90 111"}
          fill="none"
          stroke={scene.necklace}
          strokeWidth="2"
          strokeDasharray="0.1 3.4"
          strokeLinecap="round"
        />
      ) : null}
      <ellipse cx="80" cy="72" rx="22" ry="25" fill={SKIN} />
      <path d="M68 76q4 -4 8 0" fill="none" stroke="#3a2a22" strokeWidth="2" strokeLinecap="round" />
      <path d="M84 76q4 -4 8 0" fill="none" stroke="#3a2a22" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="66" cy="83" rx="4.2" ry="2.4" fill="#f29d9d" opacity="0.5" />
      <ellipse cx="94" cy="83" rx="4.2" ry="2.4" fill="#f29d9d" opacity="0.5" />
      <path d="M76 88q4 3.5 8 0" fill="none" stroke="#c9636b" strokeWidth="1.8" strokeLinecap="round" />
      {scene.earrings ? (
        <g fill={scene.earrings}>
          <circle cx="58.5" cy="82" r="2.2" />
          <circle cx="101.5" cy="82" r="2.2" />
        </g>
      ) : null}
      <FrontHair style={scene.hair} color={scene.hairColor} />
      {scene.hair === "ponytail" ? <circle cx="102" cy="52" r="3" fill="#f3d08a" /> : null}
      {scene.hair === "twin" ? (
        <g fill="#b58bd6">
          <path d="M58 56L48 50L50 62Z M58 56L66 48L66 60Z" />
          <path d="M102 56L112 50L110 62Z M102 56L94 48L94 60Z" />
          <circle cx="58" cy="56" r="2.6" fill="#9a6fc0" />
          <circle cx="102" cy="56" r="2.6" fill="#9a6fc0" />
        </g>
      ) : null}
      {scene.hair === "bun" ? (
        <path d="M70 26Q80 20 90 26" fill="none" stroke="#e2c27e" strokeWidth="2" strokeLinecap="round" />
      ) : null}
    </g>
  );
}

function BackDecor({ kind, id }: { kind: JobTypeVisualKey; id: string }) {
  switch (kind) {
    case "girls-bar":
      return (
        <g>
          <g fill="#c9a25e" opacity="0.4">
            <rect x="18" y="32" width="9" height="22" rx="2" />
            <rect x="20.5" y="24" width="4" height="9" rx="1" />
            <rect x="33" y="28" width="10" height="26" rx="2" />
            <rect x="36" y="20" width="4" height="9" rx="1" />
            <rect x="49" y="34" width="8" height="20" rx="2" />
            <rect x="51" y="27" width="4" height="8" rx="1" />
          </g>
          <line x1="12" y1="55" x2="66" y2="55" stroke="#c9a25e" strokeWidth="2" opacity="0.6" />
          <g filter={`url(#${id}-glow)`}>
            <rect x="166" y="20" width="58" height="28" rx="9" fill="none" stroke="#ff8fc0" strokeWidth="2" />
            <text
              x="195"
              y="40"
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              letterSpacing="3"
              fill="#ffe0ee"
              stroke="#ff8fc0"
              strokeWidth="0.6"
              fontFamily="sans-serif"
            >
              BAR
            </text>
          </g>
          <Sparkle x={154} y={22} r={4} color="#ffd1e6" opacity={0.8} />
          <Sparkle x={214} y={62} r={3} color="#f3d08a" opacity={0.8} />
        </g>
      );
    case "concept-cafe":
      return (
        <g>
          <path d="M0 9Q120 22 240 9" fill="none" stroke="#e7b9cf" strokeWidth="1.2" />
          {Array.from({ length: 10 }).map((_, i) => {
            const x = 6 + i * 24;
            const colors = ["#f4a7c6", "#c9b2ec", "#f3d08a"];
            return (
              <path
                key={x}
                d={`M${x} ${11 + Math.sin((i / 9) * Math.PI) * 5}h14l-7 11z`}
                fill={colors[i % 3]}
                opacity="0.9"
              />
            );
          })}
          <polygon points={starPoints(30, 64, 9)} fill="#f3d08a" opacity="0.9" />
          <polygon points={starPoints(212, 52, 7)} fill="#c9b2ec" />
          <path d={heartPath(196, 84, 6)} fill="#f4a7c6" />
          <path d={heartPath(44, 98, 5)} fill="#c9b2ec" opacity="0.85" />
          <Sparkle x={58} y={42} r={4} color="#f3d08a" />
          <Sparkle x={186} y={34} r={3.5} color="#f4a7c6" />
        </g>
      );
    case "snack":
      return (
        <g>
          <circle cx="62" cy="40" r="44" fill={`url(#${id}-lamp)`} />
          <line x1="62" y1="0" x2="62" y2="22" stroke="#8a6a3a" strokeWidth="1.5" />
          <path d="M50 34L56 22H68L74 34Z" fill="#c9a25e" />
          <ellipse cx="62" cy="34" rx="12" ry="2" fill="#fff1c9" />
          <g opacity="0.55">
            <rect x="178" y="30" width="9" height="24" rx="2" fill="#8e2f45" />
            <rect x="180.5" y="22" width="4" height="9" rx="1" fill="#8e2f45" />
            <rect x="194" y="34" width="9" height="20" rx="2" fill="#c9a25e" />
            <rect x="196.5" y="27" width="4" height="8" rx="1" fill="#c9a25e" />
          </g>
          <line x1="170" y1="55" x2="214" y2="55" stroke="#c9a25e" strokeWidth="2" opacity="0.6" />
        </g>
      );
    case "lounge":
      return (
        <g>
          <g stroke="#ffffff" strokeWidth="1.2" opacity="0.55">
            <line x1="26" y1="0" x2="26" y2="90" />
            <line x1="214" y1="0" x2="214" y2="90" />
          </g>
          <path
            d="M40 160V100C40 88 50 82 62 82H178C190 82 200 88 200 100V160Z"
            fill="#2e2622"
          />
          <g fill="#4a3e36">
            <circle cx="64" cy="100" r="2" />
            <circle cx="176" cy="100" r="2" />
            <circle cx="64" cy="124" r="2" />
            <circle cx="176" cy="124" r="2" />
          </g>
          <Sparkle x={34} y={30} r={4} color="#b8975a" />
          <Sparkle x={206} y={24} r={3} color="#b8975a" opacity={0.8} />
        </g>
      );
    case "club":
      return (
        <g fill="none" stroke="#c4a574" opacity="0.28">
          <circle cx="120" cy="170" r="70" strokeWidth="1.5" />
          <circle cx="120" cy="170" r="95" strokeWidth="1.2" />
          <circle cx="120" cy="170" r="120" strokeWidth="1" />
          {[-60, -40, -20, 0, 20, 40, 60].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={120 + Math.cos(rad) * 70}
                y1={170 + Math.sin(rad) * 70}
                x2={120 + Math.cos(rad) * 140}
                y2={170 + Math.sin(rad) * 140}
                strokeWidth="1"
              />
            );
          })}
        </g>
      );
    case "new-club":
      return (
        <g>
          <line x1="120" y1="0" x2="120" y2="8" stroke="#e2c27e" strokeWidth="1.2" />
          <path d="M92 10Q120 30 148 10" fill="none" stroke="#e2c27e" strokeWidth="1.6" />
          <path d="M102 9Q120 22 138 9" fill="none" stroke="#e2c27e" strokeWidth="1.2" opacity="0.7" />
          <g fill="#f6e3b3">
            {[96, 106, 120, 134, 144].map((x, i) => (
              <circle key={x} cx={x} cy={[16, 21, 24, 21, 16][i]} r="2" />
            ))}
          </g>
          <Sparkle x={28} y={26} r={5} color="#e2c27e" />
          <Sparkle x={212} y={34} r={4} color="#ffffff" opacity={0.8} />
          <Sparkle x={190} y={16} r={2.5} color="#e2c27e" />
          <Sparkle x={52} y={60} r={2.5} color="#ffffff" opacity={0.7} />
        </g>
      );
  }
}

function FrontDecor({ kind, id }: { kind: JobTypeVisualKey; id: string }) {
  switch (kind) {
    case "girls-bar":
      return (
        <g>
          <rect x="0" y="120" width="240" height="40" fill={`url(#${id}-counter)`} />
          <rect x="0" y="117" width="240" height="4" fill="#e9c98c" />
          <path d="M174 92H198L186 106Z" fill="#ff8fc0" opacity="0.85" stroke="#ffffff" strokeWidth="1.2" />
          <line x1="186" y1="106" x2="186" y2="116" stroke="#ffffff" strokeWidth="1.4" />
          <ellipse cx="186" cy="116.5" rx="7" ry="1.6" fill="#ffffff" />
          <circle cx="193" cy="90" r="2.6" fill="#e23b5a" />
          <path d="M44 100h16l-1.5 16h-13z" fill="#f3d08a" opacity="0.75" stroke="#ffffff" strokeWidth="1" />
        </g>
      );
    case "concept-cafe":
      return (
        <g>
          <rect x="0" y="128" width="240" height="32" fill="#ffffff" opacity="0.85" />
          <path
            d={`M0 128${"q10 6 20 0".repeat(12)}`}
            fill="#fbd3e3"
          />
          <path d="M176 108h22v12a8 8 0 0 1 -8 8h-6a8 8 0 0 1 -8 -8z" fill="#ffffff" stroke="#e3a3bf" strokeWidth="1.4" />
          <path d="M198 112a5 5 0 0 1 0 10" fill="none" stroke="#e3a3bf" strokeWidth="1.4" />
          <path d={heartPath(187, 112, 3)} fill="#f4a7c6" />
        </g>
      );
    case "snack":
      return (
        <g>
          <rect x="0" y="120" width="240" height="40" fill={`url(#${id}-counter)`} />
          <rect x="0" y="117" width="240" height="4" fill="#c9a25e" />
          <path d="M172 100h20l-2 16h-16z" fill="#e9b765" opacity="0.85" stroke="#ffffff" strokeWidth="1.1" />
          <rect x="176" y="102" width="5" height="5" rx="1" fill="#ffffff" opacity="0.7" />
          <rect x="183" y="104" width="5" height="5" rx="1" fill="#ffffff" opacity="0.6" />
          <path d="M44 116v-10a4 4 0 0 1 8 0v10z" fill="#f6efe3" stroke="#c9a25e" strokeWidth="1" />
          <circle cx="48" cy="99" r="3.5" fill="#d96a7e" />
          <line x1="48" y1="102" x2="48" y2="106" stroke="#5f8a5a" strokeWidth="1.2" />
        </g>
      );
    case "lounge":
      return (
        <g>
          <rect x="24" y="110" width="26" height="50" rx="11" fill="#3a302a" />
          <rect x="190" y="110" width="26" height="50" rx="11" fill="#3a302a" />
          <rect x="0" y="142" width="240" height="18" fill="#c8a978" />
          <rect x="0" y="140" width="240" height="3" fill="#e8d3a6" />
          <path d="M170 104h12l-2 18a4 4 0 0 1 -8 0z" fill="#f3dc9a" opacity="0.9" stroke="#ffffff" strokeWidth="1" />
          <line x1="176" y1="126" x2="176" y2="138" stroke="#ffffff" strokeWidth="1.3" />
          <ellipse cx="176" cy="139" rx="6" ry="1.5" fill="#ffffff" />
          <circle cx="175" cy="112" r="0.9" fill="#ffffff" />
          <circle cx="177.5" cy="117" r="0.8" fill="#ffffff" />
        </g>
      );
    case "club":
      return (
        <g>
          <rect x="0" y="134" width="240" height="26" fill="#0f1018" />
          <rect x="0" y="132" width="240" height="2.5" fill="#c4a574" />
          <path d="M176 114h20l-2 18h-16z" fill="#d8933f" opacity="0.8" stroke="#ffffff" strokeWidth="1" />
          <rect x="180" y="116" width="6" height="6" rx="1" fill="#ffffff" opacity="0.6" />
          <Sparkle x={32} y={40} r={3.5} color="#c4a574" />
          <Sparkle x={206} y={28} r={3} color="#c4a574" opacity={0.8} />
        </g>
      );
    case "new-club":
      return (
        <g>
          <path
            d="M24 160V118C24 110 28 106 30 102V88h8v14c2 4 6 8 6 16V160Z"
            fill="#1d3328"
            stroke="#e2c27e"
            strokeWidth="0.8"
          />
          <rect x="29" y="84" width="10" height="8" rx="1" fill="#e2c27e" />
          <rect x="26" y="126" width="16" height="14" rx="1.5" fill="#e2c27e" opacity="0.9" />
          <path d="M196 106h12l-2 18a4 4 0 0 1 -8 0z" fill="#f3dc9a" opacity="0.9" stroke="#ffffff" strokeWidth="1" />
          <line x1="202" y1="128" x2="202" y2="142" stroke="#ffffff" strokeWidth="1.3" />
          <ellipse cx="202" cy="143" rx="6" ry="1.5" fill="#ffffff" />
          <circle cx="201" cy="114" r="0.9" fill="#ffffff" />
          <circle cx="203.5" cy="119" r="0.8" fill="#ffffff" />
        </g>
      );
  }
}

const COUNTER_COLORS: Partial<Record<JobTypeVisualKey, [string, string]>> = {
  "girls-bar": ["#b38a52", "#6f4f2a"],
  snack: ["#6e2233", "#4a1521"],
};

export function JobTypeIllustration({
  visual,
  size = "lg",
  label,
}: {
  visual: JobTypeVisual;
  size?: "lg" | "sm";
  label: string;
}) {
  const rawId = useId();
  const id = `jti${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const className = `jt-illust jt-illust--${size}`;

  if (visual.imageSrc) {
    return (
      <div className={className}>
        <img src={visual.imageSrc} alt={`${label}のイメージ`} className="jt-illust-image" />
      </div>
    );
  }

  const scene = SCENES[visual.key];
  const counter = COUNTER_COLORS[visual.key];
  const layers: ReactNode = (
    <>
      <BackDecor kind={visual.key} id={id} />
      <g transform="translate(60.8 10.7) scale(0.74)">
        <Woman scene={scene} />
      </g>
      <FrontDecor kind={visual.key} id={id} />
    </>
  );

  return (
    <div className={className}>
      <svg viewBox="0 0 240 160" role="img" aria-label={`${label}のイメージイラスト`}>
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={scene.bg[0]} />
            <stop offset="100%" stopColor={scene.bg[1]} />
          </linearGradient>
          {counter ? (
            <linearGradient id={`${id}-counter`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={counter[0]} />
              <stop offset="100%" stopColor={counter[1]} />
            </linearGradient>
          ) : null}
          <radialGradient id={`${id}-lamp`}>
            <stop offset="0%" stopColor="#ffe6a8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffe6a8" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`${id}-frame`}>
            <rect x="0" y="0" width="240" height="160" rx="18" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-frame)`}>
          <rect x="0" y="0" width="240" height="160" fill={`url(#${id}-bg)`} />
          {layers}
        </g>
        <rect
          x="1"
          y="1"
          width="238"
          height="158"
          rx="17"
          fill="none"
          stroke={visual.theme.accent}
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
