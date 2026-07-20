import { render, screen, waitFor } from "@testing-library/react-native";
import Today from "../app/(tabs)/today";
import { ThemeProvider } from "@/lib/theme";
import { getTodayData, type TodayData, type TodayExercise } from "@/data/today";
import { web } from "@/messages/de";

jest.mock("@/lib/supabase", () => ({
  supabase: {},
  apiBaseUrl: "http://test",
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock("@/lib/session", () => ({
  useSession: () => ({
    initializing: false,
    session: { user: { id: "petra" } },
    isPracticeMember: false,
    link: { practiceName: "Demo-Praxis" },
    fullName: "Petra Beispielfrau",
    avatarUrl: null,
    refreshContext: jest.fn(),
    signOut: jest.fn(),
  }),
}));
jest.mock("@/data/today", () => ({
  getTodayData: jest.fn(),
  getReminderData: jest.fn(async () => ({
    showExerciseReminder: false,
    planUpdates: [],
  })),
  markNotificationRead: jest.fn(),
}));
jest.mock("@/data/appointments", () => ({
  getUnitSummary: jest.fn(async () => null),
}));

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

const renderToday = () =>
  render(
    <ThemeProvider>
      <Today />
    </ThemeProvider>
  );

describe("Heute-Ansicht (Web-Parität)", () => {
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
    await renderToday();
    await waitFor(() =>
      expect(screen.getByText(web.patient.today.allDoneTitle)).toBeTruthy()
    );
    // Erledigt-Badge der Übungskarte
    expect(screen.getByText(web.patient.today.doneBadge)).toBeTruthy();
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
    await renderToday();
    await waitFor(() =>
      expect(screen.getByText(web.patient.today.allReportedTitle)).toBeTruthy()
    );
    expect(screen.queryByText(web.patient.today.allDoneTitle)).toBeNull();
    expect(screen.getByText(web.patient.today.documentedBadge)).toBeTruthy();
  });

  it("zeigt Begrüßung, Fortschritt und Session-Start wie im Web", async () => {
    (getTodayData as jest.Mock).mockResolvedValue(todayData([exercise({})]));
    await renderToday();
    await waitFor(() =>
      expect(screen.getByText(/Guten Tag, Petra!/)).toBeTruthy()
    );
    expect(screen.getByText(web.patient.today.progressShort(0, 1))).toBeTruthy();
    expect(screen.getByText(web.patient.session.start)).toBeTruthy();
    // Vorgaben-Kurzzeile der Übungskarte
    expect(screen.getByText("3 Sätze · 12 Wiederholungen")).toBeTruthy();
  });

  it("zeigt den Leerzustand ohne Plan", async () => {
    (getTodayData as jest.Mock).mockResolvedValue({
      exercises: [],
      hasPlan: false,
      nextAppointment: null,
      timezone: "Europe/Luxembourg",
    });
    await renderToday();
    await waitFor(() =>
      expect(screen.getByText(web.patient.today.noPlanYet)).toBeTruthy()
    );
  });
});
