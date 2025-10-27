/**
 * Prosta funkcja pomocnicza do warunkowego łączenia nazw klas.
 */
export const cn = (
  ...classes: (string | boolean | undefined | null)[]
): string => {
  return classes.filter(Boolean).join(" ");
};
