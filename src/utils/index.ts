import dayjs from 'dayjs';
import type {
  HealthRecord,
  HealthRecordType,
  BloodPressureRecord,
  BloodSugarRecord,
  TemperatureRecord,
  WeightRecord,
} from '@/types';

// 生成唯一ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 判断血压是否正常
export const isBloodPressureNormal = (data: BloodPressureRecord): boolean => {
  const { systolic, diastolic } = data;
  return systolic >= 90 && systolic <= 139 && diastolic >= 60 && diastolic <= 89;
};

// 判断血糖是否正常
export const isBloodSugarNormal = (data: BloodSugarRecord): boolean => {
  const { value, period } = data;
  if (period === 'fasting') {
    return value >= 3.9 && value <= 6.1;
  }
  if (period === 'afterMeal') {
    return value >= 3.9 && value <= 7.8;
  }
  return value >= 3.9 && value <= 11.1;
};

// 判断体温是否正常
export const isTemperatureNormal = (data: TemperatureRecord): boolean => {
  return data.value >= 36.0 && data.value <= 37.3;
};

// 判断体重是否正常
export const isWeightNormal = (data: WeightRecord): boolean => {
  if (data.bmi) {
    return data.bmi >= 18.5 && data.bmi <= 23.9;
  }
  return true;
};

// 计算BMI
export const calculateBMI = (weight: number, height: number): number => {
  if (height <= 0) return 0;
  const heightInM = height / 100;
  return Number((weight / (heightInM * heightInM)).toFixed(1));
};

// 判断健康记录是否异常
export const isRecordAbnormal = (record: HealthRecord): boolean => {
  switch (record.type) {
    case 'bloodPressure':
      return !isBloodPressureNormal(record.data as BloodPressureRecord);
    case 'bloodSugar':
      return !isBloodSugarNormal(record.data as BloodSugarRecord);
    case 'temperature':
      return !isTemperatureNormal(record.data as TemperatureRecord);
    case 'weight':
      return !isWeightNormal(record.data as WeightRecord);
    default:
      return false;
  }
};

// 格式化日期
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

// 格式化日期时间
export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

// 格式化时间
export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm');
};

// 获取相对时间
export const getRelativeTime = (date: string | Date): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(date);
};

// 获取指标名称
export const getRecordTypeName = (type: HealthRecordType): string => {
  const names: Record<HealthRecordType, string> = {
    bloodPressure: '血压',
    bloodSugar: '血糖',
    temperature: '体温',
    weight: '体重',
  };
  return names[type];
};

// 获取指标单位
export const getRecordUnit = (type: HealthRecordType): string => {
  const units: Record<HealthRecordType, string> = {
    bloodPressure: 'mmHg',
    bloodSugar: 'mmol/L',
    temperature: '℃',
    weight: 'kg',
  };
  return units[type];
};

// 获取血糖时段名称
export const getBloodSugarPeriodName = (period: string): string => {
  const names: Record<string, string> = {
    fasting: '空腹',
    beforeMeal: '餐前',
    afterMeal: '餐后2小时',
    beforeBed: '睡前',
  };
  return names[period] || period;
};

// 获取记录显示值
export const getRecordDisplayValue = (record: HealthRecord): string => {
  switch (record.type) {
    case 'bloodPressure': {
      const data = record.data as BloodPressureRecord;
      return `${data.systolic}/${data.diastolic}`;
    }
    case 'bloodSugar': {
      const data = record.data as BloodSugarRecord;
      return String(data.value);
    }
    case 'temperature': {
      const data = record.data as TemperatureRecord;
      return String(data.value);
    }
    case 'weight': {
      const data = record.data as WeightRecord;
      return String(data.value);
    }
    default:
      return '-';
  }
};

// 获取BMI等级
export const getBMILevel = (bmi: number): { level: string; color: string } => {
  if (bmi < 18.5) return { level: '偏瘦', color: '#3B82F6' };
  if (bmi < 24) return { level: '正常', color: '#22C55E' };
  if (bmi < 28) return { level: '偏胖', color: '#F59E0B' };
  return { level: '肥胖', color: '#EF4444' };
};

// 拨打电话
export const makePhoneCall = (phoneNumber: string): void => {
  console.log('[Utils] 拨打电话:', phoneNumber);
  // Taro API 将在页面中调用，此处仅做日志
};

// 导出数据为CSV
export const exportToCSV = (data: unknown[], filename: string): void => {
  console.log('[Utils] 导出CSV:', filename, '数据量:', data.length);
  // 实际导出逻辑将在页面中实现
};
