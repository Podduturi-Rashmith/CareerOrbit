/** Whether the stored master file is a Word .docx we can preview in the browser. */
export function isDocxMasterFile(fileName: string, mimeType: string): boolean {
  const n = fileName.toLowerCase();
  const m = mimeType.toLowerCase();
  return n.endsWith('.docx') || m.includes('wordprocessingml.document');
}
