import Image from "next/image";
import Link from "next/link";
import { branding } from "@/config/branding";

/**
 * Layout für alle Auth-Seiten: ruhige, zentrierte Karte mit Logo.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <Image
          src={branding.logoPath}
          alt=""
          width={44}
          height={44}
          priority
        />
        <span className="text-3xl font-bold tracking-tight">
          {branding.appName}
        </span>
      </Link>
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </main>
  );
}
