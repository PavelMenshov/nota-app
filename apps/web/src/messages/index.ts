import { en } from './en';
import { ru } from './ru';
import { zh } from './zh';

export type Locale = 'en' | 'ru' | 'zh';

export const messages: Record<Locale, typeof en> = {
  en,
  ru,
  zh,
};

export type { Messages } from './en';

/** Simple interpolation: "Hello {{name}}" with { name: 'World' } -> "Hello World" */
export function interpolate(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}
