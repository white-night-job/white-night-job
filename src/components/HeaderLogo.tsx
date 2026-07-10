import Link from "next/link";
import { LOGO_ALT } from "@/lib/site";

export function HeaderLogo() {
  return (
    <Link href="/" aria-label={LOGO_ALT} className="header-logo-link">
      <span className="header-logo-mark font-serif">
        <span className="header-logo-line" aria-hidden />
        <span className="header-logo-title">White Night</span>
        <span className="header-logo-tag-wrap">
          <span className="header-logo-line header-logo-line-through" aria-hidden />
          <span className="header-logo-tag">
            <span className="header-logo-tag-text">体入ホワイトナイト</span>
          </span>
        </span>
        <span className="header-logo-job uppercase">JOB</span>
      </span>
    </Link>
  );
}
