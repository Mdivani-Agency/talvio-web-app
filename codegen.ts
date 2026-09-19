import type { CodegenConfig } from '@graphql-codegen/cli';

const fromSupabase = process.env.CODEGEN_FROM_SUPABASE === '1';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const liveToken = process.env.CODEGEN_AUTH_TOKEN ?? serviceKey ?? anonKey;

const schema: CodegenConfig['schema'] = fromSupabase
  ? {
      [`${supabaseUrl}/graphql/v1`]: {
        headers: {
          apikey: anonKey ?? '',
          Authorization: `Bearer ${liveToken ?? ''}`,
        },
      },
    }
  : 'lib/graphql/schema.graphql';

const config: CodegenConfig = {
  schema,
  documents: ['app/**/*.graphql', 'lib/**/*.graphql'],
  hooks: {
    afterOneFileWrite: ['node scripts/dedupe-graphql-generated.mjs'],
  },
  generates: {
    ...(fromSupabase
      ? {
          'lib/graphql/schema.graphql': {
            plugins: ['schema-ast'],
            config: { includeDirectives: true },
          },
        }
      : {}),
    'lib/graphql/generated.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        enumsAsTypes: true,
        scalars: {
          UUID: 'string',
          Date: 'string',
          Datetime: 'string',
          JSON: 'unknown',
          BigInt: 'string',
          BigFloat: 'string',
          Cursor: 'string',
          Opaque: 'unknown',
        },
      },
    },
  },
};

export default config;
