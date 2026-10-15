/** Today's date as YYYY-MM-DD (UTC). Injected so tests can pin "today". */
export const systemClock = {
  today: () => new Date().toISOString().slice(0, 10),
};
