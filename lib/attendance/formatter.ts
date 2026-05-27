export function formatMinutes(minutes: number) {
  const normalized = Math.max(0, Math.round(minutes));
  const hours = Math.floor(normalized / 60);
  const rest = normalized % 60;

  if (hours === 0) {
    return `${rest}分钟`;
  }

  if (rest === 0) {
    return `${hours}小时`;
  }

  return `${hours}小时${rest}分钟`;
}

export function minutesToDecimalHours(minutes: number) {
  return Number((Math.max(0, minutes) / 60).toFixed(2));
}
