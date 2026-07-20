import { render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { ThemeProvider } from "@/lib/theme";
import { AppButton, Banner, Field } from "./ui";

jest.mock("@/lib/supabase", () => ({
  supabase: {},
  apiBaseUrl: "http://test",
}));

const renderThemed = (element: ReactElement) =>
  render(<ThemeProvider>{element}</ThemeProvider>);

describe("UI-Basiskomponenten", () => {
  it("AppButton ist ein beschrifteter Button (nie icon-only)", async () => {
    await renderThemed(<AppButton label="Übung öffnen" onPress={() => {}} />);
    const button = screen.getByRole("button", { name: "Übung öffnen" });
    expect(button).toBeTruthy();
  });

  it("Banner ist eine Live-Region für Screenreader", async () => {
    await renderThemed(<Banner kind="success">Gespeichert.</Banner>);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Gespeichert.")).toBeTruthy();
  });

  it("Field verbindet Label und Eingabe für Screenreader", async () => {
    await renderThemed(
      <Field label="E-Mail-Adresse" value="" onChangeText={() => {}} />
    );
    expect(screen.getByLabelText("E-Mail-Adresse")).toBeTruthy();
  });
});
