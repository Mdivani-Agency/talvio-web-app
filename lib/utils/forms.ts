export function parseValidationErrors(errors: Record<string, string[]>) {
  return Object.keys(errors).reduce(
    (accumulator, key) => ({ ...accumulator, [key]: { message: errors[key]?.[0] } }),
    {},
  );
}
