import { NextResponse, type NextRequest } from "next/server";
import { getSessionContext } from "@/server/services/session";
import { createPatientDocumentSignedUrl, getPracticeDocument } from "@/server/services/documents";

export async function GET(request: NextRequest, { params }: { params: Promise<{ patientId: string; documentId: string }> }) {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return NextResponse.redirect(new URL("/login", request.url));
  const { patientId, documentId } = await params;
  const document = await getPracticeDocument(membership.practiceId, patientId, documentId);
  if (!document) return new NextResponse("Nicht gefunden", { status: 404 });
  const signedUrl = await createPatientDocumentSignedUrl(document.storage_path);
  return NextResponse.redirect(signedUrl);
}

