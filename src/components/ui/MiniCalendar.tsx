import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { D, SP, R } from '../../theme/design';
import { ExercisePlan, DayCompletion } from '../../types/plan';

interface CellData {
  dayNum: number | null;
  dateStr: string;
  isToday: boolean;
  isWorkout: boolean;
  isCompleted: boolean;
  isMissed: boolean;
}

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function weekMonday(d: Date): Date {
  const c = new Date(d);
  c.setHours(0,0,0,0);
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
  return c;
}

function buildCells(year: number, month: number, plan: ExercisePlan | null, completions: Record<string, DayCompletion>): CellData[] {
  const todayStr = toDateStr(new Date());
  const today = new Date();
  today.setHours(0,0,0,0);

  const firstDay = new Date(year, month, 1);
  const offset   = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let planMonday: Date | null = null;
  if (plan) {
    planMonday = weekMonday(new Date(plan.createdAt));
  }

  const cells: CellData[] = [];

  // Empty leading cells
  for (let i = 0; i < offset; i++) {
    cells.push({ dayNum: null, dateStr: '', isToday: false, isWorkout: false, isCompleted: false, isMissed: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dStr = toDateStr(date);
    const isToday = dStr === todayStr;
    const isCompleted = !!completions[dStr];

    let isWorkout = false;
    let isMissed  = false;

    if (plan && planMonday) {
      const daysSince = Math.floor((date.getTime() - planMonday.getTime()) / 86_400_000);
      if (daysSince >= 0) {
        const wIdx = Math.floor(daysSince / 7);
        const dIdx = daysSince % 7;
        // Repeat last week template for active plans (same logic as calendar sync)
        const effectiveWIdx = Math.min(wIdx, plan.weeks.length - 1);
        const dayData = plan.weeks[effectiveWIdx]?.days[dIdx];
        if (dayData && !dayData.isRestDay) {
          isWorkout = true;
          isMissed  = date < today && !isCompleted;
        }
      }
    }

    cells.push({ dayNum: d, dateStr: dStr, isToday, isWorkout, isCompleted, isMissed });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dayNum: null, dateStr: '', isToday: false, isWorkout: false, isCompleted: false, isMissed: false });
  }

  return cells;
}

interface Props {
  plan: ExercisePlan | null;
  completions: Record<string, DayCompletion>;
}

export function MiniCalendar({ plan, completions }: Props) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const cells = useMemo(
    () => buildCells(year, month, plan, completions),
    [year, month, plan, completions],
  );

  const goPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <View style={s.root}>
      {/* Month nav */}
      <View style={s.header}>
        <TouchableOpacity onPress={goPrev} style={s.navBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={18} color={D.textMuted} />
        </TouchableOpacity>
        <Text style={s.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity onPress={goNext} style={s.navBtn} activeOpacity={0.7}>
          <Feather name="chevron-right" size={18} color={D.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={s.row}>
        {DAY_HEADERS.map((h, i) => (
          <View key={i} style={s.cell}>
            <Text style={s.dayHeader}>{h}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={s.row}>
          {cells.slice(row * 7, row * 7 + 7).map((cell, col) => (
            <View key={col} style={s.cell}>
              {cell.dayNum !== null && (
                <View style={[s.dayWrap, cell.isToday && s.todayWrap, cell.isCompleted && s.completedWrap, cell.isWorkout && !cell.isCompleted && !cell.isMissed && s.workoutWrap, cell.isMissed && s.missedWrap]}>
                  <Text style={[s.dayNum, cell.isToday && s.todayText, cell.isCompleted && s.completedText, cell.isMissed && s.missedText]}>
                    {cell.dayNum}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}

      {/* Legend */}
      <View style={s.legend}>
        {[
          { color: D.primary,      label: 'Done',    border: undefined },
          { color: D.primaryLight, label: 'Workout', border: D.primary },
          { color: D.danger,       label: 'Missed',  border: undefined },
        ].map(({ color, label, border }) => (
          <View key={label} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: color }, border ? { borderWidth: 1.5, borderColor: border } : undefined]} />
            <Text style={s.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { paddingTop: SP.sm },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md },
  navBtn:      { padding: SP.sm },
  monthLabel:  { fontSize: 14, fontWeight: '700', color: D.text },

  row:         { flexDirection: 'row', marginBottom: 2 },
  cell:        { flex: 1, alignItems: 'center', paddingVertical: 2 },
  dayHeader:   { fontSize: 10, fontWeight: '700', color: D.textMuted, textTransform: 'uppercase' },

  dayWrap:       { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayNum:        { fontSize: 12, fontWeight: '500', color: D.text },

  todayWrap:     { borderWidth: 2, borderColor: D.primary },
  todayText:     { color: D.primary, fontWeight: '800' },

  completedWrap: { backgroundColor: D.primary },
  completedText: { color: '#fff', fontWeight: '700' },

  workoutWrap:   { backgroundColor: D.primaryLight },
  missedWrap:    { backgroundColor: D.dangerLight },
  missedText:    { color: D.danger, fontWeight: '600' },

  legend:      { flexDirection: 'row', justifyContent: 'center', gap: SP.xl, marginTop: SP.md },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendText:  { fontSize: 10, color: D.textMuted, fontWeight: '600' },
});
