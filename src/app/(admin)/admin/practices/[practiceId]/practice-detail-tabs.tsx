"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassPanel, GlassPanelHeader, GlassPanelTitle } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormMessage } from "@/components/auth/form-message";
import { CALENDAR_COLORS, colorStyle } from "@/lib/calendar-colors";
import { de } from "@/messages/de";
import {
  createPracticeMemberRecoveryAction,
  createStaffInviteAsPlatformAdminAction,
  renewStaffInviteAsPlatformAdminAction,
  revokeStaffInviteAsPlatformAdminAction,
  setPracticeLifecycleAction,
  setPracticeMemberStatusAction,
  updatePracticeProfileAsPlatformAdminAction,
  updatePracticeSettingsAsPlatformAdminAction,
  type PracticeMemberRecoveryActionState,
  type SimpleActionState,
  type StaffInviteActionState,
} from "@/server/actions/platform-admin";
import type { PracticeDetailForAdmin } from "@/server/services/platform-admin";

const t = de.admin.detail;
const tSettings = de.admin.settingsForm;
const tStaff = de.admin.staffManagement;

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? de.common.loading : children}
    </Button>
  );
}

function ProfileTab({ practice }: { practice: PracticeDetailForAdmin }) {
  const action = updatePracticeProfileAsPlatformAdminAction.bind(null, practice.id);
  const [state, formAction] = useActionState<SimpleActionState, FormData>(action, {});

  return (
    <GlassPanel>
      <form action={formAction} className="flex flex-col gap-4">
        <FormMessage error={state.error} success={state.success ? de.common.saved : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="name">{de.admin.onboarding.practiceName}</Label>
            <Input id="name" name="name" defaultValue={practice.name} required maxLength={200} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="addressStreet">{de.admin.onboarding.addressStreet}</Label>
            <Input id="addressStreet" name="addressStreet" defaultValue={practice.addressStreet} maxLength={200} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressPostalCode">{de.admin.onboarding.addressPostalCode}</Label>
            <Input
              id="addressPostalCode"
              name="addressPostalCode"
              defaultValue={practice.addressPostalCode}
              maxLength={20}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressCity">{de.admin.onboarding.addressCity}</Label>
            <Input id="addressCity" name="addressCity" defaultValue={practice.addressCity} maxLength={120} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">{de.admin.onboarding.timezone}</Label>
            <Input id="timezone" name="timezone" defaultValue={practice.timezone} required maxLength={80} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">{de.admin.onboarding.phone}</Label>
            <Input id="phone" name="phone" defaultValue={practice.phone} maxLength={40} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="supportEmail">{de.admin.onboarding.supportEmail}</Label>
            <Input id="supportEmail" name="supportEmail" type="email" defaultValue={practice.supportEmail} maxLength={200} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="supportUrl">{de.admin.config.supportUrl}</Label>
            <Input id="supportUrl" name="supportUrl" type="url" defaultValue={practice.supportUrl} maxLength={300} />
          </div>
        </div>
        <SubmitButton>{t.saveProfile}</SubmitButton>
      </form>
    </GlassPanel>
  );
}

function LifecycleTab({ practice }: { practice: PracticeDetailForAdmin }) {
  const action = setPracticeLifecycleAction.bind(null, practice.id);
  const [state, formAction] = useActionState<SimpleActionState, FormData>(action, {});
  const [status, setStatus] = useState(practice.status);

  return (
    <GlassPanel>
      <form action={formAction} className="flex flex-col gap-4">
        <FormMessage error={state.error} success={state.success ? de.common.saved : undefined} />
        <p className="text-sm text-muted-foreground">{t.lifecycleHint}</p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">{de.admin.practices.statusLabel}</Label>
          <Select name="status" value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger id="status" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trial">{de.admin.practices.statusTrial}</SelectItem>
              <SelectItem value="active">{de.admin.practices.statusActive}</SelectItem>
              <SelectItem value="suspended">{de.admin.practices.statusSuspended}</SelectItem>
              <SelectItem value="archived">{de.admin.practices.statusArchived}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {status === "trial" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="trialEndsAt">{de.admin.onboarding.trialEndsAt}</Label>
            <Input
              id="trialEndsAt"
              name="trialEndsAt"
              type="date"
              defaultValue={practice.trialEndsAt?.slice(0, 10) ?? ""}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="internalNote">{t.internalNote}</Label>
          <Textarea id="internalNote" name="internalNote" defaultValue={practice.internalNote} maxLength={1000} rows={3} />
          <p className="text-sm text-muted-foreground">{t.internalNoteHint}</p>
        </div>
        <SubmitButton>{t.saveLifecycle}</SubmitButton>
      </form>
    </GlassPanel>
  );
}

/** Eigener Zustand pro Zeile, da eine erneuerte Einladung den neuen Link nur einmalig zeigt. */
function RenewInviteButton({ practiceId, inviteId }: { practiceId: string; inviteId: string }) {
  const [state, formAction] = useActionState<StaffInviteActionState, FormData>(
    renewStaffInviteAsPlatformAdminAction.bind(null, practiceId),
    {}
  );

  if (state.inviteLink) {
    return <Input readOnly value={state.inviteLink} className="w-56 font-mono text-xs" />;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="inviteId" value={inviteId} />
      <Button type="submit" variant="outline" size="sm">
        {t.renew}
      </Button>
    </form>
  );
}

/**
 * Zugangs-Wiederherstellung (D-113): für Mitglieder, die sowohl
 * Passwort als auch Zugriff auf die alte E-Mail-Adresse verloren
 * haben. Zusammenklappbares Inline-Formular statt eigenem Dialog, wie
 * der Rest dieser Seite (kein neues UI-Muster).
 */
function MemberRecoveryButton({ practiceId, memberId }: { practiceId: string; memberId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<PracticeMemberRecoveryActionState, FormData>(
    createPracticeMemberRecoveryAction.bind(null, practiceId),
    {}
  );

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t.resetAccess}
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-2 rounded-xl bg-white/10 p-3">
      <input type="hidden" name="practiceMemberId" value={memberId} />
      <p className="text-xs text-muted-foreground">{t.resetAccessDialogHint}</p>
      <FormMessage error={state.error} />
      {state.recoveryLink ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t.resetAccessLinkCreated}</p>
          <Input readOnly value={state.recoveryLink} className="font-mono text-sm" />
          <p className="text-xs text-muted-foreground">{t.resetAccessHint}</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`recovery-email-${memberId}`} className="text-xs">
              {t.resetAccessNewEmail}
            </Label>
            <Input
              id={`recovery-email-${memberId}`}
              name="newEmail"
              type="email"
              required
              maxLength={200}
              className="h-9"
            />
          </div>
          <SubmitButton>{t.resetAccessSubmit}</SubmitButton>
        </div>
      )}
      <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setOpen(false)}>
        {de.common.close}
      </Button>
    </form>
  );
}

