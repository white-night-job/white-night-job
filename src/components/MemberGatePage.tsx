"use client";

import Link from "next/link";
import { LineLoginButton } from "@/components/LineLoginButton";

type MemberGatePageProps = {
  title: string;
  description: string;
  redirectPath: string;
  action?: "consultation" | "diagnosis" | "general";
};

export function MemberGatePage({
  title,
  description,
  redirectPath,
  action = "general",
}: MemberGatePageProps) {
  return (
    <div className="member-gate-page">
      <div className="member-gate-page-card">
        <p className="member-gate-page-eyebrow font-serif">Members Only</p>
        <h1 className="member-gate-page-title font-serif">{title}</h1>
        <p className="member-gate-page-desc">{description}</p>

        <LineLoginButton
          className="member-gate-modal-primary"
          redirectPath={redirectPath}
          action={action}
          showIcon
        >
          LINEでかんたんログイン
        </LineLoginButton>

        <Link href="/" className="member-gate-modal-secondary member-gate-page-home-link">
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
