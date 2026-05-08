const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatRelativeTime(date: Date): string {
  const timestamp = date.getTime();
  const diffInSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absSeconds = Math.abs(diffInSeconds);

  if (absSeconds < 60) return rtf.format(diffInSeconds, 'second');
  if (absSeconds < 3600) return rtf.format(Math.round(diffInSeconds / 60), 'minute');
  if (absSeconds < 86400) return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
  const relStr = rtf.format(Math.round(diffInSeconds / 86400), 'day');
  return relStr.charAt(0).toUpperCase() + relStr.slice(1);
}