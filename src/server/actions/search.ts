"use server";

import { getSessionContext } from "@/server/services/session";
import { searchExercises, searchPatients, type SearchHit } from "@/server/services/search";

export type WorkspaceSearchResult = {
  patients: SearchHit[];
  exercises: SearchHit[];
};

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

export async function searchWorkspaceAction(rawQuery: string): Promise<WorkspaceSearchResult> {
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!membership || query.length < MIN_QUERY_LENGTH) {
    return { patients: [], exercises: [] };
  }

  const [patients, exercises] = await Promise.all([
    searchPatients(membership.practiceId, query),
    searchExercises(membership.practiceId, query),
  ]);
  return { patients, exercises };
}
