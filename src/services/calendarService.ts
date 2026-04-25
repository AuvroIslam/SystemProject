import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ExercisePlan, DayWorkout } from '../types/plan';
import { useCalendarStore } from '../store/calendarStore';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const MAX_EVENTS_PER_SYNC = 28; // safety cap: 4 weeks × 7 days max

function weekMonday(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
  return c;
}

export async function getCalendarToken(): Promise<string | null> {
  try {
    const stored = useCalendarStore.getState().accessToken;
    if (stored) return stored;
    const tokens = await GoogleSignin.getTokens();
    const t = (tokens as any).accessToken ?? null;
    if (t) useCalendarStore.getState().setAccessToken(t);
    return t;
  } catch {
    return null;
  }
}

function buildDescription(day: DayWorkout): string {
  const lines: string[] = [`FitCounter – ${day.focus} Workout`, ''];
  for (const ex of day.exercises) {
    if (ex.durationSeconds != null && ex.durationSeconds > 0) {
      lines.push(`• ${ex.name}: ${ex.sets} × ${ex.durationSeconds}s  (rest ${ex.restSeconds}s)`);
    } else {
      lines.push(`• ${ex.name}: ${ex.sets} × ${ex.reps} reps  (rest ${ex.restSeconds}s)`);
    }
  }
  lines.push('', `~${day.estimatedMinutes} min total`);
  return lines.join('\n');
}

async function postCalendarEvent(token: string, body: object): Promise<{ ok: boolean; status?: number }> {
  try {
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    // 401 means token is invalid/expired – clear it so next call re-fetches
    if (res.status === 401) {
      useCalendarStore.getState().clearToken();
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false };
  }
}

export interface CalendarEvent {
  id: string;
  summary: string;
  dateStr: string;   // YYYY-MM-DD
  isFitCounter: boolean;
}

export async function fetchMonthEvents(year: number, month: number): Promise<CalendarEvent[] | null> {
  const token = await getCalendarToken();
  if (!token) return null;
  const timeMin = new Date(year, month, 1).toISOString();
  const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  try {
    const res = await fetch(
      `${CALENDAR_API}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      if (res.status === 401) useCalendarStore.getState().clearToken();
      return null;
    }
    const data = await res.json();
    return (data.items ?? []).map((item: any) => {
      // Use date field (all-day) directly; convert dateTime to LOCAL date string
      let dateStr = '';
      if (item.start?.date) {
        dateStr = item.start.date; // already YYYY-MM-DD local
      } else if (item.start?.dateTime) {
        const d = new Date(item.start.dateTime);
        dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }
      return {
        id: item.id,
        summary: item.summary ?? '',
        dateStr,
        isFitCounter: (item.summary ?? '').startsWith('FitCounter:'),
      };
    });
  } catch {
    return null;
  }
}

export async function isCalendarConnected(): Promise<boolean> {
  return (await getCalendarToken()) !== null;
}

export type SyncResult = { created: number; errors: number; needsAuth: boolean; message: string };

async function deleteFitCounterEvents(token: string, weeksAhead: number): Promise<void> {
  const today = new Date();
  const timeMin = today.toISOString();
  const timeMax = new Date(today.getTime() + weeksAhead * 7 * 86_400_000).toISOString();
  try {
    const res = await fetch(
      `${CALENDAR_API}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&q=FitCounter&singleEvents=true&maxResults=100`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return;
    const data = await res.json();
    const ids: string[] = (data.items ?? [])
      .filter((e: any) => (e.summary ?? '').startsWith('FitCounter:'))
      .map((e: any) => e.id);
    await Promise.all(ids.map((id) =>
      fetch(`${CALENDAR_API}/calendars/primary/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null),
    ));
  } catch { /* ignore cleanup errors */ }
}

export async function syncPlanToCalendar(plan: ExercisePlan): Promise<SyncResult> {
  if (!plan?.weeks?.length) {
    return { created: 0, errors: 0, needsAuth: false, message: 'Invalid plan data.' };
  }

  const token = await getCalendarToken();
  if (!token) {
    return { created: 0, errors: 0, needsAuth: true, message: 'Google sign-in required.' };
  }

  // Remove old FitCounter events before re-syncing to avoid duplicates
  await deleteFitCounterEvents(token, 5);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sync 4 weeks ahead starting from THIS week's Monday
  const thisMonday   = weekMonday(today);
  const planMonday   = weekMonday(new Date(plan.createdAt));
  const weeksElapsed = Math.max(0, Math.floor((thisMonday.getTime() - planMonday.getTime()) / (7 * 86_400_000)));
  const WEEKS_AHEAD  = 4;

  let created = 0;
  let errors  = 0;
  let count   = 0;

  outer: for (let offset = 0; offset < WEEKS_AHEAD; offset++) {
    if (count >= MAX_EVENTS_PER_SYNC) break;

    const wIdx        = weeksElapsed + offset;
    // Cap at last available week template (repeats final week for active plans)
    const weekTemplate = plan.weeks[Math.min(wIdx, plan.weeks.length - 1)];
    if (!weekTemplate?.days) continue;

    const weekStart = new Date(thisMonday.getTime() + offset * 7 * 86_400_000);

    for (const day of weekTemplate.days) {
      if (!day || day.isRestDay || !day.exercises?.length) continue;
      if (count >= MAX_EVENTS_PER_SYNC) break outer;

      const dayDate = new Date(weekStart.getTime() + (day.dayIndex ?? 0) * 86_400_000);
      if (dayDate < today) continue;

      const estimatedMin = day.estimatedMinutes > 0 ? day.estimatedMinutes : 30;
      const start = new Date(dayDate);
      start.setHours(7, 0, 0, 0);
      const end = new Date(start.getTime() + estimatedMin * 60_000);

      const result = await postCalendarEvent(token, {
        summary:     `FitCounter: ${day.focus ?? 'Workout'}`,
        description: buildDescription(day),
        start: { dateTime: start.toISOString(), timeZone: tz },
        end:   { dateTime: end.toISOString(),   timeZone: tz },
        colorId: '3',
      });

      if (result.ok) {
        created++;
      } else {
        errors++;
        if (result.status === 401) {
          return { created, errors, needsAuth: true, message: 'Session expired. Please sign in again.' };
        }
      }
      count++;
    }
  }

  if (created === 0 && errors === 0) {
    return { created: 0, errors: 0, needsAuth: false, message: 'No workout days found from today onwards. Try syncing again tomorrow.' };
  }
  const msg = errors === 0
    ? `${created} workout event${created !== 1 ? 's' : ''} added to Google Calendar.`
    : `${created} added, ${errors} failed.`;
  return { created, errors, needsAuth: false, message: msg };
}
