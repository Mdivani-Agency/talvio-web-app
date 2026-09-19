import { readFileSync, writeFileSync } from 'node:fs';

const file = 'lib/graphql/generated.ts';
const source = readFileSync(file, 'utf8');
const parts = source.split(/(?=^export )/m);
const seen = new Set();
const kept = [];

for (const part of parts) {
  const match = part.match(/^export (?:type|enum|interface|const|function) (\w+)/);
  if (match) {
    if (seen.has(match[1])) {
      continue;
    }
    seen.add(match[1]);
  }
  kept.push(part);
}

writeFileSync(file, kept.join('').replace(/\n{3,}/g, '\n\n'));
