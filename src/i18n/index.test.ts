import { afterEach, describe, expect, it } from "vitest";
import { AUTO_LANGUAGE, resolveLocale, setLocale, t } from ".";

describe("t", () => {
  afterEach(() => setLocale("ru"));

  it("inserts each parameter", () => {
    setLocale("en");

    expect(t("habit.stats", { streak: 3, done: 10 })).toBe("🔥 3 days · ✅ 10");
  });

  it("inserts values literally, even with replacement patterns in them", () => {
    setLocale("en");

    expect(t("notice.categoryExists", { name: "Savings $$ $& $`" })).toBe(
      'Category "Savings $$ $& $`" already exists',
    );
  });

  it("leaves placeholders without a value untouched", () => {
    setLocale("en");

    expect(t("notice.categoryExists", {})).toBe(
      'Category "{name}" already exists',
    );
  });
});

describe("resolveLocale", () => {
  it("follows a supported Obsidian language in auto mode", () => {
    expect(resolveLocale(AUTO_LANGUAGE, "ru")).toBe("ru");
    expect(resolveLocale(AUTO_LANGUAGE, "de")).toBe("de");
    expect(resolveLocale(AUTO_LANGUAGE, "fr")).toBe("fr");
  });

  it("falls back to English in auto mode", () => {
    expect(resolveLocale(AUTO_LANGUAGE, "en")).toBe("en");
    expect(resolveLocale(AUTO_LANGUAGE, "ja")).toBe("en");
    expect(resolveLocale(AUTO_LANGUAGE)).toBe("en");
  });

  it("uses an explicitly chosen language", () => {
    expect(resolveLocale("ru", "en")).toBe("ru");
  });
});
