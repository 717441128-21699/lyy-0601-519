// 健康指标类型
export type HealthRecordType = 'bloodPressure' | 'bloodSugar' | 'temperature' | 'weight';

// 血压记录
export interface BloodPressureRecord {
  systolic: number;
  diastolic: number;
  pulse?: number;
}

// 血糖记录
export interface BloodSugarRecord {
  value: number;
  period: 'fasting' | 'beforeMeal' | 'afterMeal' | 'beforeBed';
}

// 体温记录
export interface TemperatureRecord {
  value: number;
}

// 体重记录
export interface WeightRecord {
  value: number;
  height?: number;
  bmi?: number;
}

// 健康记录
export interface HealthRecord {
  id: string;
  type: HealthRecordType;
  data: BloodPressureRecord | BloodSugarRecord | TemperatureRecord | WeightRecord;
  note?: string;
  diet?: string;
  sleep?: string;
  recordedAt: string;
  recordedBy: string;
  isAbnormal: boolean;
}

// 用药计划
export interface MedicationPlan {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  description?: string;
  instructions?: string;
  reminder: boolean;
}

// 用药记录
export interface MedicationRecord {
  id: string;
  planId: string;
  name: string;
  scheduledTime: string;
  takenAt: string;
  status: 'pending' | 'taken' | 'missed';
  note?: string;
}

// 复诊计划
export interface FollowUpPlan {
  id: string;
  title: string;
  hospital: string;
  doctor?: string;
  date: string;
  time?: string;
  department?: string;
  description?: string;
  notes?: string;
  reminder: boolean;
  status: 'pending' | 'completed' | 'cancelled';
}

// 检查报告
export interface MedicalReport {
  id: string;
  title: string;
  hospital: string;
  date: string;
  type: string;
  imageUrl?: string;
  description?: string;
  notes?: string;
}

// 异常上报
export interface AbnormalReport {
  id: string;
  type: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  symptoms?: string;
  recordId?: string;
  reportedAt: string;
  reportedBy: string;
  contactNumber?: string;
  status: 'pending' | 'handled' | 'resolved';
}

// 家人成员
export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  isEmergencyContact: boolean;
}

// 照护任务
export interface CareTask {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: string;
  status: 'pending' | 'inProgress' | 'completed';
  createdAt: string;
  createdBy?: string;
}

// 家人留言
export interface FamilyMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

// 用户信息
export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  phone: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  allergies?: string[];
  chronicDiseases?: string[];
}

// 档案导出配置
export interface ArchiveExportConfig {
  startDate: string;
  endDate: string;
  includeTypes: HealthRecordType[];
  includeMedications: boolean;
  includeFollowUps: boolean;
}

// 隐私设置
export interface PrivacySettings {
  allowFamilyView: boolean;
  allowFamilyEdit: boolean;
  dataEncrypted: boolean;
  autoBackup: boolean;
}
