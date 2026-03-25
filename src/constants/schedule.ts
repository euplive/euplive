export interface ScheduleTemplate {
  id: string;
  type: 'alarm' | 'checkin' | 'sedentary' | 'kegel' | 'shutdown' | 'meditate' | 'sleep';
  label: string;
  description: string;
  defaultTime: string;
  icon: string;
  path: string;
}

export const defaultSchedule: ScheduleTemplate[] = [
  {
    id: 'alarm',
    type: 'alarm',
    label: '早起闹钟',
    description: '振奋音乐唤醒，开启新的一天',
    defaultTime: '06:30',
    icon: '⏰',
    path: '/alarm',
  },
  {
    id: 'morning-checkin',
    type: 'checkin',
    label: '早起打卡',
    description: '记录起床时间',
    defaultTime: '06:35',
    icon: '✅',
    path: '/',
  },
  {
    id: 'sedentary',
    type: 'sedentary',
    label: '久坐提醒',
    description: '40分钟工作+20分钟活动',
    defaultTime: '09:00',
    icon: '🪑',
    path: '/sedentary',
  },
  {
    id: 'kegel',
    type: 'kegel',
    label: '提肛运动',
    description: '盆底肌锻炼，保持健康',
    defaultTime: '10:00',
    icon: '🎯',
    path: '/kegel',
  },
  {
    id: 'shutdown',
    type: 'shutdown',
    label: '断电仪式',
    description: '关闭电脑，停止工作，准备休息',
    defaultTime: '22:00',
    icon: '🔌',
    path: '/shutdown',
  },
  {
    id: 'meditate',
    type: 'meditate',
    label: '冥想放松',
    description: '呼吸法 + 引导冥想，安静入睡',
    defaultTime: '22:10',
    icon: '🧘',
    path: '/meditate',
  },
  {
    id: 'sleep',
    type: 'sleep',
    label: '入睡',
    description: '目标睡眠时间',
    defaultTime: '22:30',
    icon: '😴',
    path: '/',
  },
];
