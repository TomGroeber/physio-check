"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  updateOwnPracticeProfileAction,
  updateOwnPracticeSettingsAction,
} from "@/server/actions/practice-settings";
import {
  createStaffInviteAction,
  renewStaffInviteAction,
  revokeStaffInviteAction,
  setPracticeMemberStatusAction,
  type StaffInviteFormState,
} from "@/server/actions/staff-invites";
import type { SimpleActionState } from "@/server/actions/platform-admin";
import type { PracticeSettings } from "@/lib/validation/platform-admin";

const tOnboarding = de.admin.onboarding;
const tSettings = de.admin.settingsForm;
const tDetail = de.admin.detail;
const tStaff = de.admin.staffManagement;

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? de.common.loading : children}
    </Button>
  );
}

/** Eigener Zustand pro Zeile, da eine erneuerte Einladung den neuen Link nur einmalig zeigt. */
function RenewInviteButton({ inviteId }: { inviteId: string }) {
  const [state, formAction] = useActionState<StaffInviteFormState, FormData>(
    renewStaffInviteAction,
    {}
  );

  if (state.inviteLink) {
    return (
      <div className="flex flex-col gap-1">
        <Input readOnly value={state.inviteLink} className="w-56 font-mono text-xs" />
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="inviteId" value={inviteId} />
      <SubmitButton>{tDetail.renew}</SubmitButton>
    </form>
  );
}

type Practice = {
  name: string;
  address_street: string;
  address_postal_code: string;
  address_city: string;
  phone: string;
  timezone: string;
  support_email: string;
  support_url: string;
};

export function ProfileForm({ practice }: { practice: Practice }) {
  const [state, formAction] = useActionState<SimpleActionState, FormData>(
    updateOwnPracticeProfileAction,
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{de.practice.settings.editProfile}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <FormMessage error={state.error} success={state.success ? de.common.saved : undefined} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="name">{tOnboarding.practiceName}</Label>
              <Input id="name" name="name" defaultValue={practice.name} required maxLength={200} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="addressStreet">{tOnboarding.addressStreet}</Label>
              <Input id="addressStreet" name="addressStreet" defaultValue={practice.address_street} maxLength={200} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="addressPostalCode">{tOnboarding.addressPostalCode}</Label>
              <Input
                id="addressPostalCode"
                name="addressPostalCode"
                defaultValue={practice.address_postal_code}
                maxLength={20}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="addressCity">{tOnboarding.addressCity}</Label>
              <Input id="addressCity" name="addressCity" defaultValue={practice.address_city} maxLength={120} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone">{tOnboarding.timezone}</Label>
              <Input id="timezone" name="timezone" defaultValue={practice.timezone} required maxLength={80} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{tOnboarding.phone}</Label>
              <Input id="phone" name="phone" defaultValue={practice.phone} maxLength={40} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="supportEmail">{tOnboarding.supportEmail}</Label>
              <Input id="supportEmail" name="supportEmail" type="email" defaultValue={practice.support_email} maxLength={200} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="supportUrl">Support-URL</Label>
              <Input id="supportUrl" name="supportUrl" type="url" defaultValue={practice.support_url} maxLength={300} />
            </div>
          </div>
          <SubmitButton>{de.common.save}</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export function SettingsForm({ settings }: { settings: Partial<PracticeSettings> }) {
  const [state, formAction] = useActionState<SimpleActionState, FormData>(
    updateOwnPracticeSettingsAction,
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{tSettings.heading}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <FormMessage error={state.error} success={state.success ? de.common.saved : undefined} />
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
      </CardContent>
    </Card>
  );
}

type Member = { id: string; fullName: string; role: "admin" | "therapist"; isActive: boolean };
type OpenInvite = { id: string; email: string; role: "admin" | "therapist" };

export function MembersSection({
  members,
  openInvites,
}: {
  members: Member[];
  openInvites: OpenInvite[];
}) {
  const [inviteState, inviteAction] = useActionState<StaffInviteFormState, FormData>(
    createStaffInviteAction,
    {}
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{de.practice.settings.membersHeading}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tDetail.membersEmpty}</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {members.map((member) => (
                <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{member.fullName || "(ohne Namen)"}</span>
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                      {member.role === "admin" ? tDetail.roleAdmin : tDetail.roleTherapist}
                    </Badge>
                    <Badge variant={member.isActive ? "outline" : "destructive"}>
                      {member.isActive ? tDetail.statusActiveLabel : tDetail.statusInactiveLabel}
                    </Badge>
                  </div>
                  <form action={setPracticeMemberStatusAction} className="flex gap-2">
                    <input type="hidden" name="memberId" value={member.id} />
                    <input type="hidden" name="role" value={member.role} />
                    <input type="hidden" name="isActive" value={(!member.isActive).toString()} />
                    <Button type="submit" variant="outline" size="sm">
                      {member.isActive ? tDetail.deactivate : tDetail.reactivate}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">{tDetail.lastAdminProtected}</p>
        </CardContent>
      </Card>

      {openInvites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tDetail.openInvitesHeading}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {openInvites.map((invite) => (
                <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{invite.email}</span>
                    <Badge variant="secondary">
                      {invite.role === "admin" ? tDetail.roleAdmin : tDetail.roleTherapist}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <form action={revokeStaffInviteAction}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <Button type="submit" variant="outline" size="sm">
                        {tDetail.revoke}
                      </Button>
                    </form>
                    <RenewInviteButton inviteId={invite.id} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{tStaff.inviteHeading}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={inviteAction} className="flex flex-col gap-4">
            <FormMessage error={inviteState.error} />
            {inviteState.inviteLink ? (
              <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
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
                    <SelectItem value="admin">{tDetail.roleAdmin}</SelectItem>
                    <SelectItem value="therapist">{tDetail.roleTherapist}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SubmitButton>{tStaff.inviteSubmit}</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
