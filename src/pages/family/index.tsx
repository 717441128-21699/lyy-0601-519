import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useHealthStore } from '@/store/healthStore';
import { formatDate, getRelativeTime } from '@/utils';
import type { CareTask } from '@/types';
import styles from './index.module.scss';

type TaskFilter = 'all' | 'pending' | 'inProgress' | 'completed';

const FamilyPage: React.FC = () => {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [messageText, setMessageText] = useState('');

  const familyMembers = useHealthStore((state) => state.familyMembers);
  const careTasks = useHealthStore((state) => state.careTasks);
  const familyMessages = useHealthStore((state) => state.familyMessages);
  const userProfile = useHealthStore((state) => state.userProfile);
  const updateCareTaskStatus = useHealthStore((state) => state.updateCareTaskStatus);
  const addFamilyMessage = useHealthStore((state) => state.addFamilyMessage);

  useDidShow(() => {
    console.log('[Family] 页面显示');
  });

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return careTasks;
    return careTasks.filter((t) => t.status === taskFilter);
  }, [careTasks, taskFilter]);

  const handleCall = (phone: string, name: string) => {
    console.log('[Family] 拨打电话:', name, phone);
    Taro.makePhoneCall({
      phoneNumber: phone,
      fail: (err) => console.error('[Family] 拨号失败:', err),
    });
  };

  const handleTaskAction = (task: CareTask) => {
    console.log('[Family] 更新任务状态:', task.id);
    if (task.status === 'pending') {
      updateCareTaskStatus(task.id, 'inProgress');
      Taro.showToast({ title: '任务已开始', icon: 'success' });
    } else if (task.status === 'inProgress') {
      updateCareTaskStatus(task.id, 'completed');
      Taro.showToast({ title: '任务已完成', icon: 'success' });
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      Taro.showToast({ title: '请输入留言内容', icon: 'none' });
      return;
    }
    addFamilyMessage({
      senderId: userProfile.id,
      senderName: userProfile.name,
      content: messageText.trim(),
    });
    setMessageText('');
    Taro.showToast({ title: '发送成功', icon: 'success' });
    console.log('[Family] 留言已发送');
  };

  const getRoleText = (role: string) => {
    const texts: Record<string, string> = {
      admin: '管理员',
      member: '成员',
      viewer: '查看者',
    };
    return texts[role] || role;
  };

  const getTaskStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待开始',
      inProgress: '进行中',
      completed: '已完成',
    };
    return texts[status] || status;
  };

  const taskTabs = [
    { key: 'all' as const, label: '全部' },
    { key: 'pending' as const, label: '待开始' },
    { key: 'inProgress' as const, label: '进行中' },
    { key: 'completed' as const, label: '已完成' },
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.content}>
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>家人成员</Text>
            <Text className={styles.sectionAction}>添加成员</Text>
          </View>
          <View className={styles.memberList}>
            {familyMembers.map((member) => (
              <View key={member.id} className={styles.memberCard}>
                <View className={styles.memberAvatar}>
                  {member.name.charAt(0)}
                </View>
                <View className={styles.memberInfo}>
                  <Text className={styles.memberName}>{member.name}</Text>
                  <Text className={styles.memberMeta}>{member.relationship} · {member.phone}</Text>
                  <View>
                    <Text className={styles.roleTag}>{getRoleText(member.role)}</Text>
                    {member.isEmergencyContact && (
                      <Text className={classnames(styles.roleTag, styles.emergency)}>紧急联系人</Text>
                    )}
                  </View>
                </View>
                <Button
                  className={styles.callButton}
                  onClick={() => handleCall(member.phone, member.name)}
                >
                  📞
                </Button>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>照护任务</Text>
            <Text className={styles.sectionAction}>新建任务</Text>
          </View>
          <View className={styles.taskTabBar}>
            {taskTabs.map((tab) => (
              <View
                key={tab.key}
                className={classnames(styles.taskTab, taskFilter === tab.key && styles.active)}
                onClick={() => setTaskFilter(tab.key)}
              >
                {tab.label}
              </View>
            ))}
          </View>
          <View className={styles.taskList}>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <View key={task.id} className={classnames(styles.taskCard, styles[task.status])}>
                  <View className={styles.taskHeader}>
                    <Text className={styles.taskTitle}>{task.title}</Text>
                    <Text className={classnames(styles.taskStatus, styles[task.status])}>
                      {getTaskStatusText(task.status)}
                    </Text>
                  </View>
                  {task.description && (
                    <Text className={styles.taskDesc}>{task.description}</Text>
                  )}
                  <View className={styles.taskFooter}>
                    <View>
                      <Text className={styles.taskAssignee}>负责人: {task.assigneeName}</Text>
                      <Text className={styles.taskDue}>截止: {formatDate(task.dueDate)}</Text>
                    </View>
                    {task.status !== 'completed' && (
                      <Button
                        className={styles.taskAction}
                        onClick={() => handleTaskAction(task)}
                      >
                        {task.status === 'pending' ? '开始' : '完成'}
                      </Button>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View className={styles.empty}>暂无任务</View>
            )}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>家人留言</Text>
            <Text className={styles.sectionAction}>{familyMessages.length}条</Text>
          </View>
          <View className={styles.messageSection}>
            <ScrollView className={styles.messageList} scrollY>
              {familyMessages.length > 0 ? (
                familyMessages.map((msg) => (
                  <View key={msg.id} className={styles.messageItem}>
                    <View className={styles.messageHeader}>
                      <Text className={styles.messageSender}>{msg.senderName}</Text>
                      <Text className={styles.messageTime}>{getRelativeTime(msg.createdAt)}</Text>
                    </View>
                    <Text className={styles.messageContent}>{msg.content}</Text>
                  </View>
                ))
              ) : (
                <View className={styles.empty}>暂无留言</View>
              )}
            </ScrollView>
            <View className={styles.inputRow}>
              <Input
                className={styles.messageInput}
                value={messageText}
                onInput={(e) => setMessageText(e.detail.value)}
                placeholder="输入留言内容..."
                confirmType="send"
                onConfirm={handleSendMessage}
              />
              <Button className={styles.sendButton} onClick={handleSendMessage}>
                发送
              </Button>
            </View>
          </View>
        </View>
      </View>

      <View
        className={styles.fabButton}
        onClick={() => {
          console.log('[Family] 新建任务');
          Taro.showToast({ title: '新建任务', icon: 'none' });
        }}
      >
        +
      </View>
    </ScrollView>
  );
};

export default FamilyPage;
