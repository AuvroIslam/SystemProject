import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { D, SP, R, SH } from '../../theme/design';
import { CalendarEvent, fetchMonthEvents, isCalendarConnected } from '../../services/calendarService';

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSetup: () => void;
  syncedCount?: number; // number of events just created by sync
}

export function CalendarViewModal({ visible, onClose, onSetup, syncedCount }: Props) {
  const now = new Date();
  const [year,   setYear]   = useState(now.getFullYear());
  const [month,  setMonth]  = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);

  const todayStr = toDateStr(now);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setEvents(null);
    const ok = await isCalendarConnected();
    setConnected(ok);
    if (!ok) { setLoading(false); return; }
    const evts = await fetchMonthEvents(y, m);
    setEvents(evts);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible) load(year, month);
  }, [visible, year, month, load]);

  const goPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build event lookup by date
  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    (events ?? []).forEach(e => {
      if (!map[e.dateStr]) map[e.dateStr] = [];
      map[e.dateStr].push(e);
    });
    return map;
  }, [events]);

  // Build calendar grid
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const offset   = (firstDay.getDay() + 6) % 7;
    const days     = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= days; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [year, month]);

  const fitCounterEvents = useMemo(
    () => (events ?? []).filter(e => e.isFitCounter).sort((a, b) => a.dateStr.localeCompare(b.dateStr)),
    [events],
  );

  const handleNotConnected = () => { onClose(); onSetup(); };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.calIconWrap}>
                <Feather name="calendar" size={18} color={D.primary} />
              </View>
              <Text style={s.headerTitle}>Google Calendar</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={20} color={D.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Sync banner */}
          {syncedCount != null && syncedCount > 0 && (
            <View style={s.syncBanner}>
              <Feather name="check-circle" size={15} color={D.accent} />
              <Text style={s.syncBannerText}>
                {syncedCount} workout event{syncedCount !== 1 ? 's' : ''} added to your Google Calendar
              </Text>
            </View>
          )}

          {/* Loading */}
          {loading && (
            <View style={s.center}>
              <ActivityIndicator color={D.primary} size="large" />
              <Text style={s.loadingText}>Fetching your calendar…</Text>
            </View>
          )}

          {/* Not connected */}
          {!loading && connected === false && (
            <View style={s.center}>
              <View style={s.notConnectedIcon}>
                <Feather name="calendar" size={32} color={D.textMuted} />
              </View>
              <Text style={s.notConnectedTitle}>Google Calendar Not Connected</Text>
              <Text style={s.notConnectedSub}>
                Sign in with Google and enable the Calendar API to sync your workouts.
              </Text>
              <TouchableOpacity style={s.setupBtn} onPress={handleNotConnected} activeOpacity={0.8}>
                <Feather name="settings" size={14} color={D.onPrimary} />
                <Text style={s.setupBtnText}>Show Setup Steps</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Calendar */}
          {!loading && connected === true && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

              {/* Month nav */}
              <View style={s.monthNav}>
                <TouchableOpacity onPress={goPrev} style={s.navBtn} activeOpacity={0.7}>
                  <Feather name="chevron-left" size={20} color={D.textMuted} />
                </TouchableOpacity>
                <Text style={s.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
                <TouchableOpacity onPress={goNext} style={s.navBtn} activeOpacity={0.7}>
                  <Feather name="chevron-right" size={20} color={D.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Day headers */}
              <View style={s.gridRow}>
                {DAY_HEADERS.map((h, i) => (
                  <View key={i} style={s.gridCell}>
                    <Text style={s.dayHeader}>{h}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar grid */}
              {Array.from({ length: cells.length / 7 }, (_, row) => (
                <View key={row} style={s.gridRow}>
                  {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                    if (!day) return <View key={col} style={s.gridCell} />;
                    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const dayEvts = eventMap[dateStr] ?? [];
                    const hasFit  = dayEvts.some(e => e.isFitCounter);
                    const hasOther = dayEvts.some(e => !e.isFitCounter);
                    const isToday = dateStr === todayStr;
                    return (
                      <View key={col} style={s.gridCell}>
                        <View style={[
                          s.dayWrap,
                          hasFit  && s.dayWrapFit,
                          isToday && !hasFit && s.dayWrapToday,
                        ]}>
                          <Text style={[
                            s.dayNum,
                            hasFit  && s.dayNumFit,
                            isToday && !hasFit && s.dayNumToday,
                          ]}>
                            {day}
                          </Text>
                          {hasOther && !hasFit && <View style={s.otherDot} />}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}

              {/* Legend */}
              <View style={s.legend}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: D.primary }]} />
                  <Text style={s.legendText}>FitCounter Workout</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: D.border }]} />
                  <Text style={s.legendText}>Other Event</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { borderWidth: 2, borderColor: D.primary, backgroundColor: 'transparent' }]} />
                  <Text style={s.legendText}>Today</Text>
                </View>
              </View>

              {/* FitCounter events list */}
              {fitCounterEvents.length > 0 && (
                <View style={s.eventList}>
                  <Text style={s.eventListTitle}>Workout Events This Month</Text>
                  {fitCounterEvents.map(e => (
                    <View key={e.id} style={s.eventRow}>
                      <View style={s.eventDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.eventSummary}>{e.summary.replace('FitCounter: ', '')}</Text>
                        <Text style={s.eventDate}>{new Date(e.dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                      </View>
                      <Feather name="check-circle" size={14} color={D.accent} />
                    </View>
                  ))}
                </View>
              )}

              {fitCounterEvents.length === 0 && events !== null && (
                <View style={s.noEventsWrap}>
                  <Text style={s.noEventsText}>No FitCounter events this month. Tap the sync button to add workouts.</Text>
                </View>
              )}

              {/* Open in Google Calendar */}
              <TouchableOpacity
                style={s.openCalBtn}
                onPress={() => Linking.openURL('https://calendar.google.com')}
                activeOpacity={0.8}>
                <Feather name="external-link" size={14} color={D.onPrimary} />
                <Text style={s.openCalText}>Open Google Calendar</Text>
              </TouchableOpacity>

            </ScrollView>
          )}

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(30,27,64,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: D.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: SP.lg,
    paddingHorizontal: SP.xl,
    paddingBottom: 36,
    height: '92%',
    ...SH.button,
  },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.lg },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  calIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: D.primaryLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: D.text },
  closeBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: D.card, alignItems: 'center', justifyContent: 'center' },

  center:           { paddingVertical: SP.xxxl, alignItems: 'center', gap: SP.lg },
  loadingText:      { fontSize: 14, color: D.textMuted, marginTop: SP.md },
  notConnectedIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: D.primaryLight, alignItems: 'center', justifyContent: 'center' },
  notConnectedTitle:{ fontSize: 17, fontWeight: '800', color: D.text, textAlign: 'center' },
  notConnectedSub:  { fontSize: 13, color: D.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: SP.lg },
  setupBtn:         { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: D.primary, borderRadius: R.pill, paddingHorizontal: SP.xl, paddingVertical: SP.md, ...SH.button },
  setupBtnText:     { fontSize: 14, fontWeight: '700', color: D.onPrimary },

  monthNav:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md },
  navBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: D.card, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '800', color: D.text },

  syncBanner:     { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: D.accentLight, borderRadius: R.md, padding: SP.md, marginBottom: SP.md, borderWidth: 1, borderColor: D.accent + '55' },
  syncBannerText: { fontSize: 13, color: D.accentDark, fontWeight: '600', flex: 1 },

  gridRow:   { flexDirection: 'row', marginBottom: 4 },
  gridCell:  { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayHeader: { fontSize: 11, fontWeight: '700', color: D.textMuted },

  dayWrap:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayWrapFit:   { backgroundColor: D.primary },
  dayWrapToday: { borderWidth: 2, borderColor: D.primary },
  dayNum:       { fontSize: 13, fontWeight: '500', color: D.text },
  dayNumFit:    { color: '#fff', fontWeight: '800' },
  dayNumToday:  { color: D.primary, fontWeight: '800' },
  otherDot:     { width: 4, height: 4, borderRadius: 2, backgroundColor: D.textMuted, position: 'absolute', bottom: 3 },

  legend:      { flexDirection: 'row', justifyContent: 'center', gap: SP.lg, marginVertical: SP.lg, flexWrap: 'wrap' },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendText:  { fontSize: 11, color: D.textMuted, fontWeight: '600' },

  eventList:      { backgroundColor: D.card, borderRadius: R.card, padding: SP.lg, marginBottom: SP.lg, gap: SP.md },
  eventListTitle: { fontSize: 13, fontWeight: '800', color: D.text, marginBottom: SP.xs },
  eventRow:       { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  eventDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: D.primary },
  eventSummary:   { fontSize: 13, fontWeight: '600', color: D.text },
  eventDate:      { fontSize: 11, color: D.textMuted },

  noEventsWrap: { alignItems: 'center', paddingVertical: SP.lg, marginBottom: SP.lg },
  noEventsText: { fontSize: 13, color: D.textMuted, textAlign: 'center', lineHeight: 20 },

  openCalBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, backgroundColor: D.primary, borderRadius: R.pill, paddingVertical: SP.md, marginBottom: SP.lg, ...SH.button },
  openCalText: { fontSize: 14, fontWeight: '700', color: D.onPrimary },
});
