export function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor(ms / 1000) % 60;
  const tenths = Math.floor(ms / 100) % 10;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
}
