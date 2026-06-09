import { create } from 'zustand';
import Taro from '@tarojs/taro';
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
  TaskComment,
  StatusHistory,
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

const STORAGE_KEYS = {
  HEALTH_RECORDS: 'health_records',
  CARE_TASKS: 'care_tasks',
  FAMILY_MESSAGES: 'family_messages',
  PRIVACY_SETTINGS: 'privacy_settings',
  MEDICAL_REPORTS: 'medical_reports',
  ABNORMAL_REPORTS: 'abnormal_reports',
  MEDICATION_RECORDS: 'medication_records',
  FOLLOWUP_PLANS: 'followup_plans',
};

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data) {
      console.log(`[Store] 从本地存储加载 ${key}:`, data.length || data);
      return data as T;
    }
  } catch (e) {
    console.warn(`[Store] 加载本地存储失败 ${key}:`, e);
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    Taro.setStorageSync(key, data);
  } catch (e) {
    console.warn(`[Store] 保存本地存储失败 ${key}:`, e);
  }
};

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
  updateMedicationStatus: (
    recordId: string,
    status: 'taken' | 'missed',
    takenAt?: string,
    planId?: string,
    options?: {
      actualTakenTime?: string;
      missedReason?: string;
      note?: string;
    }
  ) => void;
  addCareTask: (task: Omit<CareTask, 'id' | 'createdAt'>) => void;
  updateCareTaskStatus: (taskId: string, status: CareTask['status'], options?: { note?: string; operatedBy?: string }) => void;
  addTaskComment: (taskId: string, comment: Omit<TaskComment, 'id' | 'taskId' | 'createdAt'>) => void;
  addFamilyMessage: (message: Omit<FamilyMessage, 'id' | 'createdAt'>) => void;
  addAbnormalReport: (report: Omit<AbnormalReport, 'id' | 'reportedAt'>) => void;
  addMedicalReport: (report: Omit<MedicalReport, 'id'>) => void;
  addFollowUpPlan: (plan: Omit<FollowUpPlan, 'id' | 'status'>) => void;
  updateFollowUpStatus: (planId: string, status: FollowUpPlan['status']) => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  exportArchive: (
    startDate: string,
    endDate: string,
    options?: {
      recordTypes?: HealthRecordType[];
      includeMedication?: boolean;
      includeFollowUp?: boolean;
    }
  ) => object;
}

const defaultUserProfile: UserProfile = {
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
};

const defaultPrivacySettings: PrivacySettings = {
  allowFamilyView: true,
  allowFamilyEdit: true,
  dataEncrypted: true,
  autoBackup: true,
};

