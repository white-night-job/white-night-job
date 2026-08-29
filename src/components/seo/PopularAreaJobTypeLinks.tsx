import Link from "next/link";

const POPULAR_AREA_JOB_LINKS = [
  {
    area: "すすきの",
    basePath: "/sapporo/susukino",
    jobs: [
      { label: "ガルバ・ガールズバー", path: "/girlsbar" },
      { label: "コンカフェ", path: "/concept-cafe" },
      { label: "ニュークラブ", path: "/new-club" },
      { label: "ラウンジ", path: "/lounge" },
      { label: "スナック", path: "/snack" },
    ],
  },
  {
    area: "琴似",
    basePath: "/sapporo/kotoni",
    jobs: [
      { label: "ガールズバー", path: "/girls-bar" },
      { label: "コンカフェ", path: "/concept-cafe" },
      { label: "ニュークラブ", path: "/new-club" },
      { label: "ラウンジ", path: "/lounge" },
      { label: "スナック", path: "/snack" },
    ],
  },
  {
    area: "北24条",
    basePath: "/sapporo/kita24jo",
    jobs: [
      { label: "ガールズバー", path: "/girls-bar" },
      { label: "コンカフェ", path: "/concept-cafe" },
      { label: "ニュークラブ", path: "/new-club" },
      { label: "ラウンジ", path: "/lounge" },
      { label: "スナック", path: "/snack" },
    ],
  },
  {
    area: "手稲",
    basePath: "/sapporo/teine",
    jobs: [
      { label: "ガールズバー", path: "/girls-bar" },
      { label: "コンカフェ", path: "/concept-cafe" },
      { label: "ニュークラブ", path: "/new-club" },
      { label: "ラウンジ", path: "/lounge" },
      { label: "スナック", path: "/snack" },
    ],
  },
] as const;

/** Compact crawlable internal links for area × job-type SEO pages. */
export function PopularAreaJobTypeLinks({
  className = "",
  showHeading = true,
}: {
  className?: string;
  showHeading?: boolean;
}) {
  return (
    <nav
      aria-labelledby={showHeading ? "popular-area-job-heading" : undefined}
      aria-label={showHeading ? undefined : "エリア・職種から探す"}
      className={`text-xs leading-5 sm:text-sm sm:leading-6 ${className}`}
    >
      {showHeading ? (
        <p
          id="popular-area-job-heading"
          className="font-medium tracking-wide opacity-80"
        >
          人気のエリア・職種
        </p>
      ) : (
        <p className="mb-2 text-xs font-semibold tracking-wide text-gold-dark">
          職種から探す
        </p>
      )}
      <div
        className={`${showHeading ? "mt-2 " : ""}grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4`}
      >
        {POPULAR_AREA_JOB_LINKS.map((group) => (
          <div key={group.basePath}>
            <p className="font-semibold text-charcoal opacity-90">{group.area}</p>
            <ul className="mt-1.5 space-y-1">
              {group.jobs.map((job) => (
                <li key={job.path}>
                  <Link
                    href={`${group.basePath}${job.path}`}
                    className="text-gold-dark underline-offset-2 hover:underline"
                  >
                    {job.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
