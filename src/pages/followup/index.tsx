import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Image, Input, Textarea, Picker, Switch } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useHealthStore } from '@/store/healthStore';
import { formatDate } from '@/utils';
import type { FollowUpPlan, MedicalReport } from '@/types';
import styles from './index.module.scss';

const FollowUpPage: React.FC = () => {
  const followUpPlans = useHealthStore((state) => state.followUpPlans);
  const medicalReports = useHealthStore((state) => state.medicalReports);
  const addMedicalReport = useHealthStore((state) => state.addMedicalReport);
  const addFollowUpPlan = useHealthStore((state) => state.addFollowUpPlan);
  const updateFollowUpStatus = useHealthStore((state) => state.updateFollowUpStatus);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newHospital, setNewHospital] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newDate, setNewDate] = useState(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  const [newTime, setNewTime] = useState('09:00');
  const [newNotes, setNewNotes] = useState('');
  const [newReminder, setNewReminder] = useState(true);

  useDidShow(() => {
    console.log('[FollowUp] 页面显示');
  });

  const getPlanStatus = (plan: FollowUpPlan) => {
    if (plan.status === 'completed' || plan.status === 'cancelled') return plan.status;
    const today = dayjs();
    const planDate = dayjs(plan.date);
    if (planDate.isBefore(today, 'day')) return 'overdue';
    if (planDate.diff(today, 'day') <= 7) return 'upcoming';
    return 'upcoming';
  };

  const getDaysLeft = (date: string) => {
    const diff = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
    if (diff < 0) return `已逾期 ${Math.abs(diff)} 天`;
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    return `还有 ${diff} 天`;
  };

  const stats = useMemo(() => {
    const upcoming = followUpPlans.filter((p) => getPlanStatus(p) === 'upcoming').length;
    const overdue = followUpPlans.filter((p) => getPlanStatus(p) === 'overdue').length;
    const completed = followUpPlans.filter((p) => p.status === 'completed').length;
    return { upcoming, overdue, completed, reports: medicalReports.length };
  }, [followUpPlans, medicalReports]);

  const sortedPlans = useMemo(() => {
    return [...followUpPlans].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  }, [followUpPlans]);

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      upcoming: '待复诊',
      overdue: '已逾期',
      completed: '已完成',
      cancelled: '已取消',
    };
    return texts[status] || status;
  };

  const handleComplete = (plan: FollowUpPlan) => {
    Taro.showModal({
      title: '确认完成',
      content: '确认本次复诊已完成？',
      success: (res) => {
        if (res.confirm) {
          updateFollowUpStatus(plan.id, 'completed');
          Taro.showToast({ title: '已标记完成', icon: 'success' });
          console.log('[FollowUp] 复诊完成:', plan.id);
        }
      },
    });
  };

  const handleUpload = () => {
    console.log('[FollowUp] 上传检查报告');
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        addMedicalReport({
          title: '检查报告',
          type: '检查报告',
          date: dayjs().format('YYYY-MM-DD'),
          hospital: '手动上传',
          imageUrl: tempFilePath,
          description: '',
          notes: '',
        });
        Taro.showToast({ title: '上传成功', icon: 'success' });
        console.log('[FollowUp] 报告上传成功:', tempFilePath);
      },
      fail: (err) => console.error('[FollowUp] 上传失败:', err),
    });
  };

  const handleViewReport = (report: MedicalReport) => {
    console.log('[FollowUp] 查看报告:', report.id);
    if (report.imageUrl) {
      Taro.previewImage({ urls: [report.imageUrl] });
    } else {
      Taro.showToast({ title: '暂无图片', icon: 'none' });
    }
  };

  const handleSetReminder = (plan: FollowUpPlan) => {
    console.log('[FollowUp] 设置提醒:', plan.id);
    Taro.showToast({ title: '已设置复诊提醒', icon: 'success' });
  };

  const openAddModal = () => {
    setNewTitle('');
    setNewHospital('');
    setNewDepartment('');
    setNewDoctor('');
    setNewDate(dayjs().add(7, 'day').format('YYYY-MM-DD'));
    setNewTime('09:00');
    setNewNotes('');
    setNewReminder(true);
    setShowAddModal(true);
  };

  const handleAddFollowUp = () => {
    if (!newTitle.trim()) {
      Taro.showToast({ title: '请输入复诊标题', icon: 'none' });
      return;
    }
    if (!newHospital.trim()) {
      Taro.showToast({ title: '请输入医院名称', icon: 'none' });
      return;
    }
    if (!newDepartment.trim()) {
      Taro.showToast({ title: '请输入科室', icon: 'none' });
      return;
    }

    addFollowUpPlan({
      title: newTitle.trim(),
      hospital: newHospital.trim(),
      department: newDepartment.trim(),
      doctor: newDoctor.trim() || undefined,
      date: newDate,
      time: newTime,
      description: newNotes.trim() || undefined,
      notes: newNotes.trim() || undefined,
      reminder: newReminder,
    });

    setShowAddModal(false);
    Taro.showToast({ title: '复诊计划已创建', icon: 'success' });
    console.log('[FollowUp] 复诊计划已创建:', newTitle, newHospital, newDate);
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.content}>
        <View className={styles.summaryCard}>
          <View className={styles.summaryRow}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{stats.upcoming}</Text>
              <Text className={styles.summaryLabel}>待复诊</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{stats.overdue}</Text>
              <Text className={styles.summaryLabel}>已逾期</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{stats.reports}</Text>
              <Text className={styles.summaryLabel}>检查报告</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>复诊计划</Text>
            <Text className={styles.sectionAction} onClick={openAddModal}>
              + 添加
            </Text>
          </View>
          <View className={styles.planList}>
            {sortedPlans.map((plan) => {
              const status = getPlanStatus(plan);
              return (
                <View
                  key={plan.id}
                  className={classnames(styles.planCard, styles[status])}
                >
                  <View className={styles.planHeader}>
                    <View>
                      <Text className={styles.planHospital}>{plan.hospital}</Text>
                      <Text className={styles.planDoctor}>{plan.department} · {plan.doctor}</Text>
                    </View>
                    <Text className={classnames(styles.statusBadge, styles[status])}>
                      {getStatusText(status)}
                    </Text>
                  </View>
                  <View className={styles.planDateRow}>
                    <View className={styles.dateIcon}>📅</View>
                    <View className={styles.dateInfo}>
                      <Text className={styles.dateText}>{formatDate(plan.date)}</Text>
                      <Text className={styles.dateLabel}>{plan.time || '具体时间待定'}</Text>
                    </View>
                    <Text className={styles.daysLeft}>{getDaysLeft(plan.date)}</Text>
                  </View>
                  {plan.notes && (
                    <Text className={styles.planNotes}>📝 {plan.notes}</Text>
                  )}
                  {status !== 'completed' && status !== 'cancelled' && (
                    <View className={styles.planFooter}>
                      <Button
                        className={classnames(styles.planBtn, styles.secondary)}
                        onClick={() => handleSetReminder(plan)}
                      >
                        设置提醒
                      </Button>
                      <Button
                        className={classnames(styles.planBtn, styles.primary)}
                        onClick={() => handleComplete(plan)}
                      >
                        标记完成
                      </Button>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>检查报告</Text>
            <Text className={styles.sectionAction}>共 {medicalReports.length} 份</Text>
          </View>
          <View className={styles.uploadSection}>
            <Button className={styles.uploadButton} onClick={handleUpload}>
              <Text className={styles.uploadIcon}>📷</Text>
              <Text className={styles.uploadText}>拍摄或上传检查报告</Text>
            </Button>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.reportsSection}>
            {medicalReports.length > 0 ? (
              medicalReports.map((report) => (
                <View
                  key={report.id}
                  className={styles.reportItem}
                  onClick={() => handleViewReport(report)}
                >
                  {report.imageUrl ? (
                    <Image
                      className={styles.reportIcon}
                      src={report.imageUrl}
                      mode="aspectFill"
                    />
                  ) : (
                    <View className={styles.reportIcon}>报</View>
                  )}
                  <View className={styles.reportInfo}>
                    <Text className={styles.reportName}>{report.type}</Text>
                    <Text className={styles.reportDate}>
                      {formatDate(report.date)} · {report.hospital}
                    </Text>
                  </View>
                  <Text className={styles.reportArrow}>›</Text>
                </View>
              ))
            ) : (
              <View className={styles.empty}>暂无检查报告</View>
            )}
          </View>
        </View>
      </View>

      {showAddModal && (
        <View className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>新增复诊计划</Text>
              <Text className={styles.modalClose} onClick={() => setShowAddModal(false)}>×</Text>
            </View>

            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>复诊标题 *</Text>
                <Input
                  className={styles.formInput}
                  value={newTitle}
                  onInput={(e) => setNewTitle(e.detail.value)}
                  placeholder="如：高血压定期复查"
                />
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>医院 *</Text>
                <Input
                  className={styles.formInput}
                  value={newHospital}
                  onInput={(e) => setNewHospital(e.detail.value)}
                  placeholder="请输入医院名称"
                />
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>科室 *</Text>
                <Input
                  className={styles.formInput}
                  value={newDepartment}
                  onInput={(e) => setNewDepartment(e.detail.value)}
                  placeholder="如：心血管内科"
                />
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>医生</Text>
                <Input
                  className={styles.formInput}
                  value={newDoctor}
                  onInput={(e) => setNewDoctor(e.detail.value)}
                  placeholder="请输入医生姓名（选填）"
                />
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>复诊日期 *</Text>
                <Picker
                  mode="date"
                  value={newDate}
                  start={dayjs().format('YYYY-MM-DD')}
                  end={dayjs().add(1, 'year').format('YYYY-MM-DD')}
                  onChange={(e) => setNewDate(e.detail.value)}
                >
                  <View className={styles.formPicker}>
                    <Text className={styles.pickerText}>{newDate}</Text>
                    <Text className={styles.pickerArrow}>▼</Text>
                  </View>
                </Picker>
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>复诊时间</Text>
                <Picker
                  mode="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.detail.value)}
                >
                  <View className={styles.formPicker}>
                    <Text className={styles.pickerText}>{newTime}</Text>
                    <Text className={styles.pickerArrow}>▼</Text>
                  </View>
                </Picker>
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>备注说明</Text>
                <Textarea
                  className={styles.formTextarea}
                  value={newNotes}
                  onInput={(e) => setNewNotes(e.detail.value)}
                  placeholder="请输入备注说明（选填）"
                />
              </View>

              <View className={styles.formItem}>
                <View className={styles.switchRow}>
                  <Text className={styles.formLabel}>开启提醒</Text>
                  <Switch checked={newReminder} onChange={(e) => setNewReminder(e.detail.value)} />
                </View>
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              <Button className={styles.modalCancel} onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button className={styles.modalConfirm} onClick={handleAddFollowUp}>
                创建复诊
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FollowUpPage;
