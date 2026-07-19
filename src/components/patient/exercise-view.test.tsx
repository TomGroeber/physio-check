import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ExerciseView } from "./exercise-view";
import type { ExerciseDetail } from "@/server/services/exercise-log";

afterEach(cleanup);

const baseDetail: ExerciseDetail = {
  planItemId: "00000000-0000-0000-0000-000000000001",
  title: "Brücke (Beckenheben)",
  description: "Kräftigt Gesäß und unteren Rücken.",
  startingPosition: "Rückenlage, Beine angewinkelt, Füße hüftbreit aufgestellt.",
  steps: ["Becken langsam anheben.", "Oben kurz halten und langsam absenken."],
  commonMistakes: "Nicht ins Hohlkreuz fallen.",
  equipment: "Gymnastikmatte",
  sets: 3,
  repetitions: 12,
  holdSeconds: null,
  totalDurationSeconds: null,
  restSeconds: 30,
  planNote: "Bitte langsam steigern.",
  schedule: {
    mode: "weekdays",
    weekdays: [1, 3, 5],
    times_per_day: 1,
    preferred_times: ["08:00"],
  },
  videoUrl: "https://example.test/signed-video.mp4",
  posterUrl: "https://example.test/signed-poster.jpg",
  fallbackImageUrl: null,
  captionsUrl: "https://example.test/signed-captions.vtt",
  plannedToday: 1,
  documentedToday: 0,
  completedToday: 0,
  nextOccurrenceIndex: 1,
  canDocument: true,
  fullyDocumentedToday: false,
  fullyCompletedToday: false,
  weeklyProgress: null,
  dueToday: true,
};

describe("ExerciseView", () => {
  it("zeigt das Video vor den kompakten Vorgaben", () => {
    const { container } = render(<ExerciseView detail={baseDetail} />);
    const video = container.querySelector("video");
    const prescription = screen.getByLabelText("Ihre Vorgaben");
    expect(video).not.toBeNull();
    // DOCUMENT_POSITION_FOLLOWING: die Vorgaben stehen NACH dem Video.
    expect(
      video!.compareDocumentPosition(prescription) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("blendet beschreibende Langtexte für Patienten aus", () => {
    render(<ExerciseView detail={baseDetail} />);
    expect(screen.queryByText(/Rückenlage, Beine angewinkelt/)).toBeNull();
    expect(screen.queryByText(/Becken langsam anheben/)).toBeNull();
    expect(screen.queryByText(/Hohlkreuz/)).toBeNull();
    expect(screen.queryByText(/Kräftigt Gesäß/)).toBeNull();
    expect(screen.queryByText("Ausgangsposition")).toBeNull();
    expect(screen.queryByText("So führen Sie die Übung aus")).toBeNull();
  });

  it("zeigt Dosierung, Häufigkeit, Uhrzeiten, Hilfsmittel und Praxisnotiz", () => {
    render(<ExerciseView detail={baseDetail} />);
    expect(screen.getByText("3 Sätze")).toBeInTheDocument();
    expect(screen.getByText("12 Wiederholungen")).toBeInTheDocument();
    expect(screen.getByText(/30 Sek. Pause/)).toBeInTheDocument();
    expect(screen.getByText(/Hilfsmittel: Gymnastikmatte/)).toBeInTheDocument();
    expect(screen.getByText(/Mo, Mi, Fr/)).toBeInTheDocument();
    expect(screen.getByText(/08:00/)).toBeInTheDocument();
    expect(screen.getByText("Bitte langsam steigern.")).toBeInTheDocument();
  });

  it("bindet vorhandene Untertitel und das Vorschaubild ein", () => {
    const { container } = render(<ExerciseView detail={baseDetail} />);
    const video = container.querySelector("video");
    expect(video?.getAttribute("poster")).toBe(baseDetail.posterUrl);
    expect(video?.hasAttribute("autoplay")).toBe(false);
    const track = container.querySelector("track");
    expect(track?.getAttribute("src")).toBe(baseDetail.captionsUrl);
  });

  it("zeigt ohne Video das Alternativbild", () => {
    render(
      <ExerciseView
        detail={{ ...baseDetail, videoUrl: null, fallbackImageUrl: "https://example.test/fallback.jpg" }}
      />
    );
    expect(screen.getByAltText(/Brücke \(Beckenheben\)/)).toBeInTheDocument();
  });

  it("zeigt ohne Video und Bild einen freundlichen Leerzustand", () => {
    render(
      <ExerciseView detail={{ ...baseDetail, videoUrl: null, fallbackImageUrl: null }} />
    );
    expect(
      screen.getByText("Für diese Übung ist noch kein Video hinterlegt.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/beim nächsten Termin/)
    ).toBeInTheDocument();
  });
});
