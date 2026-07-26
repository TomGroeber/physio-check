import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPracticeDetailForAdmin } from "@/server/services/platform-admin";
import { de } from "@/messages/de";
import { PracticeDetailTabs } from "./practice-detail-tabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ practiceId: string }>;
}): Promise<Metadata> {
  const { practiceId } = await params;
  const practice = await getPracticeDetailForAdmin(practiceId);
  return { title: practice?.name ?? de.admin.practices.title };
}

export default async function PracticeDetailPage({
  params,
}: {
  params: Promise<{ practiceId: string }>;
}) {
  const { practiceId } = await params;
  const practice = await getPracticeDetailForAdmin(practiceId);
  if (!practice) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/practices" className="text-sm text-primary underline underline-offset-4">
          {de.admin.detail.backToList}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{practice.name}</h1>
        <p className="text-sm text-muted-foreground">
          {de.admin.detail.connectedPatients}: {practice.connectedPatientsCount}
        </p>
      </div>
      <PracticeDetailTabs practice={practice} />
    </div>
  );
}
