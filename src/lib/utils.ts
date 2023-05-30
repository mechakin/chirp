const pluralRules = new Intl.PluralRules();
export function getPlural(number: number, singular: string, plural: string) {
  return pluralRules.select(number) === "one" ? singular : plural;
}
