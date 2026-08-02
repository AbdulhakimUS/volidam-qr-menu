export interface Translation {
  uz: string;
  ru: string;
  en: string;
}

export function normalizeTranslation(
  value: string | Translation | null | undefined,
): Translation {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return {
      uz: trimmed,
      ru: trimmed,
      en: trimmed,
    };
  }

  if (value && typeof value === "object") {
    return {
      uz: value.uz?.trim() ?? "",
      ru: value.ru?.trim() ?? "",
      en: value.en?.trim() ?? "",
    };
  }

  return {
    uz: "",
    ru: "",
    en: "",
  };
}

export function serializeTranslation(
  value: string | Translation | null | undefined,
): string {
  return JSON.stringify(normalizeTranslation(value));
}

export function parseTranslation(
  value: string | Translation | null | undefined,
): Translation {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return normalizeTranslation(parsed);
      }
    } catch {
      return normalizeTranslation(value);
    }
  }

  return normalizeTranslation(value);
}
