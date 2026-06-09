import { create } from 'zustand';
import dayjs from 'dayjs';
import type {
  HealthRecord,
  MedicationPlan,
  MedicationRecord,
  FollowUpPlan,
  MedicalReport,
  AbnormalReport,
  FamilyMember,
  CareTask,
  FamilyMessage,
  UserProfile,
  PrivacySettings,
  HealthRecordType,
} from '@/types';
import { mockHealthRecords } from '@/data/mockRecords';
import { mockMedicationPlans, mockMedicationRecords } from '@/data/mockMedications';
import { mockFamilyMembers, mockCareTasks, mockFamilyMessages } from '@/data/mockFamily';
import { mockFollowUpPlans, mockMedicalReports, mockAbnormalReports } from '@/data/mockFollowups';
import { generateId, isRecordAbnormal } from '@/utils';

interface HealthState {
  // 数据
  healthRecords: HealthRecord[];
  medicationPlans: MedicationPlan[];
  medicationRecords: MedicationRecord[];
  followUpPlans: FollowUpPlan[];
  medicalReports: MedicalReport[];
  abnormalReports: AbnormalReport[];
  familyMembers: FamilyMember[];
  careTasks: CareTask[];
  familyMessages: FamilyMessage[];
  userProfile: UserProfile;
  privacySettings: PrivacySettings;

