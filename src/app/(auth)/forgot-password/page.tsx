import type { Metadata } from "next";
import { de } from "@/messages/de";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: de.auth.forgotPassword.title };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
