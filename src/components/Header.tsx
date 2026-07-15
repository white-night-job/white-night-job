"use client";

import { HeaderAccountMenu } from "@/components/HeaderAccountMenu";
import { HeaderDesktopNav } from "@/components/HeaderDesktopNav";
import { HeaderDrawer } from "@/components/HeaderDrawer";
import { HeaderLogo } from "@/components/HeaderLogo";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="site-header-slot site-header-slot-left">
          <HeaderDrawer />
        </div>

        <div className="site-header-logo">
          <HeaderLogo />
        </div>

        <HeaderDesktopNav />

        <div className="site-header-slot site-header-slot-right">
          <HeaderAccountMenu />
        </div>
      </div>
      <div className="site-header-line" aria-hidden />
    </header>
  );
}
