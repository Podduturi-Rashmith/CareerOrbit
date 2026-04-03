/** Anthropic bullet-regeneration: parse JSON object from model text. */

function stripMarkdownCodeFence(text: string): string {
  let t = text.trim();
  const fenced = /^```(?:json)?\s*\n?([\s\S]*?)```/im.exec(t);
  if (fenced?.[1]) t = fenced[1].trim();
  return t;
}

function extractBalancedJsonObject(text: string): string | null {
  const stripped = stripMarkdownCodeFence(text);
  const start = stripped.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < stripped.length; i++) {
    const c = stripped[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === '\\') escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return stripped.slice(start, i + 1);
    }
  }
  return null;
}

export function parseAnthropicJsonText(raw: string): unknown | null {
  const candidate = extractBalancedJsonObject(raw);
  if (!candidate) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function unwrapPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const nested =
    (typeof o.result === 'object' && o.result && (o.result as object)) ||
    (typeof o.data === 'object' && o.data && (o.data as object)) ||
    null;
  return (nested as Record<string, unknown>) || o;
}

function truthyFlag(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}

export type RegeneratedExperienceBullet = {
  sourceSection: string;
  targetRole: string;
  text: string;
  needsUserInput: boolean;
};

export function coerceRegenerateBulletsResponse(raw: unknown): {
  assistantMessage: string;
  bullets: RegeneratedExperienceBullet[];
} | null {
  const value = unwrapPayload(raw);
  if (!value) return null;

  const assistantMessage =
    (typeof value.assistant_message === 'string' && value.assistant_message.trim()) ||
    (typeof value.assistantMessage === 'string' && value.assistantMessage.trim()) ||
    '';

  const expRaw =
    value.experience_bullets ?? value.experienceBullets ?? value.bullets ?? value.suggested_bullets;

  if (!Array.isArray(expRaw) || expRaw.length === 0) return null;

  const bullets: RegeneratedExperienceBullet[] = expRaw
    .map((item) => {
      if (typeof item === 'string') {
        const text = item.trim();
        if (!text) return null;
        return {
          sourceSection: 'experience',
          targetRole: '',
          text,
          needsUserInput: false,
        };
      }
      const row = item as Record<string, unknown>;
      const text =
        (typeof row.text === 'string' && row.text.trim()) ||
        (typeof row.bullet === 'string' && row.bullet.trim()) ||
        (typeof row.content === 'string' && row.content.trim()) ||
        '';
      if (!text) return null;
      const sourceSection =
        (typeof row.source_section === 'string' && row.source_section.trim()) ||
        (typeof row.sourceSection === 'string' && row.sourceSection.trim()) ||
        'experience';
      const targetRole =
        (typeof row.target_role === 'string' && row.target_role.trim()) ||
        (typeof row.targetRole === 'string' && row.targetRole.trim()) ||
        '';
      return {
        sourceSection,
        targetRole,
        text,
        needsUserInput:
          truthyFlag(row.needs_user_input) || truthyFlag(row.needsUserInput ?? row.verify),
      };
    })
    .filter((row): row is RegeneratedExperienceBullet => !!row);

  if (bullets.length === 0) return null;

  return {
    assistantMessage:
      assistantMessage || 'Here are revised experience bullet ideas based on your feedback.',
    bullets,
  };
}
