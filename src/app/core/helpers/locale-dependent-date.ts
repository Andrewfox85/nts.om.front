export function localeDependentDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru');
}
