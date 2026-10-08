const PDF_NAME_PATTERN = /^[\w.\- ]+\.pdf$/;

export function resumePdfFilename(name: string) {
  const trimmed = name.trim() || 'resume';
  const sanitized = `${trimmed.replace(/[^\w.\- ]+/g, '')}.pdf`;
  return PDF_NAME_PATTERN.test(sanitized) ? sanitized : 'resume.pdf';
}

export function isResumePdfFilename(name: string) {
  return name.length > 0 && name.length <= 200 && PDF_NAME_PATTERN.test(name);
}
