import type { Metadata } from "next";
import { de } from "@/messages/de";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: de.admin.onboarding.title };

export default function NewPracticePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">{de.admin.onboarding.title}</h1>
      <OnboardingForm />
    </div>
  );
}