export const useHealthStore = create<HealthState>((set, get) => ({
  // 初始数据 - 优先从本地存储加载
  healthRecords: loadFromStorage(STORAGE_KEYS.HEALTH_RECORDS, mockHealthRecords),
  medicationPlans: mockMedicationPlans,
  medicationRecords: loadFromStorage(STORAGE_KEYS.MEDICATION_RECORDS, mockMedicationRecords),
  followUpPlans: loadFromStorage(STORAGE_KEYS.FOLLOWUP_PLANS, mockFollowUpPlans),
  medicalReports: loadFromStorage(STORAGE_KEYS.MEDICAL_REPORTS, mockMedicalReports),
  abnormalReports: loadFromStorage(STORAGE_KEYS.ABNORMAL_REPORTS, mockAbnormalReports),
  familyMembers: mockFamilyMembers,
  careTasks: loadFromStorage(STORAGE_KEYS.CARE_TASKS, mockCareTasks),
  familyMessages: loadFromStorage(STORAGE_KEYS.FAMILY_MESSAGES, mockFamilyMessages),
  userProfile: defaultUserProfile,
  privacySettings: loadFromStorage(STORAGE_KEYS.PRIVACY_SETTINGS, defaultPrivacySettings),

  // 添加健康记录
  addHealthRecord: (record) => {
    const newRecord: HealthRecord = {
      ...record,
      id: generateId(),
      isAbnormal: false,
    };
    newRecord.isAbnormal = isRecordAbnormal(newRecord);
    console.log('[Store] 添加健康记录:', newRecord);
    set((state) => {
      const newRecords = [newRecord, ...state.healthRecords];
      saveToStorage(STORAGE_KEYS.HEALTH_RECORDS, newRecords);
      return { healthRecords: newRecords };
    });
  },

  // 更新用药状态
  updateMedicationStatus: (recordId, status, takenAt, planId, options) => {
    console.log('[Store] 更新用药状态:', recordId, status, takenAt, planId, options);
    set((state) => {
      let newRecords: MedicationRecord[];
      const existingRecord = state.medicationRecords.find((r) => r.id === recordId);
      if (existingRecord) {
        newRecords = state.medicationRecords.map((record) =>
          record.id === recordId
            ? {
                ...record,
                status,
                takenAt: takenAt || record.takenAt,
                actualTakenTime: options?.actualTakenTime || record.actualTakenTime,
                missedReason: options?.missedReason || record.missedReason,
                note: options?.note || record.note,
              }
            : record
        );
      } else {
        const plan = planId ? state.medicationPlans.find((p) => p.id === planId) : null;
        const newRecord: MedicationRecord = {
          id: recordId,
          planId: planId || '',
          name: plan?.name || '未知药物',
          scheduledTime: takenAt || dayjs().toISOString(),
          takenAt: takenAt || dayjs().toISOString(),
          actualTakenTime: options?.actualTakenTime,
          missedReason: options?.missedReason,
          note: options?.note,
          status,
        };
        newRecords = [newRecord, ...state.medicationRecords];
      }
      saveToStorage(STORAGE_KEYS.MEDICATION_RECORDS, newRecords);
      return { medicationRecords: newRecords };
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
    set((state) => {
      const newTasks = [...state.careTasks, newTask];
      saveToStorage(STORAGE_KEYS.CARE_TASKS, newTasks);
      return { careTasks: newTasks };
    });
  },

  // 更新任务状态
  updateCareTaskStatus: (taskId, status, options) => {
    console.log('[Store] 更新任务状态:', taskId, status, options);
    set((state) => {
      const newTasks = state.careTasks.map((task) => {
        if (task.id !== taskId) return task;
        
        const statusHistory: StatusHistory = {
          id: generateId(),
          taskId,
          fromStatus: task.status,
          toStatus: status,
          note: options?.note,
          operatedBy: options?.operatedBy || '用户',
          createdAt: dayjs().toISOString(),
        };

        return {
          ...task,
          status,
          statusHistory: [...(task.statusHistory || []), statusHistory],
          completionNote: status === 'completed' ? options?.note : task.completionNote,
        };
      });
      saveToStorage(STORAGE_KEYS.CARE_TASKS, newTasks);
      return { careTasks: newTasks };
    });
  },

  // 添加任务评论
  addTaskComment: (taskId, comment) => {
    console.log('[Store] 添加任务评论:', taskId, comment);
    set((state) => {
      const newComment: TaskComment = {
        ...comment,
        id: generateId(),
        taskId,
        createdAt: dayjs().toISOString(),
      };
      
      const newTasks = state.careTasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          comments: [...(task.comments || []), newComment],
        };
      });
      
      saveToStorage(STORAGE_KEYS.CARE_TASKS, newTasks);
      return { careTasks: newTasks };
    });
  },

  // 添加家人留言
  addFamilyMessage: (message) => {
    const newMessage: FamilyMessage = {
      ...message,
      id: generateId(),
      createdAt: dayjs().toISOString(),
    };
    console.log('[Store] 添加家人留言:', newMessage);
    set((state) => {
      const newMessages = [...state.familyMessages, newMessage];
      saveToStorage(STORAGE_KEYS.FAMILY_MESSAGES, newMessages);
      return { familyMessages: newMessages };
    });
  },

  // 添加异常上报
  addAbnormalReport: (report) => {
    const newReport: AbnormalReport = {
      ...report,
      id: generateId(),
      reportedAt: dayjs().toISOString(),
    };
    console.log('[Store] 添加异常上报:', newReport);
    set((state) => {
      const newReports = [newReport, ...state.abnormalReports];
      saveToStorage(STORAGE_KEYS.ABNORMAL_REPORTS, newReports);
      return { abnormalReports: newReports };
    });
  },

  // 添加检查报告
  addMedicalReport: (report) => {
    const newReport: MedicalReport = {
      ...report,
      id: generateId(),
    };
    console.log('[Store] 添加检查报告:', newReport);
    set((state) => {
      const newReports = [newReport, ...state.medicalReports];
      saveToStorage(STORAGE_KEYS.MEDICAL_REPORTS, newReports);
      return { medicalReports: newReports };
    });
  },

  // 添加复诊计划
  addFollowUpPlan: (plan) => {
    const newPlan: FollowUpPlan = {
      ...plan,
      id: generateId(),
      status: 'pending',
    };
    console.log('[Store] 添加复诊计划:', newPlan);
    set((state) => {
      const newPlans = [...state.followUpPlans, newPlan];
      saveToStorage(STORAGE_KEYS.FOLLOWUP_PLANS, newPlans);
      return { followUpPlans: newPlans };
    });
  },

  // 更新复诊计划状态
  updateFollowUpStatus: (planId, status) => {
    console.log('[Store] 更新复诊计划状态:', planId, status);
    set((state) => {
      const newPlans = state.followUpPlans.map((plan) =>
        plan.id === planId ? { ...plan, status } : plan
      );
      saveToStorage(STORAGE_KEYS.FOLLOWUP_PLANS, newPlans);
      return { followUpPlans: newPlans };
    });
  },

  // 更新隐私设置
  updatePrivacySettings: (settings) => {
    console.log('[Store] 更新隐私设置:', settings);
    set((state) => {
      const newSettings = { ...state.privacySettings, ...settings };
      saveToStorage(STORAGE_KEYS.PRIVACY_SETTINGS, newSettings);
      return { privacySettings: newSettings };
    });
  },

  // 导出档案 - 支持按选择导出
  exportArchive: (
    startDate: string,
    endDate: string,
    options?: {
      recordTypes?: HealthRecordType[];
      includeMedication?: boolean;
      includeFollowUp?: boolean;
    }
  ) => {
    const state = get();
    const start = dayjs(startDate).startOf('day');
    const end = dayjs(endDate).endOf('day');
    const opts = {
      recordTypes: ['bloodPressure', 'bloodSugar', 'temperature', 'weight'] as HealthRecordType[],
      includeMedication: true,
      includeFollowUp: true,
      ...options,
    };

    const filteredRecords = state.healthRecords.filter((r) => {
      const date = dayjs(r.recordedAt);
      const typeMatch = opts.recordTypes.includes(r.type);
      return date.isSameOrAfter(start) && date.isSameOrBefore(end) && typeMatch;
    });

    const archive: Record<string, unknown> = {
      exportDate: dayjs().toISOString(),
      dateRange: { startDate, endDate },
      userProfile: state.userProfile,
      healthRecords: filteredRecords,
    };

    if (opts.includeMedication) {
      archive.medicationPlans = state.medicationPlans;
      archive.medicationRecords = state.medicationRecords.filter((r) => {
        const date = dayjs(r.takenAt);
        return date.isSameOrAfter(start) && date.isSameOrBefore(end);
      });
    }

    if (opts.includeFollowUp) {
      archive.followUpPlans = state.followUpPlans.filter((f) => {
        const date = dayjs(f.date);
        return date.isSameOrAfter(start) && date.isSameOrBefore(end);
      });
      archive.medicalReports = state.medicalReports.filter((r) => {
        const date = dayjs(r.date);
        return date.isSameOrAfter(start) && date.isSameOrBefore(end);
      });
    }

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

// 获取当天某类型的最新记录（严格按测量时间倒序取第一条）
export const useLatestTodayRecord = (type: HealthRecordType) => {
  const todayRecords = useTodayRecords(type);
  if (todayRecords.length === 0) return null;
  
  const sorted = [...todayRecords].sort((a, b) => 
    dayjs(b.recordedAt).valueOf() - dayjs(a.recordedAt).valueOf()
  );
  return sorted[0];
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
