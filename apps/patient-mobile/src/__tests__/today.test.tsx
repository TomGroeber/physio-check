import { render, screen, waitFor } from "@testing-library/react-native";
import Today from "../app/(tabs)/today";
import { getTodayData, type TodayData, type TodayExercise } from "@/data/today";

jest.mock("@/lib/supabase", () => ({
  supabase: {},
  apiBaseUrl: "http://test",
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("@/lib/session", () => ({
  useSession: () => ({
    initializing: false,
    session: { user: { id: "petra" } },
    isPracticeMember: false,
    link: { practiceName: "Demo-Praxis" },
    fullName: "Petra Beispielfrau",
    refreshContext: jest.fn(),
    signOut: jest.fn(),
  }),
}));
jest.mock("@/data/today", () => ({ getTodayData: jest.fn() }));

const exercise = (overrides: Partial<TodayExercise>): TodayExercise => ({
  planItemId: "item-1",
  title: "Brücke (Beckenheben)",
  sets: 3,
  repetitions: 12,
  holdSeconds: null,
  totalDurationSeconds: null,
  note: "",
  sortOrder: 1,
  plannedToday: 1,
  documentedToday: 0,
  completedToday: 0,
  canDocument: true,
  fullyDocumentedToday: false,
  fullyCompletedToday: false,
  weeklyProgress: null,
  ...overrides,
});

const todayData = (exercises: TodayExercise[]): TodayData => ({
  exercises,
  hasPlan: true,
  nextAppointment: null,
  timezone: "Europe/Luxembourg",
});

describe("Heute-Ansicht", () => {
  it("feiert NUR, wenn alles wirklich erledigt (completed) ist", async () => {
    (getTodayData as jest.Mock).mockResolvedValue(
      todayData([
        exercise({
          documentedToday: 1,
          completedToday: 1,
          canDocument: false,
          fullyDocumentedToday: true,
          fullyCompletedToday: true,
        }),
      ])
    );
    await render(<Today />);
    await waitFor(() => expect(screen.getByText("Geschafft!")).toBeTruthy());
  });

  it("bleibt neutral, wenn dokumentiert, aber nicht alles erledigt ist", async () => {
    (getTodayData as jest.Mock).mockResolvedValue(
      todayData([
        exercise({
          documentedToday: 1,
          canDocument: false,
          fullyDocumentedToday: true,
          fullyCompletedToday: false,
        }),
      ])
    );
    await render(<Today />);
    await waitFor(() =>
      expect(screen.getByText("Für heute ist alles eingetragen. Danke!")).toBeTruthy()
    );
    expect(screen.queryByText("Geschafft!")).toBeNull();
  });

  it("zeigt den Leerzustand ohne Plan", async () => {
    (getTodayData as jest.Mock).mockResolvedValue({
      exercises: [],
      hasPlan: false,
      nextAppointment: null,
      timezone: "Europe/Luxembourg",
    });
    await render(<Today />);
    await waitFor(() =>
      expect(
        screen.getByText(/noch keinen Übungsplan/)
      ).toBeTruthy()
    );
  });
});
