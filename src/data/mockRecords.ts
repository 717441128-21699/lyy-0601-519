import dayjs from 'dayjs';
import type { HealthRecord, HealthRecordType } from '@/types';
import { generateId, isRecordAbnormal, calculateBMI } from '@/utils';

const createRecord = <T>(
  type: HealthRecordType,
  data: T,
  daysAgo: number,
  hour: number,
  minute = 0,
  note?: string,
  diet?: string,
  sleep?: string
): HealthRecord => {
  const recordedAt = dayjs().subtract(daysAgo, 'day').hour(hour).minute(minute).toISOString();
  const record: HealthRecord = {
    id: generateId(),
    type,
    data: data as unknown as HealthRecord['data'],
    note,
    diet,
    sleep,
    recordedAt,
    recordedBy: '张小明',
    isAbnormal: false,
  };
  record.isAbnormal = isRecordAbnormal(record);
  return record;
};

export const mockHealthRecords: HealthRecord[] = [
  // 今日记录
  createRecord('bloodPressure', { systolic: 135, diastolic: 88, pulse: 78 }, 0, 8, 30, '早起测量'),
  createRecord('bloodSugar', { value: 6.5, period: 'fasting' }, 0, 8, 15, '空腹测量', '清淡饮食'),
  createRecord('temperature', { value: 36.8 }, 0, 8, 0),
  createRecord('weight', { value: 72.5, height: 170, bmi: calculateBMI(72.5, 170) }, 0, 7, 30, undefined, undefined, '睡眠7小时'),
  createRecord('bloodPressure', { systolic: 128, diastolic: 82, pulse: 72 }, 0, 20, 0, '睡前测量'),
  createRecord('bloodSugar', { value: 8.2, period: 'afterMeal' }, 0, 14, 0, '午餐后2小时'),

  // 昨日记录
  createRecord('bloodPressure', { systolic: 142, diastolic: 92, pulse: 80 }, 1, 8, 0, '早起测量，略高'),
  createRecord('bloodSugar', { value: 5.8, period: 'fasting' }, 1, 7, 45),
  createRecord('temperature', { value: 36.5 }, 1, 7, 30),
  createRecord('weight', { value: 72.8, height: 170, bmi: calculateBMI(72.8, 170) }, 1, 7, 15),
  createRecord('bloodPressure', { systolic: 130, diastolic: 85, pulse: 75 }, 1, 20, 30),
  createRecord('bloodSugar', { value: 7.5, period: 'afterMeal' }, 1, 13, 30),

  // 2天前
  createRecord('bloodPressure', { systolic: 125, diastolic: 80, pulse: 70 }, 2, 8, 15),
  createRecord('bloodSugar', { value: 6.2, period: 'fasting' }, 2, 7, 30),
  createRecord('temperature', { value: 36.7 }, 2, 8, 0),
  createRecord('weight', { value: 73.0, height: 170, bmi: calculateBMI(73.0, 170) }, 2, 7, 15),
  createRecord('bloodSugar', { value: 6.8, period: 'beforeBed' }, 2, 22, 0),

  // 3天前
  createRecord('bloodPressure', { systolic: 128, diastolic: 82, pulse: 72 }, 3, 8, 0),
  createRecord('bloodSugar', { value: 5.5, period: 'fasting' }, 3, 7, 45),
  createRecord('temperature', { value: 36.6 }, 3, 8, 0),
  createRecord('weight', { value: 72.6, height: 170, bmi: calculateBMI(72.6, 170) }, 3, 7, 20),
  createRecord('bloodPressure', { systolic: 150, diastolic: 95, pulse: 85 }, 3, 19, 0, '运动后测量，偏高'),

  // 4天前
  createRecord('bloodPressure', { systolic: 122, diastolic: 78, pulse: 68 }, 4, 8, 0),
  createRecord('bloodSugar', { value: 6.0, period: 'fasting' }, 4, 7, 30),
  createRecord('temperature', { value: 36.5 }, 4, 8, 0),
  createRecord('weight', { value: 72.4, height: 170, bmi: calculateBMI(72.4, 170) }, 4, 7, 15),
  createRecord('bloodSugar', { value: 7.8, period: 'afterMeal' }, 4, 13, 0),

  // 5天前
  createRecord('bloodPressure', { systolic: 130, diastolic: 84, pulse: 74 }, 5, 8, 30),
  createRecord('bloodSugar', { value: 6.3, period: 'fasting' }, 5, 7, 45),
  createRecord('temperature', { value: 36.8 }, 5, 8, 0),
  createRecord('weight', { value: 72.8, height: 170, bmi: calculateBMI(72.8, 170) }, 5, 7, 20),
  createRecord('bloodPressure', { systolic: 126, diastolic: 80, pulse: 72 }, 5, 20, 0),

  // 6天前
  createRecord('bloodPressure', { systolic: 118, diastolic: 76, pulse: 65 }, 6, 8, 0),
  createRecord('bloodSugar', { value: 5.7, period: 'fasting' }, 6, 7, 30),
  createRecord('temperature', { value: 36.4 }, 6, 8, 0),
  createRecord('weight', { value: 73.2, height: 170, bmi: calculateBMI(73.2, 170) }, 6, 7, 15),
  createRecord('bloodSugar', { value: 9.5, period: 'afterMeal' }, 6, 14, 0, '餐后偏高，注意饮食', '午餐比较油腻'),

  // 7天前
  createRecord('bloodPressure', { systolic: 124, diastolic: 80, pulse: 70 }, 7, 8, 0),
  createRecord('bloodSugar', { value: 6.1, period: 'fasting' }, 7, 7, 45),
  createRecord('temperature', { value: 36.6 }, 7, 8, 0),
  createRecord('weight', { value: 73.0, height: 170, bmi: calculateBMI(73.0, 170) }, 7, 7, 20),
];
