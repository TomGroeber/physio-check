import type { Metadata } from "next";
import { getPlatformConfig } from "@/server/services/platform-admin";
import { de } from "@/messages/de";
import { ConfigForm } from "./config-form";

export const metadata: Metadata = { title: de.admin.config.title };

export default async function AdminConfigPage() {
  const config = await getPlatformConfig();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{de.admin.config.title}</h1>
        <p className="text-sm text-muted-foreground">{de.admin.config.hint}</p>
      </div>
      <ConfigForm config={config} />
    </div>
  );
}
