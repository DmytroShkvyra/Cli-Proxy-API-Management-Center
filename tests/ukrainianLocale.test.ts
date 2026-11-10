import { afterEach, describe, expect, test } from 'bun:test';
import i18next from 'i18next';
import english from '../src/i18n/locales/en.json';
import ukrainian from '../src/i18n/locales/uk.json';
import { getInitialLanguage, isSupportedLanguage } from '../src/utils/language';

const flatten = (value: unknown, prefix = ''): Record<string, string> => {
  if (!value || typeof value !== 'object') return { [prefix]: String(value) };
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) =>
      Object.entries(flatten(child, prefix ? `${prefix}.${key}` : key))
    )
  );
};

describe('Ukrainian locale', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  afterEach(() => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else Reflect.deleteProperty(globalThis, 'navigator');
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  test('covers every English key and preserves interpolation and markup', () => {
    const expected = flatten(english);
    const actual = flatten(ukrainian);
    const tokens = (s: string) => (s.match(/\{\{[^}]+\}\}|<\/?[^>]+>/g) ?? []).sort();
    for (const [key, value] of Object.entries(expected)) {
      expect(actual[key], `missing ${key}`).toBeDefined();
      expect(actual[key].trim(), `empty ${key}`).not.toBe('');
      expect(tokens(actual[key]), key).toEqual(tokens(value));
    }
    expect(ukrainian.language.ukrainian).toBe('Українська');
    expect(ukrainian.login.management_key_label).toBe('Ключ керування');
  });

  test('detects uk-UA and retains the saved language on reload', () => {
    let stored: string | null = null;
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: { getItem: () => stored } } });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => stored } });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { languages: ['uk-UA'], language: 'uk-UA' } });
    expect(isSupportedLanguage('uk')).toBe(true);
    expect(getInitialLanguage()).toBe('uk');
    stored = JSON.stringify({ state: { language: 'uk' }, version: 0 });
    expect(getInitialLanguage()).toBe('uk');
    stored = 'en';
    expect(getInitialLanguage()).toBe('en');
  });

  test('uses Ukrainian one, few and many plural forms', async () => {
    const instance = i18next.createInstance();
    await instance.init({ lng: 'uk', resources: { uk: { translation: ukrainian } } });
    expect(instance.t('auth_files.cooldown_models', { count: 1 })).toBe('1 модель тимчасово недоступна');
    expect(instance.t('auth_files.cooldown_models', { count: 2 })).toBe('2 моделі тимчасово недоступні');
    expect(instance.t('auth_files.cooldown_models', { count: 5 })).toBe('5 моделей тимчасово недоступні');
    expect(instance.t('auth_files.cooldown_models', { count: 21 })).toBe('21 модель тимчасово недоступна');
  });
});
