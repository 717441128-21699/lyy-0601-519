import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, ScrollView, Input, Textarea, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useHealthStore } from '@/store/healthStore';
import { formatDate, getRelativeTime } from '@/utils';
import type { CareTask } from '@/types';
import styles from './index.module.scss';

type TaskFilter = 'all' | 'pending' | 'inProgress' | 'completed';

const FamilyPage: React.FC = () => {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [messageText, setMessageText] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [dueDate, setDueDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CareTask | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNote, setCompletionNote] = useState('');

  const familyMembers = useHealthStore((state) => state.familyMembers);
  const careTasks = useHealthStore((state) => state.careTasks);
  const familyMessages = useHealthStore((state) => state.familyMessages);
  const userProfile = useHealthStore((state) => state.userProfile);
  const updateCareTaskStatus = useHealthStore((state) => state.updateCareTaskStatus);
  const addFamilyMessage = useHealthStore((state) => state.addFamilyMessage);
  const addCareTask = useHealthStore((state) => state.addCareTask);
  const addTaskComment = useHealthStore((state) => state.addTaskComment);

  useDidShow(() => {
    console.log('[Family] 页面显示，任务数量:', careTasks.length);
  });

  const openTaskModal = () => {
    setTaskTitle('');
    setTaskDescription('');
    setSelectedAssignee(familyMembers[0]?.id || '');
    setDueDate(dayjs().add(1, 'day').format('YYYY-MM-DD'));
    setShowTaskModal(true);
  };

  const handleCreateTask = () => {
    if (!taskTitle.trim()) {
      Taro.showToast({ title: '请输入任务内容', icon: 'none' });
      return;
    }
    if (!selectedAssignee) {
      Taro.showToast({ title: '请选择负责人', icon: 'none' });
      return;
    }
    const assignee = familyMembers.find((m) => m.id === selectedAssignee);
    if (!assignee) {
      Taro.showToast({ title: '请选择有效的负责人', icon: 'none' });
      return;
    }

    addCareTask({
      title: taskTitle.trim(),
      description: taskDescription.trim() || undefined,
      assigneeId: selectedAssignee,
      assigneeName: assignee.name,
      dueDate,
      status: 'pending',
      createdBy: userProfile.name,
    });

    setShowTaskModal(false);
    Taro.showToast({ title: '任务创建成功', icon: 'success' });
    console.log('[Family] 任务已创建:', taskTitle, '负责人:', assignee.name, '截止:', dueDate);
  };

  const openTaskDetail = (task: CareTask) => {
    const freshTask = careTasks.find(t => t.id === task.id) || task;
    setSelectedTask(freshTask);
    setCommentText('');
    setShowDetailModal(true);
  };

  const handleAddComment = () => {
    if (!selectedTask || !commentText.trim()) {
      Taro.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    addTaskComment(selectedTask.id, {
      content: commentText.trim(),
      author: userProfile.name,
    });

    setCommentText('');
    Taro.showToast({ title: '评论已发送', icon: 'success' });
  };

  const handleStatusChange = (task: CareTask, newStatus: CareTask['status']) => {
    if (newStatus === 'completed') {
      setSelectedTask(task);
      setCompletionNote('');
      setShowCompleteModal(true);
      return;
    }

    updateCareTaskStatus(task.id, newStatus, {
      operatedBy: userProfile.name,
    });
    
    Taro.showToast({ title: '状态已更新', icon: 'success' });
  };

  const handleCompleteTask = () => {
    if (!selectedTask) return;
    
    updateCareTaskStatus(selectedTask.id, 'completed', {
      note: completionNote.trim() || undefined,
      operatedBy: userProfile.name,
    });
    
    setShowCompleteModal(false);
    Taro.showToast({ title: '任务已完成', icon: 'success' });
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待开始',
      inProgress: '进行中',
      completed: '已完成',
    };
    return texts[status] || status;
  };

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return careTasks;
    return careTasks.filter((t) => t.status === taskFilter);
  }, [careTasks, taskFilter]);

  useEffect(() => {
    if (selectedTask && showDetailModal) {
      const freshTask = careTasks.find(t => t.id === selectedTask.id);
      if (freshTask && freshTask !== selectedTask) {
        setSelectedTask({ ...freshTask });
      }
    }
  }, [careTasks, selectedTask, showDetailModal]);

  const handleCall = (phone: string, name: string) => {
    console.log('[Family] 拨打电话:', name, phone);
    Taro.makePhoneCall({
      phoneNumber: phone,
      fail: (err) => console.error('[Family] 拨号失败:', err),
    });
  };

  const handleTaskAction = (task: CareTask, e?: any) => {
    if (e) e.stopPropagation();
    console.log('[Family] 更新任务状态:', task.id);
    if (task.status === 'pending') {
      handleStatusChange(task, 'inProgress');
    } else if (task.status === 'inProgress') {
      handleStatusChange(task, 'completed');
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
            <Text className={styles.sectionAction} onClick={openTaskModal}>新建任务</Text>
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
                <View 
                  key={task.id} 
                  className={classnames(styles.taskCard, styles[task.status], styles.clickable)}
                  onClick={() => openTaskDetail(task)}
                >
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
                        onClick={(e) => handleTaskAction(task, e)}
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

      <View className={styles.fabButton} onClick={openTaskModal}>
        +
      </View>

      {showTaskModal && (
        <View className={styles.modalOverlay} onClick={() => setShowTaskModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>新建照护任务</Text>
              <Text className={styles.modalClose} onClick={() => setShowTaskModal(false)}>×</Text>
            </View>

            <View className={styles.modalBody}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>任务内容 *</Text>
                <Input
                  className={styles.formInput}
                  value={taskTitle}
                  onInput={(e) => setTaskTitle(e.detail.value)}
                  placeholder="请输入任务内容，如：帮老人测量血压"
                />
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>任务描述</Text>
                <Textarea
                  className={styles.formTextarea}
                  value={taskDescription}
                  onInput={(e) => setTaskDescription(e.detail.value)}
                  placeholder="请输入任务详细描述（选填）"
                />
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>负责人 *</Text>
                <Picker
                  mode="selector"
                  range={familyMembers.map((m) => m.name)}
                  rangeKey="name"
                  value={familyMembers.findIndex((m) => m.id === selectedAssignee)}
                  onChange={(e) => {
                    const idx = Number(e.detail.value);
                    setSelectedAssignee(familyMembers[idx]?.id || '');
                  }}
                >
                  <View className={styles.formPicker}>
                    <Text className={selectedAssignee ? styles.pickerText : styles.pickerPlaceholder}>
                      {familyMembers.find((m) => m.id === selectedAssignee)?.name || '请选择负责人'}
                    </Text>
                    <Text className={styles.pickerArrow}>▼</Text>
                  </View>
                </Picker>
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>截止时间 *</Text>
                <Picker
                  mode="date"
                  value={dueDate}
                  start={dayjs().format('YYYY-MM-DD')}
                  end={dayjs().add(1, 'year').format('YYYY-MM-DD')}
                  onChange={(e) => setDueDate(e.detail.value)}
                >
                  <View className={styles.formPicker}>
                    <Text className={styles.pickerText}>{dueDate}</Text>
                    <Text className={styles.pickerArrow}>▼</Text>
                  </View>
                </Picker>
              </View>
            </View>

            <View className={styles.modalFooter}>
              <Button className={styles.modalCancel} onClick={() => setShowTaskModal(false)}>
                取消
              </Button>
              <Button className={styles.modalConfirm} onClick={handleCreateTask}>
                创建任务
              </Button>
            </View>
          </View>
        </View>
      )}

      {showDetailModal && selectedTask && (
        <View className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <View className={classnames(styles.modalContent, styles.largeModal)} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>任务详情</Text>
              <Text className={styles.modalClose} onClick={() => setShowDetailModal(false)}>×</Text>
            </View>

            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.detailHeader}>
                <View>
                  <Text className={styles.detailTitle}>{selectedTask.title}</Text>
                  <Text className={classnames(styles.detailStatus, styles[selectedTask.status])}>
                    {getStatusText(selectedTask.status)}
                  </Text>
                </View>
              </View>

              <View className={styles.detailInfo}>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>创建人</Text>
                  <Text className={styles.infoValue}>{selectedTask.createdBy || '未知'}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>负责人</Text>
                  <Text className={styles.infoValue}>{selectedTask.assigneeName}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>创建时间</Text>
                  <Text className={styles.infoValue}>{formatDate(selectedTask.createdAt)}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>截止时间</Text>
                  <Text className={classnames(
                    styles.infoValue,
                    dayjs(selectedTask.dueDate).isBefore(dayjs(), 'day') && selectedTask.status !== 'completed' && styles.overdue
                  )}>
                    {formatDate(selectedTask.dueDate)}
                    {dayjs(selectedTask.dueDate).isBefore(dayjs(), 'day') && selectedTask.status !== 'completed' && ' (已逾期)'}
                  </Text>
                </View>
              </View>

              {selectedTask.description && (
                <View className={styles.detailSection}>
                  <Text className={styles.sectionSubtitle}>任务描述</Text>
                  <Text className={styles.detailDesc}>{selectedTask.description}</Text>
                </View>
              )}

              {selectedTask.completionNote && (
                <View className={styles.detailSection}>
                  <Text className={styles.sectionSubtitle}>完成说明</Text>
                  <Text className={styles.detailDesc}>📝 {selectedTask.completionNote}</Text>
                </View>
              )}

              {selectedTask.statusHistory && selectedTask.statusHistory.length > 0 && (
                <View className={styles.detailSection}>
                  <Text className={styles.sectionSubtitle}>状态流转</Text>
                  <View className={styles.statusTimeline}>
                    {selectedTask.statusHistory.map((history) => (
                      <View key={history.id} className={styles.timelineItem}>
                        <View className={styles.timelineDot} />
                        <View className={styles.timelineContent}>
                          <Text className={styles.timelineText}>
                            {getStatusText(history.fromStatus)} → {getStatusText(history.toStatus)}
                          </Text>
                          <Text className={styles.timelineMeta}>
                            {history.operatedBy} · {dayjs(history.createdAt).format('MM-DD HH:mm')}
                          </Text>
                          {history.note && <Text className={styles.timelineNote}>备注: {history.note}</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View className={styles.detailSection}>
                <Text className={styles.sectionSubtitle}>家人评论 ({selectedTask.comments?.length || 0})</Text>
                <View className={styles.commentList}>
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((comment) => (
                      <View key={comment.id} className={styles.commentItem}>
                        <View className={styles.commentHeader}>
                          <Text className={styles.commentAuthor}>{comment.author}</Text>
                          <Text className={styles.commentTime}>{dayjs(comment.createdAt).format('MM-DD HH:mm')}</Text>
                        </View>
                        <Text className={styles.commentContent}>{comment.content}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className={styles.emptyComment}>暂无评论，快来发表第一条评论吧</Text>
                  )}
                </View>
                <View className={styles.commentInputRow}>
                  <Input
                    className={styles.commentInput}
                    value={commentText}
                    onInput={(e) => setCommentText(e.detail.value)}
                    placeholder="输入评论内容..."
                    confirmType="send"
                    onConfirm={handleAddComment}
                  />
                  <Button className={styles.commentSend} onClick={handleAddComment}>
                    发送
                  </Button>
                </View>
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              {selectedTask.status !== 'completed' && (
                <>
                  {selectedTask.status === 'pending' && (
                    <Button
                      className={classnames(styles.modalConfirm, styles.fullWidth)}
                      onClick={() => handleStatusChange(selectedTask, 'inProgress')}
                    >
                      开始处理
                    </Button>
                  )}
                  {selectedTask.status === 'inProgress' && (
                    <Button
                      className={classnames(styles.modalConfirm, styles.fullWidth)}
                      onClick={() => handleStatusChange(selectedTask, 'completed')}
                    >
                      标记完成
                    </Button>
                  )}
                </>
              )}
              {selectedTask.status === 'completed' && (
                <Button
                  className={classnames(styles.modalCancel, styles.fullWidth)}
                  onClick={() => setShowDetailModal(false)}
                >
                  关闭
                </Button>
              )}
            </View>
          </View>
        </View>
      )}

      {showCompleteModal && selectedTask && (
        <View className={styles.modalOverlay} onClick={() => setShowCompleteModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>任务完成说明</Text>
              <Text className={styles.modalClose} onClick={() => setShowCompleteModal(false)}>×</Text>
            </View>

            <View className={styles.modalBody}>
              <Text className={styles.completeHint}>请简要描述任务完成情况（选填）</Text>
              <Textarea
                className={styles.formTextarea}
                value={completionNote}
                onInput={(e) => setCompletionNote(e.detail.value)}
                placeholder="如：已完成血压测量，结果正常..."
              />
            </View>

            <View className={styles.modalFooter}>
              <Button className={styles.modalCancel} onClick={() => setShowCompleteModal(false)}>
                取消
              </Button>
              <Button className={styles.modalConfirm} onClick={handleCompleteTask}>
                确认完成
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FamilyPage;
