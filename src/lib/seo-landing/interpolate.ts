import type { SeoCopyVars } from "@/lib/seo-landing/types";

const VAR_PATTERN = /\{([a-zA-Z]+)\}/g;

export function interpolateSeoText(
  template: string,
  vars: SeoCopyVars,
): string {
  return template.replace(VAR_PATTERN, (_, key: string) => {
    const value = vars[key as keyof SeoCopyVars];
    return value ?? "";
  });
}

export function interpolateSeoLines(
  templates: string[],
  vars: SeoCopyVars,
): string[] {
  return templates.map((line) => interpolateSeoText(line, vars));
}
