"use client";

import { useActionState } from "react";
import { archivePatientDocumentAction, uploadPatientDocumentAction, type DocumentActionState } from "@/server/actions/documents";
import { FormMessage } from "@/components/auth/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DocumentRow = { id: string; title: string; category: "prescription" | "finding" | "patient_record" | "therapy_report" | "other"; document_date: string | null; note: string; original_name: string; mime_type: string; size_bytes: number; archived_at: string | null; created_at: string };
const categoryText = { prescription: "Verordnung", finding: "Befund", patient_record: "Patientenakte", therapy_report: "Therapiebericht", other: "Sonstiges" };

export function DocumentPanel({ patientId, documents }: { patientId: string; documents: DocumentRow[] }) {
  const [state, action, pending] = useActionState<DocumentActionState, FormData>(uploadPatientDocumentAction, {});
  return <section className="flex flex-col gap-4" aria-labelledby="documents-heading">
    <div><h2 id="documents-heading" className="text-xl font-bold">Dokumente und Patientenakte</h2><p className="text-sm text-muted-foreground">Interne Praxisunterlagen. Patienten sehen diese Dateien nicht.</p></div>
    <Card><CardContent className="p-5"><form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="patientId" value={patientId} />
      <div className="md:col-span-2"><h3 className="font-bold">Dokument hochladen</h3></div>
      <FormMessage error={state.error} success={state.success} />
      <div className="flex flex-col gap-2"><Label htmlFor="document-title">Titel</Label><Input id="document-title" name="title" required maxLength={200} /></div>
      <div className="flex flex-col gap-2"><Label htmlFor="document-category">Kategorie</Label><select id="document-category" name="category" className="h-10 rounded-md border bg-background px-3"><option value="prescription">Verordnung</option><option value="finding">Befund</option><option value="patient_record">Patientenakte</option><option value="therapy_report">Therapiebericht</option><option value="other">Sonstiges</option></select></div>
      <div className="flex flex-col gap-2"><Label htmlFor="document-date">Dokumentdatum (optional)</Label><Input id="document-date" name="documentDate" type="date" /></div>
      <div className="flex flex-col gap-2"><Label htmlFor="document-file">Datei</Label><Input id="document-file" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required /><p className="text-xs text-muted-foreground">PDF, JPEG oder PNG · maximal 20 MB</p></div>
      <div className="flex flex-col gap-2 md:col-span-2"><Label htmlFor="document-note">Interne Notiz (optional)</Label><Textarea id="document-note" name="note" maxLength={1000} /></div>
      <Button type="submit" disabled={pending} className="h-11 md:col-span-2">{pending ? "Wird hochgeladen …" : "Dokument hochladen"}</Button>
    </form></CardContent></Card>
    {documents.length ? <ul className="flex flex-col gap-2">{documents.map((document) => <li key={document.id}><Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><div className="flex items-center gap-2"><p className="font-semibold">{document.title}</p>{document.archived_at ? <Badge variant="secondary">Archiviert</Badge> : null}</div><p className="text-sm text-muted-foreground">{categoryText[document.category]} · {(document.size_bytes / 1024).toFixed(0)} KB</p></div><div className="flex gap-2"><Button asChild variant="outline"><a href={`/practice/patients/${patientId}/documents/${document.id}`}>Öffnen</a></Button>{!document.archived_at ? <form action={archivePatientDocumentAction}><input type="hidden" name="patientId" value={patientId} /><input type="hidden" name="documentId" value={document.id} /><Button type="submit" variant="outline">Archivieren</Button></form> : null}</div></CardContent></Card></li>)}</ul> : <p className="rounded-lg border p-4 text-sm text-muted-foreground">Noch keine Dokumente vorhanden.</p>}
  </section>;
}

