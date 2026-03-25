import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultSchedule } from '@/constants/schedule';
import { format } from 'date-fns';

export type ItemStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface ScheduleItem {
  id: string;
  type: string;
  label: string;
  description: string;
  scheduledTime: string;
  icon: string;
  path: string;
  status: ItemStatus;
  completedAt?: string;
}

export interface DailyRecord {
  date: string;
  items: ScheduleItem[];
  completionRate: number;
}

interface ScheduleState {
  today: DailyRecord | null;
  history: DailyRecord[];
  streakDays: number;

  initToday: () => void;
  completeItem: (id: string) => void;
  skipItem: (id: string) => void;
  getCompletionRate: () => number;
}

function createTodayRecord(): DailyRecord {
  const today = format(new Date(), 'yyyy-MM-dd');
  const items: ScheduleItem[] = defaultSchedule.map((tpl) => ({
    id: tpl.id,
    type: tpl.type,
    label: tpl.label,
    description: tpl.description,
    scheduledTime: tpl.defaultTime,
    icon: tpl.icon,
    path: tpl.path,
    status: 'pending' as ItemStatus,
  }));
  return { date: today, items, completionRate: 0 };
}

function calcCompletionRate(items: ScheduleItem[]): number {
  const actionable = items.filter((i) => i.type !== 'sleep');
  if (actionable.length === 0) return 0;
  const completed = actionable.filter((i) => i.status === 'completed').length;
  return Math.round((completed / actionable.length) * 100);
}

function calcStreak(history: DailyRecord[], today: DailyRecord | null): number {
  let streak = 0;
  if (today && today.completionRate >= 60) streak = 1;
  else if (today && today.completionRate < 60) return 0;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].completionRate >= 60) streak++;
    else break;
  }
  return streak;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      today: null,
      history: [],
      streakDays: 0,

      initToday: () => {
        const state = get();
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        if (state.today && state.today.date === todayStr) return;

        // 将昨天的记录归档到 history
        let history = [...state.history];
        if (state.today && state.today.date !== todayStr) {
          history = [...history, state.today];
          // 只保留最近90天
          if (history.length > 90) history = history.slice(-90);
        }

        const today = createTodayRecord();
        const streakDays = calcStreak(history, today);
        set({ today, history, streakDays });
      },

      completeItem: (id: string) => {
        const state = get();
        if (!state.today) return;

        const items = state.today.items.map((item) =>
          item.id === id
            ? { ...item, status: 'completed' as ItemStatus, completedAt: format(new Date(), 'HH:mm') }
            : item
        );
        const completionRate = calcCompletionRate(items);
        const today = { ...state.today, items, completionRate };
        const streakDays = calcStreak(state.history, today);
        set({ today, streakDays });
      },

      skipItem: (id: string) => {
        const state = get();
        if (!state.today) return;

        const items = state.today.items.map((item) =>
          item.id === id ? { ...item, status: 'skipped' as ItemStatus } : item
        );
        const completionRate = calcCompletionRate(items);
        const today = { ...state.today, items, completionRate };
        set({ today });
      },

      getCompletionRate: () => {
        const state = get();
        if (!state.today) return 0;
        return state.today.completionRate;
      },
    }),
    { name: 'daily-discipline-schedule' }
  )
);
