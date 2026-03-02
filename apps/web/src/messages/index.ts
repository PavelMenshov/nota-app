import { en } from './en';
import { zh } from './zh';
import type { Messages } from './en';

export type Locale = 'en' | 'zh';

export const messages: Record<Locale, Messages> = {
  en,
  zh,
};

export type { Messages } from './en';

/** Simple interpolation: "Hello {{name}}" with { name: 'World' } -> "Hello World" */
export function interpolate(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}
