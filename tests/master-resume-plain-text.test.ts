import { describe, expect, it } from 'vitest';
import {
  extractMasterResumePlainText,
  parseMasterResumeDataUrl,
} from '@/lib/admin/master-resume-plain-text';

describe('parseMasterResumeDataUrl', () => {
  it('returns null for invalid input', () => {
    expect(parseMasterResumeDataUrl('not-a-data-url')).toBeNull();
  });
});

describe('extractMasterResumePlainText', () => {
  it('prefers extractedText only for text files', async () => {
    const b64 = Buffer.from('from-bytes').toString('base64');
    const fileDataUrl = `data:text/plain;base64,${b64}`;
    await expect(
      extractMasterResumePlainText({
        mimeType: 'text/plain',
        fileName: 'cv.txt',
        fileDataUrl,
        extractedText: 'from-extracted',
      })
    ).resolves.toBe('from-extracted');
  });

  it('reads .txt from data URL when extractedText is empty', async () => {
    const b64 = Buffer.from('hello\nworld').toString('base64');
    const fileDataUrl = `data:text/plain;base64,${b64}`;
    await expect(
      extractMasterResumePlainText({
        mimeType: 'text/plain',
        fileName: 'cv.txt',
        fileDataUrl,
        extractedText: '',
      })
    ).resolves.toBe('hello\nworld');
  });
});
