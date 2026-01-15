const DEFAULT_CHUNK_SIZE = 3000;

export function chunkTranscript(text: string) {
  const rawSize = process.env.SUMMARY_CHUNK_SIZE;
  const parsed = rawSize ? Number(rawSize) : NaN;
  const chunkSize =
    Number.isFinite(parsed) && parsed > 500 ? parsed : DEFAULT_CHUNK_SIZE;

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf("\n", end);
      if (boundary > start + 200) {
        end = boundary;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks.filter(Boolean);
}
