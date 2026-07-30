import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "管理画面 | White Night Job",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authenticated = await isAdminAuthenticated();

  return (
    <AdminShell initialAuthenticated={authenticated}>{children}</AdminShell>
  );
}
