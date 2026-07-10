import Link from "next/link";
import { LOGO_ALT } from "@/lib/site";

export function HeaderLogo() {
  return (
    <Link href="/" aria-label={LOGO_ALT} className="header-logo-link">
      <span className="header-logo-wordmark font-serif">
        <span className="header-logo-brand">White Night</span>
        <span className="header-logo-job"> Job</span>
      </span>
    </Link>
  );
}
