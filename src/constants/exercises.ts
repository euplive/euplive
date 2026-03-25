export interface ExerciseStep {
  id: number;
  name: string;
  description: string;
  duration: number; // 秒
  imageUrl?: string;
}

export const baduanjinSteps: ExerciseStep[] = [
  {
    id: 1,
    name: '双手托天理三焦',
    description: '两手交叉上托，掌心向上，抬头目视手背，然后缓慢放下。调理三焦气机，舒展全身。',
    duration: 60,
  },
  {
    id: 2,
    name: '左右开弓似射雕',
    description: '马步站立，左右交替做拉弓射箭动作。展肩扩胸，增强肺活量。',
    duration: 60,
  },
  {
    id: 3,
    name: '调理脾胃须单举',
    description: '一手上举，一手下按，左右交替。调理脾胃，促进消化。',
    duration: 60,
  },
  {
    id: 4,
    name: '五劳七伤往后瞧',
    description: '头部缓慢转向后方，左右交替。缓解颈椎疲劳，改善血液循环。',
    duration: 60,
  },
  {
    id: 5,
    name: '摇头摆尾去心火',
    description: '马步站立，身体左右摇摆，头部随之转动。去除心火，缓解压力。',
    duration: 60,
  },
  {
    id: 6,
    name: '两手攀足固肾腰',
    description: '身体前屈，两手沿腿下滑至脚面，然后缓慢直立。强腰固肾，增强腰部力量。',
    duration: 60,
  },
  {
    id: 7,
    name: '攒拳怒目增气力',
    description: '马步站立，左右交替冲拳，怒目圆睁。增强气力，激发阳气。',
    duration: 60,
  },
  {
    id: 8,
    name: '背后七颠百病消',
    description: '脚跟提起，然后轻轻下落震动。疏通经络，消除百病。',
    duration: 60,
  },
];

export const paipaoSteps: ExerciseStep[] = [
  {
    id: 1,
    name: '拍打双臂',
    description: '用一只手拍打另一只手臂的内侧和外侧，从肩膀到手腕，来回拍打。疏通手臂经络。',
    duration: 60,
  },
  {
    id: 2,
    name: '拍打肩颈',
    description: '用手掌轻轻拍打肩部和颈部两侧。缓解肩颈僵硬，促进血液循环。',
    duration: 60,
  },
  {
    id: 3,
    name: '拍打腰背',
    description: '双手握拳轻轻敲打腰部和背部。缓解腰背酸痛，强腰固肾。',
    duration: 60,
  },
  {
    id: 4,
    name: '拍打双腿',
    description: '从大腿到小腿，内侧到外侧，依次拍打。促进下肢血液循环，缓解腿部疲劳。',
    duration: 60,
  },
  {
    id: 5,
    name: '拍打腹部',
    description: '用手掌轻柔拍打腹部，顺时针方向。促进肠胃蠕动，助消化。',
    duration: 45,
  },
  {
    id: 6,
    name: '全身抖动',
    description: '双脚与肩同宽，全身放松，上下轻轻抖动。放松全身肌肉，疏通全身气血。',
    duration: 45,
  },
];
