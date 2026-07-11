import type { Metadata } from "next";
import { de } from "@/messages/de";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: de.auth.resetPassword.title };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
