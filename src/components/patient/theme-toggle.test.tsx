import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";
import { parsePatientTheme } from "@/lib/theme";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  document.cookie = "pc-theme=; path=/; max-age=0";
});

describe("parsePatientTheme", () => {
  it("akzeptiert nur bekannte Werte und fällt sonst auf hell zurück", () => {
    expect(parsePatientTheme("dark")).toBe("dark");
    expect(parsePatientTheme("light")).toBe("light");
    expect(parsePatientTheme("neon")).toBe("light");
    expect(parsePatientTheme(undefined)).toBe("light");
  });
});

describe("ThemeToggle", () => {
  it("schaltet den Patienten-Wrapper sofort um und merkt die Wahl im Cookie", async () => {
    const user = userEvent.setup();
    const root = document.createElement("div");
    root.setAttribute("data-patient-theme-root", "");
    document.body.appendChild(root);

    render(<ThemeToggle initialTheme="light" />);
    expect(screen.getByRole("radio", { name: "Hell" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Dunkel" }));
    expect(root.classList.contains("dark")).toBe(true);
    expect(document.cookie).toContain("pc-theme=dark");

    await user.click(screen.getByRole("radio", { name: "Hell" }));
    expect(root.classList.contains("dark")).toBe(false);
    expect(document.cookie).toContain("pc-theme=light");
  });
});
