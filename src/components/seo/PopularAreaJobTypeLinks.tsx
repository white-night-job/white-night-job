import Link from "next/link";

const POPULAR_AREA_JOB_LINKS = [
  {
    area: "すすきの",
    basePath: "/sapporo/susukino",
    jobs: [
      { label: "ガールズバー", path: "/girls-bar" },
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
}: {
  className?: string;
}) {
  return (
    <nav
      aria-labelledby="popular-area-job-heading"
      className={`text-xs leading-5 ${className}`}
    >
      <p id="popular-area-job-heading" className="font-medium tracking-wide opacity-80">
        人気のエリア・職種
      </p>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {POPULAR_AREA_JOB_LINKS.map((group) => (
          <div key={group.basePath}>
            <p className="font-semibold opacity-90">{group.area}</p>
            <ul className="mt-1 space-y-0.5">
              {group.jobs.map((job) => (
                <li key={job.path}>
                  <Link
                    href={`${group.basePath}${job.path}`}
                    className="underline-offset-2 hover:underline"
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
