"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updatePlatformConfigAction,
  updatePlatformFeatureFlagAction,
  type PlatformConfigActionState,
} from "@/server/actions/platform-admin";
import { GlassPanel, GlassPanelHeader, GlassPanelTitle } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/auth/form-message";
import { de } from "@/messages/de";
import { MAX_UPLOAD_MB_CEILING } from "@/lib/validation/platform-admin";
import type { PlatformConfig } from "@/server/services/platform-admin";

const t = de.admin.config;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? de.common.loading : t.save}
    </Button>
  );
}

export function ConfigForm({ config }: { config: PlatformConfig }) {
  const [state, formAction] = useActionState<PlatformConfigActionState, FormData>(
    updatePlatformConfigAction,
    {}
  );
  const accentFlag = config.featureFlags.practiceAccentColor ?? {
    enabled: true,
    defaultForNewPractices: true,
  };

  return (
    <div className="flex flex-col gap-6">
      <GlassPanel>
        <form action={formAction} className="flex flex-col gap-4">
          <FormMessage error={state.error} success={state.success ? de.common.saved : undefined} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="productName">{t.productName}</Label>
              <Input id="productName" name="productName" defaultValue={config.productName} maxLength={200} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="supportEmail">{t.supportEmail}</Label>
              <Input id="supportEmail" name="supportEmail" type="email" defaultValue={config.supportEmail} maxLength={200} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="supportUrl">{t.supportUrl}</Label>
              <Input id="supportUrl" name="supportUrl" type="url" defaultValue={config.supportUrl} maxLength={300} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="privacyUrl">{t.privacyUrl}</Label>
              <Input id="privacyUrl" name="privacyUrl" type="url" defaultValue={config.privacyUrl} maxLength={300} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="imprintUrl">{t.imprintUrl}</Label>
              <Input id="imprintUrl" name="imprintUrl" type="url" defaultValue={config.imprintUrl} maxLength={300} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="defaultNewPracticeTimezone">{t.defaultTimezone}</Label>
              <Input
                id="defaultNewPracticeTimezone"
                name="defaultNewPracticeTimezone"
                defaultValue={config.defaultNewPracticeTimezone}
                maxLength={80}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="maxUploadMb">{t.maxUploadMb}</Label>
              <Input
                id="maxUploadMb"
                name="maxUploadMb"
                type="number"
                min={1}
                max={MAX_UPLOAD_MB_CEILING}
                defaultValue={config.maxUploadMb}
              />
              <p className="text-xs text-muted-foreground">{t.maxUploadHint}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="maintenanceActive"
              name="maintenanceActive"
              defaultChecked={config.maintenanceActive}
              className="size-4"
            />
            <Label htmlFor="maintenanceActive">{t.maintenanceActive}</Label>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="maintenanceMessage">{t.maintenanceMessage}</Label>
            <Textarea
              id="maintenanceMessage"
              name="maintenanceMessage"
              defaultValue={config.maintenanceMessage}
              maxLength={300}
              rows={2}
            />
          </div>
          <SubmitButton />
        </form>
      </GlassPanel>

      <GlassPanel>
        <GlassPanelHeader>
          <GlassPanelTitle>{t.featureFlagsHeading}</GlassPanelTitle>
        </GlassPanelHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/10 p-3">
            <span className="font-medium">{t.featureFlagAccentColor}</span>
            <div className="flex gap-2">
              <form action={updatePlatformFeatureFlagAction}>
                <input type="hidden" name="flagKey" value="practiceAccentColor" />
                <input type="hidden" name="enabled" value={(!accentFlag.enabled).toString()} />
                <input
                  type="hidden"
                  name="defaultForNewPractices"
                  value={accentFlag.defaultForNewPractices.toString()}
                />
                <Button type="submit" variant={accentFlag.enabled ? "outline" : "default"} size="sm">
                  {accentFlag.enabled ? t.flagDisabled : t.flagEnabled}
                </Button>
              </form>
              <form action={updatePlatformFeatureFlagAction}>
                <input type="hidden" name="flagKey" value="practiceAccentColor" />
                <input type="hidden" name="enabled" value={accentFlag.enabled.toString()} />
                <input
                  type="hidden"
                  name="defaultForNewPractices"
                  value={(!accentFlag.defaultForNewPractices).toString()}
                />
                <Button type="submit" variant="outline" size="sm">
                  {t.flagDefaultForNew}: {accentFlag.defaultForNewPractices ? t.flagEnabled : t.flagDisabled}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
