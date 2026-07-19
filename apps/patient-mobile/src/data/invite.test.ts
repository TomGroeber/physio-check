import { checkInviteCode } from "./invite";
import { apiFetch } from "@/lib/api";

jest.mock("@/lib/supabase", () => ({
  supabase: { rpc: jest.fn() },
  apiBaseUrl: "http://test",
}));
jest.mock("@/lib/api", () => ({
  apiFetch: jest.fn(),
  ApiRequestError: class extends Error {},
}));
jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn(async () => "hash"),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
}));

describe("checkInviteCode", () => {
  it("lehnt formal ungültige Codes lokal ab, ohne den Server zu fragen", async () => {
    const result = await checkInviteCode("zu-kurz");
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("gibt Praxisdaten für einen gültigen Code zurück", async () => {
    (apiFetch as jest.Mock).mockResolvedValueOnce({
      inviteId: "invite-1",
      practiceName: "Demo-Praxis",
      expiresAt: "2026-07-26T12:00:00Z",
    });
    const result = await checkInviteCode("DEMA-PHYS-2326");
    expect(result).toEqual({
      ok: true,
      inviteId: "invite-1",
      practiceName: "Demo-Praxis",
      expiresAt: "2026-07-26T12:00:00Z",
    });
  });
});
