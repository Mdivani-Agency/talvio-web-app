import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function collectPlaywrightTests(report) {
  const tests = [];
  const walk = (suite) => {
    for (const child of suite.suites ?? []) {
      walk(child);
    }
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const result = test.results?.[test.results.length - 1];
        tests.push({
          title: spec.title,
          project: test.projectName,
          status: result?.status ?? 'missing',
          outcome: test.status ?? 'missing',
        });
      }
    }
  };
  for (const suite of report?.suites ?? []) {
    walk(suite);
  }
  return tests;
}

function requireTitles(tests, project, titles, errors) {
  for (const title of titles) {
    const matches = tests.filter((test) => test.title === title && test.project === project);
    if (matches.length === 0) {
      errors.push(`Missing required test ${title} [${project}]`);
    }
  }
}

export function assertE2EResults(report, expected) {
  const tests = collectPlaywrightTests(report);
  const errors = [];
  const projects = expected.projects ?? [];
  const required = expected.tests ?? [];
  const focused = expected.focused ?? [];
  const allowed = new Set([
    ...projects,
    ...focused.map((group) => group.project),
  ]);

  if (tests.length === 0) {
    errors.push('Playwright report has no tests');
  }

  const seenProjects = new Set(tests.map((test) => test.project));
  for (const project of allowed) {
    if (!seenProjects.has(project)) {
      errors.push(`Missing Playwright project ${project}`);
    }
  }

  for (const test of tests) {
    if (!allowed.has(test.project)) {
      errors.push(`${test.title} ran in unexpected project ${test.project}`);
    }
    if (test.status !== 'passed' || test.outcome !== 'expected') {
      errors.push(`${test.title} [${test.project}] status=${test.status} outcome=${test.outcome}`);
    }
  }

  for (const project of projects) {
    requireTitles(tests, project, required, errors);
  }
  for (const group of focused) {
    requireTitles(tests, group.project, group.tests ?? [], errors);
  }

  return errors;
}

export function assertReportFile(reportPath, expectedPath) {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const expected = JSON.parse(readFileSync(expectedPath, 'utf8'));
  const errors = assertE2EResults(report, expected);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const reportPath = process.argv[2] ?? 'playwright-report/results.json';
  const expectedPath = process.argv[3] ?? 'e2e/required-results.json';
  try {
    assertReportFile(reportPath, expectedPath);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
