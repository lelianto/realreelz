// Default social handle shown on outro cards / watermarks when a content file
// doesn't set its own `watermark` (or `handle` / `small` for some templates).
//
// Set it in `.env` (Remotion reads that file automatically):
//   REMOTION_HANDLE=@yourhandle
const fromEnv =
  typeof process !== 'undefined' && process.env ? process.env.REMOTION_HANDLE : undefined;

export const DEFAULT_HANDLE: string = fromEnv?.trim() || '@yourhandle';
