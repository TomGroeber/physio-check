import { describe, expect, it } from "vitest";
import {
  allowedMimeTypes,
  isAllowedMediaSize,
  maxBytes,
  signatureMatches,
  storagePathBelongsToExercise,
} from "@/config/media";

describe("exercise media configuration", () => {
  it("keeps media types and limits separated", () => {
    expect(allowedMimeTypes("video")).toContain("video/mp4");
    expect(allowedMimeTypes("thumbnail")).toContain("image/png");
    expect(allowedMimeTypes("captions")).toEqual(["text/vtt"]);
    expect(maxBytes("video")).toBeGreaterThan(maxBytes("thumbnail"));
    expect(maxBytes("thumbnail")).toBeGreaterThan(maxBytes("captions"));
  });

  it("rejects unsupported MIME types and enforces exact size limits", () => {
    expect(allowedMimeTypes("video")).not.toContain("text/plain");
    expect(allowedMimeTypes("video")).not.toContain("video/x-msvideo");
    expect(isAllowedMediaSize("video", maxBytes("video"))).toBe(true);
    expect(isAllowedMediaSize("video", maxBytes("video") + 1)).toBe(false);
    expect(isAllowedMediaSize("captions", 0)).toBe(false);
    expect(isAllowedMediaSize("captions", 1.5)).toBe(false);
  });

  it("recognizes supported magic bytes and rejects disguised content", () => {
    expect(signatureMatches("video/mp4", new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70]))).toBe(true);
    expect(signatureMatches("video/webm", new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]))).toBe(true);
    expect(signatureMatches("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff]))).toBe(true);
    expect(signatureMatches("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(true);
    expect(signatureMatches("video/mp4", new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
  });

  it("accepts WebVTT with and without an UTF-8 BOM", () => {
    const webVtt = new TextEncoder().encode("WEBVTT\n\n00:00.000 --> 00:01.000\nText");
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...webVtt]);
    expect(signatureMatches("text/vtt", webVtt)).toBe(true);
    expect(signatureMatches("text/vtt", withBom)).toBe(true);
    expect(signatureMatches("text/vtt", new TextEncoder().encode("NOT VTT"))).toBe(false);
  });

  it("accepts only a direct file below the verified practice and exercise", () => {
    const practiceId = "11111111-1111-4111-8111-111111111111";
    const exerciseId = "22222222-2222-4222-8222-222222222222";
    expect(storagePathBelongsToExercise(`${practiceId}/${exerciseId}/file.mp4`, practiceId, exerciseId)).toBe(true);
    expect(storagePathBelongsToExercise(`${practiceId}/${exerciseId}/nested/file.mp4`, practiceId, exerciseId)).toBe(false);
    expect(storagePathBelongsToExercise(`other/${exerciseId}/file.mp4`, practiceId, exerciseId)).toBe(false);
  });
});
