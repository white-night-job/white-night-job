import Link from "next/link";

export function HeaderLogo() {
  return (
    <Link
      href="/"
      aria-label="トップページへ戻る"
      className="header-logo-link"
    >
      <span className="header-logo-wordmark font-serif">
        <span className="header-logo-brand">White Night</span>
        <span className="header-logo-job"> Job</span>
      </span>
    </Link>
  );
}
