export type Collection<T> = {
  edges?: Array<{ node?: T | null } | null> | null;
} | null;

export function unwrapCollection<T>(collection: Collection<T> | undefined): T[] {
  return (collection?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is T => node != null);
}
