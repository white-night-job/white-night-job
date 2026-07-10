import Link from "next/link";
import { LineIcon } from "@/components/LineIcon";
import { buildLineLoginHref } from "@/lib/member-access";

type MemberGatePageProps = {
  title: string;
  description: string;
  redirectPath: string;
};

export function MemberGatePage({
  title,
  description,
  redirectPath,
}: MemberGatePageProps) {
  const lineLoginHref = buildLineLoginHref(redirectPath);

  return (
    <div className="member-gate-page">
      <div className="member-gate-page-card">
        <p className="member-gate-page-eyebrow font-serif">Members Only</p>
        <h1 className="member-gate-page-title font-serif">{title}</h1>
        <p className="member-gate-page-desc">{description}</p>

        <a href={lineLoginHref} className="member-gate-modal-primary">
          <LineIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
          LINEでかんたんログイン
        </a>

        <Link href="/" className="member-gate-modal-secondary member-gate-page-home-link">
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
