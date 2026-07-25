"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { onboardPracticeAction, type OnboardingState } from "@/server/actions/platform-admin";
import { de } from "@/messages/de";
import { branding } from "@/config/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassPanel, GlassPanelHeader, GlassPanelTitle } from "@/components/ui/glass-panel";
import { FormMessage } from "@/components/auth/form-message";

const t = de.admin.onboarding;

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState<OnboardingState, FormData>(
    onboardPracticeAction,
    {}
  );
  const [status, setStatus] = useState<"trial" | "active">("trial");
  const [copied, setCopied] = useState(false);

  if (state.inviteLink) {
    return (
      <GlassPanel strong className="flex max-w-xl flex-col gap-4">
        <h1 className="text-xl font-bold">{t.successHeading}</h1>
        <p className="text-muted-foreground">{t.successBody}</p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-link">{t.inviteLinkLabel}</Label>
          <div className="flex gap-2">
            <Input id="invite-link" readOnly value={state.inviteLink} className="font-mono text-sm" />
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(state.inviteLink!);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? t.copied : t.copyLink}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t.noEmailProviderHint}</p>
        <Button asChild className="self-start">
          <Link href={`/admin/practices/${state.practiceId}`}>{t.goToPractice}</Link>
        </Button>
      </GlassPanel>
    );
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage error={state.error} />

      <GlassPanel>
        <GlassPanelHeader>
          <GlassPanelTitle>{t.stepPractice}</GlassPanelTitle>
        </GlassPanelHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="name">{t.practiceName}</Label>
            <Input id="name" name="name" required maxLength={200} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="addressStreet">{t.addressStreet}</Label>
            <Input id="addressStreet" name="addressStreet" maxLength={200} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressPostalCode">{t.addressPostalCode}</Label>
            <Input id="addressPostalCode" name="addressPostalCode" maxLength={20} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressCity">{t.addressCity}</Label>
            <Input id="addressCity" name="addressCity" maxLength={120} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">{t.country}</Label>
            <Input id="country" name="country" maxLength={80} placeholder="Luxemburg" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">{t.timezone}</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={branding.defaultTimeZone}
              maxLength={80}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">{t.phone}</Label>
            <Input id="phone" name="phone" maxLength={40} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="supportEmail">{t.supportEmail}</Label>
            <Input id="supportEmail" name="supportEmail" type="email" maxLength={200} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="website">{t.website}</Label>
            <Input id="website" name="website" type="url" maxLength={300} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">{t.status}</Label>
            <Select name="status" value={status} onValueChange={(v) => setStatus(v as "trial" | "active")}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">{t.statusTrial}</SelectItem>
                <SelectItem value="active">{t.statusActive}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status === "trial" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="trialEndsAt">{t.trialEndsAt}</Label>
              <Input id="trialEndsAt" name="trialEndsAt" type="date" />
            </div>
          ) : null}
        </div>
      </GlassPanel>

      <GlassPanel>
        <GlassPanelHeader>
          <GlassPanelTitle>{t.stepAdmin}</GlassPanelTitle>
        </GlassPanelHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="adminName">{t.adminName}</Label>
            <Input id="adminName" name="adminName" required maxLength={200} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="adminEmail">{t.adminEmail}</Label>
            <Input id="adminEmail" name="adminEmail" type="email" required maxLength={200} />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t.adminEmailHint}</p>
      </GlassPanel>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? de.common.loading : t.submit}
      </Button>
    </form>
  );
}
