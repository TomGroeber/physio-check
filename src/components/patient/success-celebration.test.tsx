import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SuccessCelebration } from "./success-celebration";

afterEach(cleanup);

describe("SuccessCelebration", () => {
  it("feiert nur eine erledigte Übung", () => {
    render(<SuccessCelebration loggedStatus="completed" />);
    expect(screen.getByRole("status")).toHaveTextContent("Geschafft!");
  });

  it("bestätigt schwierige Rückmeldungen neutral", () => {
    render(<SuccessCelebration loggedStatus="too_difficult" />);
    expect(screen.getByRole("status")).toHaveTextContent("Rückmeldung gespeichert");
    expect(screen.getByRole("status")).not.toHaveTextContent("Geschafft!");
  });
});
