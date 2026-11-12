/**
 * Local stand-in for the Talvio LLM service job API (`/llm/v1`, MDI-221), so the `/api/llm` adapter and the
 * job runner can run against a production build without AWS. It follows the contract in talvio-llm-service
 * `docs/contracts.md`: the Idempotency-Key must equal `clientRequestId`, a repeat with the same key and body
 * returns the original job (`replayed: true`), the same key with another body is 409, and every error uses the
 * service's body shape. A job belongs to the bearer token that created it; anyone else gets 404.
 *
 * Jobs succeed on the second poll. Scenarios, set with `POST /__e2e/llm-scenario {mode}`:
 * - `llm_quota`: submissions answer 429 `quota_exceeded` with Retry-After.
 * - `llm_unavailable`: submissions answer 503 `dependency_unavailable`.
 * - `llm_retryable`: jobs fail with retryable `dependency_unavailable`; a retry then succeeds.
 * - `llm_refusal`: jobs fail with `model_refusal`.
 * - `llm_slow`: jobs stay running until cancelled or the scenario changes.
 *
 * Results are canned per operation and contain only invented test content. `GET /__e2e/llm-stats` returns how
 * many jobs were created, replayed, polled, cancelled and retried.
 *
 * Sessions (`POST /llm/v1/sessions`, `/answers`, `DELETE`) keep the submitted source, so the canned
 * improve_resume proposal rewrites the source's own tagline (original value as the precondition) and
 * adds one skill that needs confirmation.
 */

const UUID = '[0-9a-f-]{36}';
const POLL_AFTER_MS = 500;
const DEADLINE_MS = 10 * 60_000;

const llm = {
  scenario: 'success',
  jobs: new Map(),
  keys: new Map(),
  sessions: new Map(),
  stats: { created: 0, replayed: 0, polled: 0, cancelled: 0, retried: 0, sessions: 0, answers: 0, deletedSessions: 0 },
};

export function resetLlmApi() {
  llm.scenario = 'success';
  llm.jobs.clear();
  llm.keys.clear();
  llm.sessions.clear();
  llm.stats = { created: 0, replayed: 0, polled: 0, cancelled: 0, retried: 0, sessions: 0, answers: 0, deletedSessions: 0 };
}

/** Shaped like the contract's CareerDocument (talvio-llm-service `fixtures/valid/parse-result-partial-profile.json`). */
const PARSED_CAREER = {
  person: { firstName: 'Ada', lastName: 'Owner', role: 'Engineer', tagline: null, seniority: null },
  contacts: { email: 'ada@talvio.test', phone: null, url: null },
  location: { city: null, country: null },
  experience: [
    {
      id: 'parsed:experience:0',
      company: 'Analytical Engines Ltd',
      jobTitle: 'Engineer',
      employmentType: null,
      locationType: null,
      startDate: '2021-03',
      endDate: null,
      current: null,
      description: null,
      achievements: ['Shipped the difference engine'],
      responsibilities: [],
      keyContributions: [],
    },
  ],
  education: [],
  projects: [],
  recommendations: [],
  skills: [{ id: 'parsed:skills:0', name: 'Mathematics' }],
  tools: [],
  links: [],
  languages: [],
};

const QUESTION_SET_ID = '5f1d2c3b-4a59-4e6f-8a7b-9c0d1e2f3a4b';

function cannedResult(operation, request) {
  switch (operation) {
    case 'generate_questions':
      return {
        questionSetId: QUESTION_SET_ID,
        round: 1,
        questions: [
          {
            id: 'r1-q1',
            topicKey: 'impact.scale',
            prompt: 'How many people used what you built?',
            guidance: 'A rough number and who the users were.',
            reason: 'Numbers make an achievement concrete.',
            targetSection: 'experience',
            targetEntityId: null,
            requirementIds: [],
          },
        ],
      };
    case 'improve_resume': {
      const session = llm.sessions.get(request.sessionId);
      const source = session?.source ?? { source: { kind: 'resume', id: crypto.randomUUID(), revision: 'unsaved' }, document: { person: {} } };
      const original = source.document.person?.tagline ?? null;
      return {
        proposal: {
          proposalId: crypto.randomUUID(),
          source: source.source,
          sourceHash: '2'.repeat(64),
          applyTarget: { kind: 'resume_draft', resumeId: source.source.id, baseRevision: source.source.revision },
          changes: [
            {
              type: 'field',
              changeKind: 'rewrite',
              id: 'change-tagline',
              target: { section: 'person', entityId: null, field: 'tagline' },
              originalValue: original,
              proposedValue: 'Engineer who ships reliable tools.',
              reason: 'A summary that names what you do reads faster.',
              factIds: [],
              evidence: [],
              confirmation: { required: false, claims: [] },
            },
            {
              type: 'add_entity',
              changeKind: 'factual_addition',
              id: 'change-skill',
              addition: { section: 'skills', entity: { id: 'new:skills:0', name: 'Technical writing' } },
              reason: 'You mentioned writing the team handbook.',
              factIds: [],
              evidence: [],
              confirmation: { required: true, claims: [{ id: 'claim-1', text: 'You write technical documentation.' }] },
            },
          ],
          omissions: [],
          document: null,
          summary: 'Two suggestions: a clearer summary and one skill from your answers.',
        },
      };
    }
    case 'parse_document':
      return {
        career: PARSED_CAREER,
        facts: [],
        uncertainties: [],
        extraction: { method: 'plain_text', ocrPages: 0, complete: true, pagesNeedingReview: [] },
      };
    default:
      return {};
  }
}

