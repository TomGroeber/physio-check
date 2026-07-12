"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  archivePatientDocumentAction,
  deletePatientDocumentAction,
  uploadPatientDocumentAction,
  type DocumentActionState,
} from "@/server/actions/documents";
import { FormMessage } from "@/components/auth/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { de } from "@/messages/de";

type DocumentCategory = "prescription" | "finding" | "patient_record" | "therapy_report" | "other";
type DocumentRow = { id: string; title: string; category: DocumentCategory; document_date: string | null; note: string; original_name: string; mime_type: string; size_bytes: number; archived_at: string | null; created_at: string };
const categoryText = { prescription: "Verordnung", finding: "Befund", patient_record: "Patientenakte", therapy_report: "Therapiebericht", other: "Sonstiges" };

const t = de.practice.documents;

export function DocumentPanel({ patientId, documents }: { patientId: string; documents: DocumentRow[] }) {
  const [state, action, pending] = useActionState<DocumentActionState, FormData>(uploadPatientDocumentAction, {});
  const [deleteState, deleteAction, deleting] = useActionState<DocumentActionState, FormData>(deletePatientDocumentAction, {});
  const [categoryFilter, setCategoryFilter] = useState<"all" | DocumentCategory>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const visibleDocuments = documents.filter(
    (document) =>
      (categoryFilter === "all" || document.category === categoryFilter) &&
      (showArchived || !document.archived_at)
  );
  const archivedCount = documents.filter((document) => document.archived_at).length;

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

    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="document-filter-category">{t.filterCategory}</Label>
        <select
          id="document-filter-category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as "all" | DocumentCategory)}
          className="h-10 rounded-md border bg-background px-3"
        >
          <option value="all">{t.filterAllCategories}</option>
          <option value="prescription">Verordnung</option>
          <option value="finding">Befund</option>
          <option value="patient_record">Patientenakte</option>
          <option value="therapy_report">Therapiebericht</option>
          <option value="other">Sonstiges</option>
        </select>
      </div>
      <label className="flex h-10 items-center gap-2 text-base">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(event) => setShowArchived(event.target.checked)}
          className="size-5"
        />
        {t.filterShowArchived(archivedCount)}
      </label>
    </div>

    <FormMessage error={deleteState.error} success={deleteState.success} />

    {visibleDocuments.length ? <ul className="flex flex-col gap-2">{visibleDocuments.map((document) => <li key={document.id}><Card><CardContent className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="flex items-center gap-2"><p className="font-semibold">{document.title}</p>{document.archived_at ? <Badge variant="secondary">Archiviert</Badge> : null}</div><p className="text-sm text-muted-foreground">{categoryText[document.category]} · {(document.size_bytes / 1024).toFixed(0)} KB</p></div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><a href={`/practice/patients/${patientId}/documents/${document.id}`}>Öffnen</a></Button>
          {!document.archived_at ? <form action={archivePatientDocumentAction}><input type="hidden" name="patientId" value={patientId} /><input type="hidden" name="documentId" value={document.id} /><Button type="submit" variant="outline">Archivieren</Button></form> : null}
          {document.archived_at && confirmingId !== document.id ? (
            <Button type="button" variant="outline" className="text-destructive" onClick={() => setConfirmingId(document.id)}>
              {t.deleteButton}
            </Button>
          ) : null}
        </div>
      </div>
      {confirmingId === document.id ? (
        <form action={deleteAction} className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <input type="hidden" name="patientId" value={patientId} />
          <input type="hidden" name="documentId" value={document.id} />
          <input type="hidden" name="confirm" value="delete" />
          <p className="text-sm font-semibold">{t.deleteConfirmHint}</p>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={deleting}>
              {deleting ? de.common.loading : t.deleteConfirm}
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirmingId(null)}>
              {de.common.cancel}
            </Button>
          </div>
        </form>
      ) : null}
    </CardContent></Card></li>)}</ul> : <p className="rounded-lg border p-4 text-sm text-muted-foreground">{documents.length ? t.filterEmpty : "Noch keine Dokumente vorhanden."}</p>}
  </section>;
}
