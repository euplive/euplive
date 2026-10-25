// 统计页只读今日健康数据。久坐次数与喝水记录仍由各自页面写入。

export const ACTIVITY_IDS = ['sedentary', 'kegel', 'morning-exercise', 'afternoon-exercise'] as const;

export interface ModuleStat {
  label: string;
  icon: string;
  completed: number;
  total: number;
}

export interface ActivityGlance {
  completed: number;
  total: number;
  checkedIn: boolean;
}

interface ScheduleLikeItem {
  id: string;
  status: string;
}

interface ScheduleLikeRecord {
  items: ScheduleLikeItem[];
}

export function parseSessionCount(raw: string | null): number {
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function parseWaterToday(raw: string | null): number {
  if (!raw) return 0;
  try {
    const data = JSON.parse(raw) as { count?: unknown };
    const count = typeof data?.count === 'number' ? data.count : Number(data?.count);
    if (!Number.isFinite(count) || count <= 0) return 0;
    return Math.floor(count);
  } catch {
    return 0;
  }
}

export function parseWaterGoal(raw: string | null): number {
  if (!raw) return 8;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 8;
}

export function summarizeActivity(items: ScheduleLikeItem[] | null | undefined): ActivityGlance {
  const relevant = (items ?? []).filter((item) =>
    (ACTIVITY_IDS as readonly string[]).includes(item.id),
  );
  const completed = relevant.filter((item) => item.status === 'completed').length;
  return {
    completed,
    total: relevant.length,
    checkedIn: completed > 0,
  };
}

export function buildModuleStats(
  records: ScheduleLikeRecord[],
  water: { cups: number; goal: number },
): ModuleStat[] {
  const total = records.length;
  let sedentary = 0;
  let activityDays = 0;
  let alarm = 0;
  let kegel = 0;
  let shutdown = 0;
  let meditate = 0;

  records.forEach((record) => {
    let activityDone = false;
    record.items.forEach((item) => {
      if (item.status !== 'completed') return;
      if (item.id === 'sedentary') sedentary++;
      if (item.id === 'alarm') alarm++;
      if (item.id === 'kegel') kegel++;
      if (item.id === 'shutdown') shutdown++;
      if (item.id === 'meditate') meditate++;
      if ((ACTIVITY_IDS as readonly string[]).includes(item.id)) activityDone = true;
    });
    if (activityDone) activityDays++;
  });

  return [
    { label: '久坐', icon: '🪑', completed: sedentary, total },
    { label: '喝水', icon: '💧', completed: water.cups, total: water.goal },
    { label: '活动', icon: '🏃', completed: activityDays, total },
    { label: '早起', icon: '⏰', completed: alarm, total },
    { label: '提肛', icon: '🎯', completed: kegel, total },
    { label: '断电', icon: '🔌', completed: shutdown, total },
    { label: '冥想', icon: '🧘', completed: meditate, total },
  ];
}
