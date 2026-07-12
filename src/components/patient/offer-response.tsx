"use client";

import { useActionState } from "react";
import {
  acceptOfferAction,
  declineOfferAction,
  type OfferActionState,
} from "@/server/actions/offers";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";

const t = de.patient.appointments;

type PatientOffer = {
  id: string;
  whenText: string;
  therapistName: string;
  locationName: string;
};

/** Patientenansicht: offene Terminangebote annehmen oder ablehnen. */
export function OfferResponse({ offers }: { offers: PatientOffer[] }) {
  const [acceptState, acceptAction, accepting] = useActionState<OfferActionState, FormData>(acceptOfferAction, {});
  const [declineState, declineAction, declining] = useActionState<OfferActionState, FormData>(declineOfferAction, {});

  if (!offers.length && !acceptState.success && !acceptState.error) return null;

  return (
    <section aria-labelledby="offers-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="offers-heading" className="text-xl font-bold">
          {t.offersHeading}
        </h2>
        <p className="text-base text-muted-foreground">{t.offersHint}</p>
      </div>
      <FormMessage
        error={acceptState.error ?? declineState.error}
        success={acceptState.success ?? declineState.success}
      />
      <ul className="flex flex-col gap-3">
        {offers.map((offer) => (
          <li key={offer.id}>
            <Card>
              <CardContent className="flex flex-col gap-3 p-5">
                <p className="text-lg font-semibold">{offer.whenText}</p>
                <p className="text-base text-muted-foreground">
                  {offer.therapistName}
                  {offer.locationName ? ` · ${offer.locationName}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <form action={acceptAction}>
                    <input type="hidden" name="offerId" value={offer.id} />
                    <Button type="submit" disabled={accepting || declining} className="h-12 text-base">
                      {accepting ? de.common.loading : t.acceptOffer}
                    </Button>
                  </form>
                  <form action={declineAction}>
                    <input type="hidden" name="offerId" value={offer.id} />
                    <Button type="submit" variant="outline" disabled={accepting || declining} className="h-12 text-base">
                      {declining ? de.common.loading : t.declineOffer}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
