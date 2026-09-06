import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ExerciseMediaManager } from "./exercise-media-manager";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/server/actions/exercise-media", () => ({
  discardExerciseMediaUploadAction: vi.fn(),
  finalizeExerciseMediaUploadAction: vi.fn(),
  prepareExerciseMediaUploadAction: vi.fn(),
  removeExerciseMediaAction: vi.fn(),
}));

afterEach(cleanup);

describe("ExerciseMediaManager", () => {
  it("gibt dem hinterlegten Vorschaubild einen echten Alt-Text statt alt=\"\"", () => {
    render(
      <ExerciseMediaManager
        exerciseId="00000000-0000-0000-0000-000000000001"
        media={[
          {
            id: "00000000-0000-0000-0000-000000000002",
            kind: "thumbnail",
            mimeType: "image/jpeg",
            sizeBytes: 1000,
            url: "https://example.test/thumb.jpg",
          },
        ]}
      />
    );
    expect(screen.getByAltText("Aktuelles Vorschaubild")).toBeInTheDocument();
  });

  it("gibt dem hinterlegten Alternativbild einen echten Alt-Text statt alt=\"\"", () => {
    render(
      <ExerciseMediaManager
        exerciseId="00000000-0000-0000-0000-000000000001"
        media={[
          {
            id: "00000000-0000-0000-0000-000000000003",
            kind: "fallback_image",
            mimeType: "image/png",
            sizeBytes: 1000,
            url: "https://example.test/fallback.png",
          },
        ]}
      />
    );
    expect(screen.getByAltText("Aktuelles Alternativbild")).toBeInTheDocument();
  });
});
