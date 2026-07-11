import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormMessage } from "./form-message";

describe("FormMessage", () => {
  it("zeigt Fehler mit role=alert (Screenreader-Ansage)", () => {
    render(<FormMessage error="Das hat nicht geklappt." />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Das hat nicht geklappt."
    );
  });

  it("zeigt Erfolg mit role=status", () => {
    render(<FormMessage success="Gespeichert." />);
    expect(screen.getByRole("status")).toHaveTextContent("Gespeichert.");
  });

  it("rendert nichts ohne Meldung", () => {
    const { container } = render(<FormMessage />);
    expect(container).toBeEmptyDOMElement();
  });
});
