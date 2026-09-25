const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';

type MailMessage = {
  ID?: string;
  id?: string;
};

function messageId(message: MailMessage) {
  return message.ID ?? message.id ?? '';
}

function decodeMailLink(raw: string) {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/=\r?\n/g, '')
    .replace(/=3D/g, '=');
}

export async function latestMagicLink(email: string) {
  const deadline = Date.now() + 20_000;
  let lastError = 'no message';
  while (Date.now() < deadline) {
    const listed = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(email)}`);
    if (!listed.ok) {
      lastError = `mail search ${listed.status}`;
    } else {
      const body = await listed.json() as { messages?: MailMessage[] };
      const newest = (body.messages ?? []).find((message) => messageId(message));
      if (newest) {
        const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${messageId(newest)}`);
        const mail = await detail.json() as { HTML?: string; Text?: string };
        const source = `${mail.HTML ?? ''}\n${mail.Text ?? ''}`;
        const match = source.match(/https?:\/\/[^\s"'<>]+/);
        if (match) {
          return decodeMailLink(match[0]);
        }
        lastError = 'message had no link';
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No magic link for ${email}: ${lastError}`);
}