function MembersTab({ practice }: { practice: PracticeDetailForAdmin }) {
  const [inviteState, inviteAction] = useActionState<StaffInviteActionState, FormData>(
    createStaffInviteAsPlatformAdminAction.bind(null, practice.id),
    {}
  );

  return (
    <div className="flex flex-col gap-6">
      <GlassPanel>
        <GlassPanelHeader>
          <GlassPanelTitle>{t.membersHeading}</GlassPanelTitle>
        </GlassPanelHeader>
        {practice.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.membersEmpty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-glass-border">
            {practice.members.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{member.fullName || "(ohne Namen)"}</span>
                  <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                    {member.role === "admin" ? t.roleAdmin : t.roleTherapist}
                  </Badge>
                  <Badge variant={member.isActive ? "outline" : "destructive"}>
                    {member.isActive ? t.statusActiveLabel : t.statusInactiveLabel}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={setPracticeMemberStatusAction} className="flex gap-2">
                    <input type="hidden" name="memberId" value={member.id} />
                    <input type="hidden" name="practiceId" value={practice.id} />
                    <input type="hidden" name="role" value={member.role} />
                    <input type="hidden" name="isActive" value={(!member.isActive).toString()} />
                    <Button type="submit" variant="outline" size="sm">
                      {member.isActive ? t.deactivate : t.reactivate}
                    </Button>
                  </form>
                  <MemberRecoveryButton practiceId={practice.id} memberId={member.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{t.lastAdminProtected}</p>
      </GlassPanel>

      <GlassPanel>
        <GlassPanelHeader>
          <GlassPanelTitle>{t.openInvitesHeading}</GlassPanelTitle>
        </GlassPanelHeader>
        {practice.openInvites.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.openInvitesEmpty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-glass-border">
            {practice.openInvites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{invite.email}</span>
                  <Badge variant="secondary">{invite.role === "admin" ? t.roleAdmin : t.roleTherapist}</Badge>
                </div>
                <div className="flex gap-2">
                  <form action={revokeStaffInviteAsPlatformAdminAction}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <input type="hidden" name="practiceId" value={practice.id} />
                    <Button type="submit" variant="outline" size="sm">
                      {t.revoke}
                    </Button>
                  </form>
                  <RenewInviteButton practiceId={practice.id} inviteId={invite.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>

      <GlassPanel>
        <GlassPanelHeader>
          <GlassPanelTitle>{t.inviteNewAdmin}</GlassPanelTitle>
        </GlassPanelHeader>
        <form action={inviteAction} className="flex flex-col gap-4">
          <FormMessage error={inviteState.error} />
          {inviteState.inviteLink ? (
            <div className="flex flex-col gap-2 rounded-xl bg-white/10 p-3">
              <p className="text-sm font-medium">{tStaff.inviteLinkCreated}</p>
              <Input readOnly value={inviteState.inviteLink} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">{tStaff.inviteHint}</p>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-name">{tStaff.inviteName}</Label>
              <Input id="invite-name" name="name" required maxLength={200} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">{tStaff.inviteEmail}</Label>
              <Input id="invite-email" name="email" type="email" required maxLength={200} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-role">{tStaff.inviteRole}</Label>
              <Select name="role" defaultValue="therapist">
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t.roleAdmin}</SelectItem>
                  <SelectItem value="therapist">{t.roleTherapist}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SubmitButton>{tStaff.inviteSubmit}</SubmitButton>
        </form>
      </GlassPanel>
    </div>
  );
}

function SettingsTab({ practice }: { practice: PracticeDetailForAdmin }) {
  const action = updatePracticeSettingsAsPlatformAdminAction.bind(null, practice.id);
  const [state, formAction] = useActionState<SimpleActionState, FormData>(action, {});
  const settings = practice.settings;

  return (
    <GlassPanel>
      <form action={formAction} className="flex flex-col gap-4">
        <FormMessage error={state.error} success={state.success ? de.common.saved : undefined} />
        <p className="text-sm text-muted-foreground">{tSettings.hint}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="defaultAppointmentDurationMinutes">{tSettings.defaultAppointmentDuration}</Label>
            <Input
              id="defaultAppointmentDurationMinutes"
              name="defaultAppointmentDurationMinutes"
              type="number"
              defaultValue={settings.defaultAppointmentDurationMinutes ?? 30}
              min={15}
              max={120}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cancellationNoticeHours">{tSettings.cancellationNoticeHours}</Label>
            <Input
              id="cancellationNoticeHours"
              name="cancellationNoticeHours"
              type="number"
              defaultValue={settings.cancellationNoticeHours ?? 24}
              min={0}
              max={168}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lowSessionsThreshold">{tSettings.lowSessionsThreshold}</Label>
            <Input
              id="lowSessionsThreshold"
              name="lowSessionsThreshold"
              type="number"
              defaultValue={settings.lowSessionsThreshold ?? 2}
              min={1}
              max={20}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="accentColor">{tSettings.accentColor}</Label>
            <Select name="accentColor" defaultValue={settings.accentColor ?? "teal"}>
              <SelectTrigger id="accentColor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALENDAR_COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    <span className={`mr-2 inline-block size-3 rounded-full ${colorStyle(color).dot}`} />
                    {colorStyle(color).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="cancellationNoticeText">{tSettings.cancellationNoticeText}</Label>
            <Textarea
              id="cancellationNoticeText"
              name="cancellationNoticeText"
              defaultValue={settings.cancellationNoticeText ?? ""}
              maxLength={300}
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="patientSafetyText">{tSettings.patientSafetyText}</Label>
            <Textarea
              id="patientSafetyText"
              name="patientSafetyText"
              defaultValue={settings.patientSafetyText ?? ""}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
        <SubmitButton>{tSettings.save}</SubmitButton>
      </form>
    </GlassPanel>
  );
}

export function PracticeDetailTabs({ practice }: { practice: PracticeDetailForAdmin }) {
  return (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">{t.tabProfile}</TabsTrigger>
        <TabsTrigger value="lifecycle">{t.tabLifecycle}</TabsTrigger>
        <TabsTrigger value="members">{t.tabMembers}</TabsTrigger>
        <TabsTrigger value="settings">{t.tabSettings}</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <ProfileTab practice={practice} />
      </TabsContent>
      <TabsContent value="lifecycle">
        <LifecycleTab practice={practice} />
      </TabsContent>
      <TabsContent value="members">
        <MembersTab practice={practice} />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsTab practice={practice} />
      </TabsContent>
    </Tabs>
  );
}
