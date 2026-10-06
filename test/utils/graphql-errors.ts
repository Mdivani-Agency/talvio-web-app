import { ClientError } from 'graphql-request';

/** A graphql-request error as pg_graphql returns it for a raised exception. */
export function graphqlClientError(message: string) {
  return new ClientError(
    { status: 200, errors: [{ message }] } as ConstructorParameters<typeof ClientError>[0],
    { query: '' },
  );
}
