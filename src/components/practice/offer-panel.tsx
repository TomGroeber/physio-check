"use client";

import { useActionState } from "react";
import {
  createOfferAction,
  withdrawOfferAction,
  type OfferActionState,
} from "@/server/actions/offers";
import { FormMessage } from "@/components/auth/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

const t = de.practice.offers;

type FreedSlot = {
  id: string;
  text: string;
};
type Offer = {
  id: string;
  status: "offered" | "accepted" | "declined" | "withdrawn";
  patientName: string;
  therapistName: string;
  whenText: string;
};

const durations = [15, 20, 30, 45, 60, 90] as const;

/** Praxisseite: freie Zeitfenster, Angebot erstellen, offene Angebote verwalten. */
export function OfferPanel({
  patients,
  therapists,
  freedSlots,
  offers,
}: {
  patients: { id: string; fullName: string }[];
  therapists: { id: string; fullName: string }[];
  freedSlots: FreedSlot[];
  offers: Offer[];
}) {
  const [createState, createAction, creating] = useActionState<OfferActionState, FormData>(createOfferAction, {});
  const [withdrawState, withdrawAction, withdrawing] = useActionState<OfferActionState, FormData>(withdrawOfferAction, {});

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-labelledby="freed-slots-heading">
        <div>
          <h2 id="freed-slots-heading" className="text-xl font-bold">
            {t.freedSlotsHeading}
          </h2>
          <p className="text-sm text-muted-foreground">{t.freedSlotsHint}</p>
        </div>
        <Card>
          <CardContent className="p-5">
            {freedSlots.length === 0 ? (
              <p className="text-base text-muted-foreground">{t.freedSlotsEmpty}</p>
            ) : (
              <ul className="flex flex-col gap-1 text-base">
                {freedSlots.map((slot) => (
                  <li key={slot.id}>{slot.text}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="create-offer-heading">
        <h2 id="create-offer-heading" className="text-xl font-bold">
          {t.createTitle}
        </h2>
        <Card>
          <CardContent className="p-5">
            <form action={createAction} className="grid gap-4 md:grid-cols-2">
              <FormMessage error={createState.error} success={createState.success} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="offer-patient">{de.practice.waitlist.patientLabel}</Label>
                <select id="offer-patient" name="patientId" required defaultValue="" className="h-10 rounded-md border bg-background px-3">
                  <option value="" disabled>
                    {de.practice.waitlist.patientPlaceholder}
                  </option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="offer-therapist">{t.therapistLabel}</Label>
                <select id="offer-therapist" name="therapistMemberId" required defaultValue="" className="h-10 rounded-md border bg-background px-3">
                  <option value="" disabled>
                    {de.practice.waitlist.patientPlaceholder}
                  </option>
                  {therapists.map((therapist) => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="offer-date">{t.dateLabel}</Label>
                <Input id="offer-date" name="date" type="date" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="offer-time">{t.startTimeLabel}</Label>
                <Input id="offer-time" name="startTime" type="time" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="offer-duration">{t.durationLabel}</Label>
                <select id="offer-duration" name="durationMinutes" defaultValue="30" className="h-10 rounded-md border bg-background px-3">
                  {durations.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} Minuten
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={creating} className="h-11 self-end text-base">
                {creating ? de.common.loading : t.create}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="offers-heading">
        <h2 id="offers-heading" className="text-xl font-bold">
          {t.offersHeading}
        </h2>
        <FormMessage error={withdrawState.error} success={withdrawState.success} />
        {offers.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-base text-muted-foreground">{t.offersEmpty}</CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {offers.map((offer) => (
              <li key={offer.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold">{offer.patientName}</span>
                        <Badge variant={offer.status === "offered" ? "default" : "secondary"}>
                          {t.status[offer.status]}
                        </Badge>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {offer.whenText}
                        {offer.therapistName ? ` · ${offer.therapistName}` : ""}
                      </span>
                    </div>
                    {offer.status === "offered" ? (
                      <form action={withdrawAction}>
                        <input type="hidden" name="offerId" value={offer.id} />
                        <Button type="submit" variant="outline" disabled={withdrawing}>
                          {t.withdraw}
                        </Button>
                      </form>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
