/**
 * Turns an already-fetched `Blob` (a PDF from an authenticated API call, most
 * often) into either a saved download or a new tab, sharing one
 * `URL.createObjectURL` + revoke lifecycle so callers do not each reinvent it.
 *
 * `open: true` is used for "view/print" flows — the browser's native PDF
 * viewer becomes the print pipeline, so there is no separate print
 * implementation anywhere in this codebase (see invoices and the Reports
 * export). `open: false` triggers a synthetic `<a download>` click instead.
 */
export function downloadBlob(blob: Blob, filename: string, options: { open?: boolean } = {}): void {
  const url = URL.createObjectURL(blob);

  if (options.open) {
    window.open(url, '_blank', 'noopener');
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Deferred, not immediate: revoking synchronously can race the browser
  // actually opening the tab/starting the download on some platforms.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
