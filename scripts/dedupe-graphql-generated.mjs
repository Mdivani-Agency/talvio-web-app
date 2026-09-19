import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2] ?? 'lib/graphql/generated.ts';
const source = readFileSync(file, 'utf8');
const parts = source.split(/(?=^export )/m);
const seen = new Set();
const kept = [];

for (const part of parts) {
  const match = part.match(/^export (type|enum|interface|const|function) (\w+)/);
  if (match) {
    const key = `${match[1]}:${match[2]}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
  }
  kept.push(part);
}

writeFileSync(file, kept.join('').replace(/\n{3,}/g, '\n\n'));
