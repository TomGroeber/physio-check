/**
 * ============================================================
 * RECHTSDOKUMENTE – VERSIONSSTÄNDE
 * ============================================================
 * `version` erscheint als "Stand"-Datum auf der jeweiligen Seite
 * UND wird bei jeder Einwilligung in `consent_records` gespeichert
 * (Spalte `document_version`). Bei jeder inhaltlich relevanten
 * Änderung eines Texts dieses Datum aktualisieren, damit alte
 * Einwilligungen nachvollziehbar der damaligen Textfassung
 * zugeordnet bleiben. `type` ist der stabile Bezeichner in der
 * Datenbank und ändert sich nicht.
 * ============================================================
 */
export const legalDocuments = {
  privacyPolicy: { type: "privacy_policy", version: "2026-07-22" },
  imprint: { type: "imprint", version: "2026-09-06" },
  termsOfUse: { type: "terms_of_use", version: "2026-09-06" },
  cookiePolicy: { type: "cookie_policy", version: "2026-09-06" },
} as const;

export type LegalDocumentKey = keyof typeof legalDocuments;
