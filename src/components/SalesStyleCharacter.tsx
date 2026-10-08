import { SALES_STYLE_PROFILES, type SalesStyleType } from "@/lib/sales-style-diagnosis";

const SKIN = "#f7e3d6";

/** 後ろ髪（顔の背面） */
const BACK_HAIR: Record<SalesStyleType, string> = {
  entertainer:
    "M56 72C54 46 66 36 80 36C96 36 107 46 105 72C104 82 100 90 96 94L64 94C59 90 56 82 56 72Z",
  healer:
    "M54 70C52 44 66 34 80 34C96 34 109 44 107 70L111 120C100 113 91 110 80 110C69 110 60 113 49 120Z",
  romance:
    "M54 70C52 44 66 34 80 34C96 34 109 44 107 70C112 82 106 90 112 100C116 110 108 118 104 122C96 114 88 112 80 112C72 112 64 114 56 122C52 118 44 110 48 100C54 90 48 82 54 70Z",
  elegant:
    "M57 72C55 48 66 38 80 38C95 38 106 48 104 72C103 80 100 86 96 90L64 90C60 86 57 80 57 72Z",
  natural:
    "M54 72C52 46 66 38 80 38C96 38 108 46 106 72C108 86 104 96 98 99L62 99C56 96 52 86 54 72Z",
};

/** 前髪 */
const FRONT_HAIR: Record<SalesStyleType, string> = {
  entertainer: "M57 68C56 48 67 40 80 40C94 40 105 48 103 68C97 57 88 52 79 55C71 57 62 61 57 68Z",
  healer: "M56 70C55 47 67 38 80 38C94 38 106 47 104 70C99 60 92 52 82 51C74 54 64 60 56 70Z",
  romance: "M56 69C55 47 67 38 80 38C94 38 105 47 104 69C100 60 94 55 86 54C82 58 72 60 56 69Z",
  elegant: "M58 66C58 49 68 42 80 42C93 42 103 49 102 66C96 56 88 51 80 51C72 51 64 56 58 66Z",
  natural: "M56 70C55 48 67 40 80 40C94 40 105 48 104 70C100 63 94 60 88 60C84 57 80 57 76 60C70 60 62 63 56 70Z",
};

function HairAccent({ type, color }: { type: SalesStyleType; color: string }) {
  if (type === "entertainer") {
    // 高めのポニーテール
    return (
      <path
        d="M100 46C118 38 128 58 118 80C114 68 108 60 99 57Z"
        fill={color}
      />
    );
  }
  if (type === "elegant") {
    // まとめ髪＋パール
    return (
      <>
        <circle cx="80" cy="35" r="11" fill={color} />
        <circle cx="91" cy="39" r="2.4" fill="#fffaf2" stroke="#e7d6b5" strokeWidth="0.8" />
      </>
    );
  }
  if (type === "romance") {
    // リボン
    return (
      <g transform="translate(98 44) rotate(18)">
        <path d="M0 0L-9 -6L-9 6Z" fill="#f4c6d2" />
        <path d="M0 0L9 -6L9 6Z" fill="#f4c6d2" />
        <circle r="2.6" fill="#e8a3b6" />
      </g>
    );
  }
  if (type === "natural") {
    // 小さな花のヘアピン
    return (
      <g transform="translate(62 52)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <circle
            key={deg}
            cx={Math.cos((deg * Math.PI) / 180) * 3.2}
            cy={Math.sin((deg * Math.PI) / 180) * 3.2}
            r="2.2"
            fill="#fff4dc"
          />
        ))}
        <circle r="1.6" fill="#e9c27a" />
      </g>
    );
  }
  return null;
}

