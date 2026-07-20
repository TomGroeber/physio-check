import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/lib/theme";
import { PatientTabBar } from "./tab-bar";

jest.mock("@/lib/supabase", () => ({
  supabase: {},
  apiBaseUrl: "http://test",
}));

const navigation = {
  emit: jest.fn(() => ({ defaultPrevented: false })),
  navigate: jest.fn(),
};

const makeState = (index: number) => ({
  index,
  routes: [
    { key: "today-1", name: "today" },
    { key: "appointments-1", name: "appointments" },
    { key: "profile-1", name: "profile" },
    { key: "session-1", name: "session" },
    { key: "exercise-1", name: "exercise/[planItemId]" },
  ],
});

const renderBar = (index: number) =>
  render(
    <ThemeProvider>
      <PatientTabBar state={makeState(index)} navigation={navigation} />
    </ThemeProvider>
  );

describe("Untere Navigation (Web-Parität + Safe Area)", () => {
  it("zeigt genau drei beschriftete Ziele – nie icon-only", async () => {
    await renderBar(0);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByText("Heute")).toBeTruthy();
    expect(screen.getByText("Termine")).toBeTruthy();
    expect(screen.getByText("Profil")).toBeTruthy();
  });

  it("markiert das aktive Ziel für Screenreader", async () => {
    await renderBar(1);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[1].props.accessibilityState.selected).toBe(true);
    expect(tabs[0].props.accessibilityState.selected).toBe(false);
  });

  it("ordnet Unterseiten (Session/Übung) dem Ziel „Heute“ zu", async () => {
    await renderBar(3); // session
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].props.accessibilityState.selected).toBe(true);
  });

  it("navigiert beim Tippen auf ein inaktives Ziel", async () => {
    await renderBar(0);
    fireEvent.press(screen.getAllByRole("tab")[2]);
    expect(navigation.navigate).toHaveBeenCalledWith("profile");
  });
});
