import { isLanguage, type Language } from '../shared/localization'

const LANGUAGE_STORAGE_KEY = 'perfect-pitch-language'

export function loadLanguagePreference(storage?: Storage | null): Language {
  if (!storage) {
    return 'en'
  }

  try {
    const value = storage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguage(value) ? value : 'en'
  } catch {
    return 'en'
  }
}

export function saveLanguagePreference(
  language: Language,
  storage?: Storage | null,
) {
  if (!storage) {
    return
  }

  try {
    storage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Ignore storage failures and keep the in-memory session alive.
  }
}

export { LANGUAGE_STORAGE_KEY }
