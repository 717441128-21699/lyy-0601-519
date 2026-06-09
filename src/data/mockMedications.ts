import dayjs from 'dayjs';
import type { MedicationPlan, MedicationRecord } from '@/types';
import { generateId } from '@/utils';

export const mockMedicationPlans: MedicationPlan[] = [
  {
    id: generateId(),
    name: '硝苯地平缓释片',
    dosage: '10mg',
    frequency: '每日两次',
    times: ['08:00', '20:00'],
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    description: '降压药，饭后服用',
    instructions: '整片吞服，不要掰开或嚼碎',
    reminder: true,
  },
  {
    id: generateId(),
    name: '二甲双胍',
    dosage: '0.5g',
    frequency: '每日三次',
    times: ['08:00', '12:00', '18:00'],
    startDate: dayjs().subtract(60, 'day').format('YYYY-MM-DD'),
    description: '降糖药，餐中服用',
    instructions: '与餐同服可减少胃肠道反应',
    reminder: true,
  },
  {
    id: generateId(),
    name: '阿司匹林肠溶片',
    dosage: '100mg',
    frequency: '每日一次',
    times: ['08:00'],
    startDate: dayjs().subtract(90, 'day').format('YYYY-MM-DD'),
    description: '抗血小板聚集，饭前服用',
    instructions: '饭前30分钟服用，整片吞服',
    reminder: true,
  },
  {
    id: generateId(),
    name: '阿托伐他汀钙片',
    dosage: '20mg',
    frequency: '每日一次',
    times: ['21:00'],
    startDate: dayjs().subtract(45, 'day').format('YYYY-MM-DD'),
    description: '调脂药，睡前服用',
    instructions: '睡前服用效果更佳，定期复查肝功能',
    reminder: true,
  },
];

const createMedicationRecord = (
  plan: MedicationPlan,
  daysAgo: number,
  timeIndex: number,
  status: 'pending' | 'taken' | 'missed'
): MedicationRecord => {
  const scheduledTime = dayjs()
    .subtract(daysAgo, 'day')
    .hour(Number(plan.times[timeIndex].split(':')[0]))
    .minute(Number(plan.times[timeIndex].split(':')[1]))
    .toISOString();

  return {
    id: generateId(),
    planId: plan.id,
    name: plan.name,
    scheduledTime,
    takenAt: status === 'taken' 
      ? dayjs(scheduledTime).add(5, 'minute').toISOString() 
      : scheduledTime,
    status,
    note: status === 'missed' ? '忘记服用' : undefined,
  };
};

export const mockMedicationRecords: MedicationRecord[] = [
  // 今日待服
  ...mockMedicationPlans.flatMap((plan, planIdx) =>
    plan.times.slice(0, planIdx < 2 ? 2 : 1).map((_, timeIdx) =>
      createMedicationRecord(plan, 0, timeIdx, timeIdx === 0 ? 'taken' : 'pending')
    )
  ),
  // 昨日记录
  ...mockMedicationPlans.flatMap((plan) =>
    plan.times.map((_, timeIdx) =>
      createMedicationRecord(plan, 1, timeIdx, timeIdx < 2 ? 'taken' : 'missed')
    )
  ),
  // 2天前
  ...mockMedicationPlans.flatMap((plan) =>
    plan.times.map((_, timeIdx) => createMedicationRecord(plan, 2, timeIdx, 'taken'))
  ),
];
