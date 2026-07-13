"use client";

import { useActionState } from "react";
import {
  markFeedbackReviewedAction,
  type FeedbackReviewState,
} from "@/server/actions/adherence";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

export function FeedbackReviewButton({ logId, patientId }: { logId: string; patientId: string }) {
  const [state, action, pending] = useActionState<FeedbackReviewState, FormData>(
    markFeedbackReviewedAction,
    {}
  );
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="logId" value={logId} />
      <input type="hidden" name="patientId" value={patientId} />
      <Button type="submit" variant="outline" disabled={pending} className="h-9 text-sm">
        {pending ? de.common.loading : de.practice.analytics.markReviewed}
      </Button>
      <FormMessage error={state.error} success={state.success} />
    </form>
  );
}
