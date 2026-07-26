import { z } from "zod";

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, "Bitte geben Sie eine Nachricht ein.")
  .max(2000, "Die Nachricht ist zu lang (maximal 2000 Zeichen).");