  // 操作方法
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'isAbnormal'>) => void;
  updateMedicationStatus: (recordId: string, status: 'taken' | 'missed', takenAt?: string, planId?: string) => void;
  addCareTask: (task: Omit<CareTask, 'id' | 'createdAt'>) => void;
  updateCareTaskStatus: (taskId: string, status: CareTask['status']) => void;
  addFamilyMessage: (message: Omit<FamilyMessage, 'id' | 'createdAt'>) => void;
  addAbnormalReport: (report: Omit<AbnormalReport, 'id' | 'reportedAt'>) => void;
  addMedicalReport: (report: Omit<MedicalReport, 'id'>) => void;
  updateFollowUpStatus: (planId: string, status: FollowUpPlan['status']) => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  exportArchive: (startDate: string, endDate: string) => object;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  // 初始数据
  healthRecords: mockHealthRecords,
  medicationPlans: mockMedicationPlans,
  medicationRecords: mockMedicationRecords,
  followUpPlans: mockFollowUpPlans,
  medicalReports: mockMedicalReports,
  abnormalReports: mockAbnormalReports,
  familyMembers: mockFamilyMembers,
  careTasks: mockCareTasks,
  familyMessages: mockFamilyMessages,
  userProfile: {
    id: 'user-001',
    name: '张父',
    birthDate: '1955-03-15',
    gender: 'male',
    phone: '13800138001',
    height: 170,
    weight: 72.5,
    bloodType: 'A',
    allergies: ['青霉素'],
    chronicDiseases: ['高血压', '2型糖尿病'],
  },
  privacySettings: {
    allowFamilyView: true,
    allowFamilyEdit: true,
    dataEncrypted: true,
    autoBackup: true,
  },

  // 添加健康记录
  addHealthRecord: (record) => {
    const newRecord: HealthRecord = {
      ...record,
      id: generateId(),
      isAbnormal: false,
    };
    newRecord.isAbnormal = isRecordAbnormal(newRecord);
    console.log('[Store] 添加健康记录:', newRecord);
    set((state) => ({
      healthRecords: [newRecord, ...state.healthRecords],
    }));
  },

  // 更新用药状态
  updateMedicationStatus: (recordId, status, takenAt, planId) => {
    console.log('[Store] 更新用药状态:', recordId, status, takenAt, planId);
    set((state) => {
      const existingRecord = state.medicationRecords.find((r) => r.id === recordId);
      if (existingRecord) {
        return {
          medicationRecords: state.medicationRecords.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  status,
                  takenAt: takenAt || dayjs().toISOString(),
                }
              : record
          ),
        };
      } else {
        const plan = planId ? state.medicationPlans.find((p) => p.id === planId) : null;
        const newRecord: MedicationRecord = {
          id: recordId,
          planId: planId || '',
          name: plan?.name || '未知药物',
          scheduledTime: takenAt || dayjs().toISOString(),
          takenAt: takenAt || dayjs().toISOString(),
          status,
        };
        return {
          medicationRecords: [newRecord, ...state.medicationRecords],
        };
      }
    });
  },

  // 添加照护任务
  addCareTask: (task) => {
    const newTask: CareTask = {
      ...task,
      id: generateId(),
      createdAt: dayjs().toISOString(),
    };
    console.log('[Store] 添加照护任务:', newTask);
    set((state) => ({
      careTasks: [...state.careTasks, newTask],
    }));
  },

  // 更新任务状态
  updateCareTaskStatus: (taskId, status) => {
    console.log('[Store] 更新任务状态:', taskId, status);
    set((state) => ({
      careTasks: state.careTasks.map((task) =>
        task.id === taskId ? { ...task, status } : task
      ),
    }));
  },

  // 添加家人留言
  addFamilyMessage: (message) => {
    const newMessage: FamilyMessage = {
      ...message,
      id: generateId(),
      createdAt: dayjs().toISOString(),
    };
    console.log('[Store] 添加家人留言:', newMessage);
    set((state) => ({
      familyMessages: [...state.familyMessages, newMessage],
    }));
  },

  // 添加异常上报
  addAbnormalReport: (report) => {
    const newReport: AbnormalReport = {
      ...report,
      id: generateId(),
      reportedAt: dayjs().toISOString(),
    };
    console.log('[Store] 添加异常上报:', newReport);
    set((state) => ({
      abnormalReports: [newReport, ...state.abnormalReports],
    }));
  },

  // 添加检查报告
  addMedicalReport: (report) => {
    const newReport: MedicalReport = {
      ...report,
      id: generateId(),
    };
    console.log('[Store] 添加检查报告:', newReport);
    set((state) => ({
      medicalReports: [newReport, ...state.medicalReports],
    }));
  },

  // 更新复诊计划状态
  updateFollowUpStatus: (planId, status) => {
    console.log('[Store] 更新复诊计划状态:', planId, status);
    set((state) => ({
      followUpPlans: state.followUpPlans.map((plan) =>
        plan.id === planId ? { ...plan, status } : plan
      ),
    }));
  },

  // 更新隐私设置
  updatePrivacySettings: (settings) => {
    console.log('[Store] 更新隐私设置:', settings);
    set((state) => ({
      privacySettings: { ...state.privacySettings, ...settings },
    }));
  },

  // 导出档案
  exportArchive: (startDate, endDate) => {
    const state = get();
    const start = dayjs(startDate).startOf('day');
    const end = dayjs(endDate).endOf('day');

    const filteredRecords = state.healthRecords.filter((r) => {
      const date = dayjs(r.recordedAt);
      return date.isAfter(start) && date.isBefore(end);
    });

    const archive = {
      exportDate: dayjs().toISOString(),
      dateRange: { startDate, endDate },
      userProfile: state.userProfile,
      healthRecords: filteredRecords,
      medicationPlans: state.medicationPlans,
      followUpPlans: state.followUpPlans.filter((f) => {
        const date = dayjs(f.date);
        return date.isAfter(start) && date.isBefore(end);
      }),
      medicalReports: state.medicalReports.filter((r) => {
        const date = dayjs(r.date);
        return date.isAfter(start) && date.isBefore(end);
      }),
    };

    console.log('[Store] 导出档案:', archive);
    return archive;
  },
}));

// 辅助 Selectors
export const useTodayRecords = (type?: HealthRecordType) => {
  const records = useHealthStore((state) => state.healthRecords);
  const today = dayjs().format('YYYY-MM-DD');
  return records.filter((r) => {
    const recordDate = dayjs(r.recordedAt).format('YYYY-MM-DD');
    const typeMatch = type ? r.type === type : true;
    return recordDate === today && typeMatch;
  });
};

export const useAbnormalRecords = () => {
  return useHealthStore((state) =>
    state.healthRecords.filter((r) => r.isAbnormal)
  );
};

export const useEmergencyContacts = () => {
  return useHealthStore((state) =>
    state.familyMembers.filter((m) => m.isEmergencyContact)
  );
};

export const useTodayMedications = () => {
  const records = useHealthStore((state) => state.medicationRecords);
  const today = dayjs().format('YYYY-MM-DD');
  return records.filter(
    (r) => dayjs(r.takenAt).format('YYYY-MM-DD') === today
  );
};