function Motif({ type }: { type: SalesStyleType }) {
  const common = {
    fill: "none",
    stroke: "#ffffff",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "entertainer":
      // マイク
      return (
        <g {...common}>
          <rect x="-3.5" y="-8" width="7" height="10" rx="3.5" />
          <path d="M-6 0C-6 4 -3 6 0 6C3 6 6 4 6 0M0 6V9" />
        </g>
      );
    case "healer":
      // ティーカップ
      return (
        <g {...common}>
          <path d="M-7 -3H5V1C5 5 2 7 -1 7C-4 7 -7 5 -7 1Z" />
          <path d="M5 -1H7C8.5 -1 8.5 3 7 3H5M-4 -6C-4 -8 -2 -8 -2 -10M0 -6C0 -8 2 -8 2 -10" />
        </g>
      );
    case "romance":
      return (
        <path
          d="M0 7C-6 2 -8 -1 -8 -4C-8 -7 -5.5 -8.5 -3.5 -8.5C-2 -8.5 -0.8 -7.6 0 -6.4C0.8 -7.6 2 -8.5 3.5 -8.5C5.5 -8.5 8 -7 8 -4C8 -1 6 2 0 7Z"
          fill="#ffffff"
        />
      );
    case "elegant":
      // ワイングラス
      return (
        <g {...common}>
          <path d="M-5 -8H5C5 -2 3 1 0 1C-3 1 -5 -2 -5 -8ZM0 1V7M-4 7H4" />
        </g>
      );
    case "natural":
      // 葉っぱ
      return (
        <g {...common}>
          <path d="M-6 6C-7 -2 -1 -8 7 -7C8 1 2 7 -6 6Z" />
          <path d="M-6 6L3 -3" />
        </g>
      );
  }
}

function Sparkle({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const s = size;
  return (
    <path
      d={`M${x} ${y - s}C${x + s * 0.18} ${y - s * 0.18} ${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y}C${x + s * 0.18} ${y + s * 0.18} ${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s}C${x - s * 0.18} ${y + s * 0.18} ${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y}C${x - s * 0.18} ${y - s * 0.18} ${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s}Z`}
      fill={color}
    />
  );
}

type SalesStyleCharacterProps = {
  type: SalesStyleType;
  size?: "lg" | "sm";
};

/**
 * タイプ別キャラクター。profile.imageSrc を設定すると画像に差し替わる。
 */
export function SalesStyleCharacter({ type, size = "lg" }: SalesStyleCharacterProps) {
  const profile = SALES_STYLE_PROFILES[type];
  const { accent, soft, deep } = profile.theme;
  const gradientId = `ss-char-bg-${type}-${size}`;
  const className = `sales-style-character sales-style-character--${size}`;

  if (profile.imageSrc) {
    return (
      <div className={className}>
        <img
          src={profile.imageSrc}
          alt={`${profile.name}のキャラクター`}
          className="sales-style-character-image"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <svg viewBox="0 0 160 160" role="img" aria-label={`${profile.name}のキャラクター`}>
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor={soft} />
            <stop offset="100%" stopColor={soft} />
          </radialGradient>
        </defs>

        <circle cx="80" cy="80" r="74" fill={`url(#${gradientId})`} />
        <circle
          cx="80"
          cy="80"
          r="74"
          fill="none"
          stroke="#c4a574"
          strokeWidth="1.2"
          strokeDasharray="2 5"
          opacity="0.7"
        />

        <Sparkle x={30} y={42} size={6} color="#d9bf8c" />
        <Sparkle x={134} y={58} size={4.5} color="#d9bf8c" />
        <Sparkle x={124} y={30} size={3} color={accent} />

        <clipPath id={`${gradientId}-clip`}>
          <circle cx="80" cy="80" r="74" />
        </clipPath>
        <g clipPath={`url(#${gradientId}-clip)`}>
          <path d={BACK_HAIR[type]} fill={deep} />
          <path d="M30 160C32 124 54 108 80 108C106 108 128 124 130 160Z" fill={accent} />
          <path
            d="M66 108L80 122L94 108"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.7"
          />
          <rect x="73" y="92" width="14" height="18" rx="6" fill={SKIN} />
          <ellipse cx="80" cy="72" rx="22" ry="25" fill={SKIN} />
          <path
            d="M69 74Q73 70 77 74M83 74Q87 70 91 74"
            fill="none"
            stroke="#5a463a"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="68" cy="82" r="3.6" fill="#f3a9a9" opacity="0.45" />
          <circle cx="92" cy="82" r="3.6" fill="#f3a9a9" opacity="0.45" />
          <path
            d="M76 86Q80 89.5 84 86"
            fill="none"
            stroke="#c97a7a"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d={FRONT_HAIR[type]} fill={deep} />
          <HairAccent type={type} color={deep} />
        </g>

        <g transform="translate(128 122)">
          <circle r="15" fill={accent} stroke="#ffffff" strokeWidth="3" />
          <Motif type={type} />
        </g>
      </svg>
    </div>
  );
}
