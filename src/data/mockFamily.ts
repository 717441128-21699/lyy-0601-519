import dayjs from 'dayjs';
import type { FamilyMember, CareTask, FamilyMessage } from '@/types';
import { generateId } from '@/utils';

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: generateId(),
    name: '张父',
    relationship: '父亲',
    phone: '13800138001',
    role: 'admin',
    isEmergencyContact: true,
  },
  {
    id: generateId(),
    name: '张母',
    relationship: '母亲',
    phone: '13800138002',
    role: 'member',
    isEmergencyContact: true,
  },
  {
    id: generateId(),
    name: '张小明',
    relationship: '儿子',
    phone: '13800138003',
    role: 'admin',
    isEmergencyContact: true,
  },
  {
    id: generateId(),
    name: '张小红',
    relationship: '女儿',
    phone: '13800138004',
    role: 'member',
    isEmergencyContact: false,
  },
  {
    id: generateId(),
    name: '李阿姨',
    relationship: '护工',
    phone: '13800138005',
    role: 'viewer',
    isEmergencyContact: false,
  },
];

export const mockCareTasks: CareTask[] = [
  {
    id: generateId(),
    title: '测量血压血糖',
    description: '早上8点前完成血压和血糖测量',
    assigneeId: mockFamilyMembers[0].id,
    assigneeName: '张父',
    dueDate: dayjs().hour(8).toISOString(),
    status: 'completed',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: generateId(),
    title: '提醒服药',
    description: '三餐后提醒父亲服药',
    assigneeId: mockFamilyMembers[2].id,
    assigneeName: '张小明',
    dueDate: dayjs().hour(20).toISOString(),
    status: 'inProgress',
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: generateId(),
    title: '购买药品',
    description: '硝苯地平快吃完了，需要去医院开药',
    assigneeId: mockFamilyMembers[3].id,
    assigneeName: '张小红',
    dueDate: dayjs().add(2, 'day').toISOString(),
    status: 'pending',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: generateId(),
    title: '陪同复诊',
    description: '下周三陪同父亲去医院复查',
    assigneeId: mockFamilyMembers[2].id,
    assigneeName: '张小明',
    dueDate: dayjs().add(5, 'day').toISOString(),
    status: 'pending',
    createdAt: dayjs().subtract(3, 'day').toISOString(),
  },
  {
    id: generateId(),
    title: '整理健康档案',
    description: '把本月的检查报告整理归档',
    assigneeId: mockFamilyMembers[3].id,
    assigneeName: '张小红',
    dueDate: dayjs().add(7, 'day').toISOString(),
    status: 'pending',
    createdAt: dayjs().subtract(2, 'day').toISOString(),
  },
];

export const mockFamilyMessages: FamilyMessage[] = [
  {
    id: generateId(),
    senderId: mockFamilyMembers[2].id,
    senderName: '张小明',
    content: '今天早上的血压有点高，142/92，记得提醒爸爸按时吃药',
    createdAt: dayjs().subtract(6, 'hour').toISOString(),
  },
  {
    id: generateId(),
    senderId: mockFamilyMembers[0].id,
    senderName: '张父',
    content: '今天感觉还好，就是有点头晕，已经休息了',
    createdAt: dayjs().subtract(5, 'hour').toISOString(),
  },
  {
    id: generateId(),
    senderId: mockFamilyMembers[3].id,
    senderName: '张小红',
    content: '我明天下午过去，带点水果，顺便帮爸爸量一下血压',
    createdAt: dayjs().subtract(4, 'hour').toISOString(),
  },
  {
    id: generateId(),
    senderId: mockFamilyMembers[1].id,
    senderName: '张母',
    content: '今天午饭做了爸爸爱吃的鱼，他吃了不少',
    createdAt: dayjs().subtract(3, 'hour').toISOString(),
  },
  {
    id: generateId(),
    senderId: mockFamilyMembers[2].id,
    senderName: '张小明',
    content: '好的，我晚上再打个电话问问情况。复诊的事情我已经预约好了，下周三上午',
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: generateId(),
    senderId: mockFamilyMembers[4].id,
    senderName: '李阿姨',
    content: '今天张叔叔状态不错，下午陪他散步了半小时',
    createdAt: dayjs().subtract(1, 'hour').toISOString(),
  },
];
