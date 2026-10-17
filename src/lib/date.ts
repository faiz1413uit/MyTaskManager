type DateParts = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
};

function zonedParts(date: Date, timeZone: string, includeTime = false) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23" as const,
        }
      : {}),
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  ) as Record<string, number>;
}

function zonedDateTimeToUtc(parts: DateParts, timeZone: string) {
  const target = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );
  let guess = target;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const rendered = zonedParts(new Date(guess), timeZone, true);
    const renderedUtc = Date.UTC(
      rendered.year,
      rendered.month - 1,
      rendered.day,
      rendered.hour,
      rendered.minute,
      rendered.second,
    );
    guess += target - renderedUtc;
  }

  return new Date(guess);
}

export function getDayRange(timeZone: string, reference = new Date()) {
  const current = zonedParts(reference, timeZone) as DateParts;
  const nextDate = new Date(Date.UTC(current.year, current.month - 1, current.day + 1));
  const next: DateParts = {
    year: nextDate.getUTCFullYear(),
    month: nextDate.getUTCMonth() + 1,
    day: nextDate.getUTCDate(),
  };

  return {
    start: zonedDateTimeToUtc(current, timeZone),
    end: zonedDateTimeToUtc(next, timeZone),
  };
}

export function getRecentDayRange(timeZone: string, days: number) {
  const today = zonedParts(new Date(), timeZone) as DateParts;
  const firstDate = new Date(
    Date.UTC(today.year, today.month - 1, today.day - (days - 1)),
  );
  const first: DateParts = {
    year: firstDate.getUTCFullYear(),
    month: firstDate.getUTCMonth() + 1,
    day: firstDate.getUTCDate(),
  };

  return {
    start: zonedDateTimeToUtc(first, timeZone),
    end: getDayRange(timeZone).end,
  };
}

export function fromZonedDateTime(value: string, timeZone: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return zonedDateTimeToUtc({ year, month, day, hour, minute }, timeZone);
}

export function toZonedDateTimeInput(value: string | null | undefined, timeZone: string) {
  if (!value) return "";
  const parts = zonedParts(new Date(value), timeZone, true);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function dateKey(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function recentDateKeys(timeZone: string, days: number) {
  const today = zonedParts(new Date(), timeZone) as DateParts;

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(
      Date.UTC(today.year, today.month - 1, today.day - (days - index - 1)),
    );
    return date.toISOString().slice(0, 10);
  });
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}
