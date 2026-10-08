-- GraphQL Data API. /graphql/v1 returns
-- {"errors":[{"message":"pg_graphql extension is not enabled."}]} until this exists.
-- New file so projects that already applied 20260101000100_extensions_enums.sql pick it up.

create schema if not exists graphql;

create extension if not exists pg_graphql with schema graphql;