function errorBody(code, message, retryable = false) {
  return { error: { code, message, retryable, correlationId: `sim-${crypto.randomUUID()}` } };
}

function canonical(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function bearer(request) {
  const header = request.headers.authorization;
  return typeof header === 'string' && header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
}

function view(job) {
  const terminal = ['succeeded', 'failed', 'cancelled', 'expired'].includes(job.status);
  return {
    jobId: job.jobId,
    operation: job.operation,
    status: job.status,
    stage: job.status === 'succeeded' ? 'done' : job.status === 'queued' ? 'admission' : 'inference',
    sessionId: job.request.sessionId ?? null,
    contextRevisionId: job.request.contextRevisionId ?? null,
    parentJobId: job.request.parentJobId ?? null,
    createdAt: job.createdAt,
    updatedAt: new Date().toISOString(),
    deadlineAt: job.deadlineAt,
    pollAfterMs: terminal ? null : POLL_AFTER_MS,
    result:
      job.status === 'succeeded'
        ? {
            jobId: job.jobId,
            schemaVersion: '1.0',
            operation: job.operation,
            inputHash: '0'.repeat(64),
            contextRevisionId: job.request.contextRevisionId ?? null,
            contextHash: job.request.contextRevisionId ? '1'.repeat(64) : null,
            sourceRevision: job.request.contextRevisionId ? 'sim-revision' : null,
            versions: { pipelineReleaseId: 'v1', promptVersion: 'sim@1', modelId: 'sim' },
            resultKind: 'complete',
            warnings: [],
            result: cannedResult(job.operation, job.request),
          }
        : null,
    error: job.error,
  };
}

function accepted(job, replayed) {
  return {
    jobId: job.jobId,
    status: job.status,
    statusUrl: `/llm/v1/jobs/${job.jobId}`,
    pollAfterMs: POLL_AFTER_MS,
    replayed,
  };
}

/** Moves a job one step on each poll, by the scenario it was created under. */
function advance(job) {
  if (['succeeded', 'failed', 'cancelled', 'expired'].includes(job.status)) {
    return;
  }
  if (job.scenario === 'llm_slow' && llm.scenario === 'llm_slow') {
    job.status = 'running';
    return;
  }
  job.polls += 1;
  if (job.polls < 2) {
    job.status = 'running';
    return;
  }
  if (job.scenario === 'llm_retryable' && !job.retried) {
    job.status = 'failed';
    job.error = { code: 'dependency_unavailable', message: 'AI is not available right now. Try again in a moment.', retryable: true, correlationId: 'sim-retryable' };
    return;
  }
  if (job.scenario === 'llm_refusal') {
    job.status = 'failed';
    job.error = { code: 'model_refusal', message: 'This could not be processed. Edit it and try again.', retryable: false, correlationId: 'sim-refusal' };
    return;
  }
  job.status = 'succeeded';
}

/**
 * Handles `/llm/v1/...` and the LLM test controls. Returns false for any other path.
 * `send(status, body, headers)` writes the response.
 */
export function handleLlmApi(request, url, body, send) {
  const path = url.pathname;
  if (request.method === 'POST' && path === '/__e2e/llm-scenario') {
    const json = JSON.parse(body.toString('utf8') || '{}');
    llm.scenario = json.mode || 'success';
    send(200, { mode: llm.scenario });
    return true;
  }
  if (request.method === 'GET' && path === '/__e2e/llm-stats') {
    send(200, llm.stats);
    return true;
  }
  if (!path.startsWith('/llm/v1/')) {
    return false;
  }

  const owner = bearer(request);
  if (!owner) {
    send(401, errorBody('unauthorized', 'Authentication required.'));
    return true;
  }

  const sessionMatch = path.match(new RegExp(`^/llm/v1/sessions(?:/(${UUID})(/answers)?)?$`));
  if (sessionMatch) {
    return handleSession(request, sessionMatch, owner, body, send);
  }

  if (request.method === 'POST' && path === '/llm/v1/jobs') {
    let job;
    try {
      job = JSON.parse(body.toString('utf8'));
    } catch {
      send(400, errorBody('invalid_request', 'The request is not valid.'));
      return true;
    }
    const key = request.headers['idempotency-key'];
    if (!key) {
      send(400, errorBody('idempotency_key_required', 'An Idempotency-Key header is required.'));
      return true;
    }
    if (key !== job.clientRequestId || job.schemaVersion !== '1.0' || typeof job.operation !== 'string') {
      send(400, errorBody('invalid_request', 'The request is not valid.'));
      return true;
    }
    const existing = llm.keys.get(`${owner}:${key}`);
    if (existing) {
      if (existing.hash !== canonical(job)) {
        send(409, errorBody('idempotency_conflict', 'This request key was already used for a different request.'));
        return true;
      }
      llm.stats.replayed += 1;
      send(202, accepted(llm.jobs.get(existing.jobId), true));
      return true;
    }
    if (llm.scenario === 'llm_quota') {
      send(429, errorBody('quota_exceeded', 'You have used today’s AI jobs. Try again tomorrow.'), { 'Retry-After': '3600' });
      return true;
    }
    if (llm.scenario === 'llm_unavailable') {
      send(503, errorBody('dependency_unavailable', 'AI is not available right now. Try again in a moment.', true));
      return true;
    }
    const now = Date.now();
    const created = {
      jobId: crypto.randomUUID(),
      owner,
      operation: job.operation,
      request: job,
      status: 'queued',
      scenario: llm.scenario,
      polls: 0,
      retried: false,
      error: null,
      createdAt: new Date(now).toISOString(),
      deadlineAt: new Date(now + DEADLINE_MS).toISOString(),
    };
    llm.jobs.set(created.jobId, created);
    llm.keys.set(`${owner}:${key}`, { jobId: created.jobId, hash: canonical(job) });
    llm.stats.created += 1;
    send(202, accepted(created, false));
    return true;
  }

  const match = path.match(new RegExp(`^/llm/v1/jobs/(${UUID})(/cancel|/retry)?$`));
  if (match) {
    const job = llm.jobs.get(match[1]);
    if (!job || job.owner !== owner) {
      send(404, errorBody('not_found', 'Not found.'));
      return true;
    }
    const action = match[2];
    if (request.method === 'GET' && !action) {
      llm.stats.polled += 1;
      advance(job);
      send(200, view(job));
      return true;
    }
    if (request.method === 'POST' && action === '/cancel') {
      if (!['succeeded', 'failed', 'cancelled', 'expired'].includes(job.status)) {
        job.status = 'cancelled';
        job.error = null;
        llm.stats.cancelled += 1;
      }
      send(200, view(job));
      return true;
    }
    if (request.method === 'POST' && action === '/retry') {
      if (job.status !== 'failed' || !job.error?.retryable) {
        send(409, errorBody('invalid_retry', 'This job cannot be retried.'));
        return true;
      }
      job.status = 'queued';
      job.error = null;
      job.polls = 0;
      job.retried = true;
      llm.stats.retried += 1;
      send(202, accepted(job, false));
      return true;
    }
  }

  send(404, errorBody('not_found', 'Not found.'));
  return true;
}

function contextView(session) {
  return { contextRevisionId: session.contextRevisionId, sessionId: session.sessionId, contextHash: '3'.repeat(64), sourceHash: '4'.repeat(64), jobDescriptionHash: null, answerRevisionId: null, createdAt: session.createdAt };
}

function sessionView(session) {
  return {
    sessionId: session.sessionId,
    purpose: session.purpose,
    status: 'open',
    latestContext: contextView(session),
    questionRoundsUsed: 0,
    questionsIssued: 0,
    createdAt: session.createdAt,
    expiresAt: new Date(Date.parse(session.createdAt) + 7 * 86_400_000).toISOString(),
  };
}

function handleSession(request, match, owner, body, send) {
  const [, sessionId, answers] = match;
  if (request.method === 'POST' && !sessionId) {
    let json;
    try {
      json = JSON.parse(body.toString('utf8'));
    } catch {
      send(400, errorBody('invalid_request', 'The request is not valid.'));
      return true;
    }
    if (json.schemaVersion !== '1.0' || !json.clientRequestId || !json.source?.document) {
      send(400, errorBody('invalid_request', 'The request is not valid.'));
      return true;
    }
    const existing = [...llm.sessions.values()].find((item) => item.owner === owner && item.clientRequestId === json.clientRequestId);
    if (existing) {
      send(201, sessionView(existing));
      return true;
    }
    const created = {
      sessionId: crypto.randomUUID(),
      contextRevisionId: crypto.randomUUID(),
      clientRequestId: json.clientRequestId,
      owner,
      purpose: json.purpose,
      source: json.source,
      createdAt: new Date().toISOString(),
    };
    llm.sessions.set(created.sessionId, created);
    llm.stats.sessions += 1;
    send(201, sessionView(created));
    return true;
  }
  const session = sessionId ? llm.sessions.get(sessionId) : null;
  if (!session || session.owner !== owner) {
    send(404, errorBody('not_found', 'Not found.'));
    return true;
  }
  if (request.method === 'POST' && answers) {
    const json = JSON.parse(body.toString('utf8') || '{}');
    if (json.baseContextRevisionId !== session.contextRevisionId) {
      send(409, errorBody('stale_context', 'This changed since you started. Start again.'));
      return true;
    }
    session.contextRevisionId = crypto.randomUUID();
    llm.stats.answers += 1;
    send(201, contextView(session));
    return true;
  }
  if (request.method === 'DELETE' && !answers) {
    llm.sessions.delete(session.sessionId);
    llm.stats.deletedSessions += 1;
    send(204, null);
    return true;
  }
  send(404, errorBody('not_found', 'Not found.'));
  return true;
}

