import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useHealthStore } from '@/store/healthStore';
import { formatTime } from '@/utils';
import type { MedicationRecord, MedicationPlan } from '@/types';
import styles from './index.module.scss';

type ViewMode = 'list' | 'calendar';

const MedicationPage: React.FC = () => {
  const medicationPlans = useHealthStore((state) => state.medicationPlans);
  const medicationRecords = useHealthStore((state) => state.medicationRecords);
  const updateMedicationStatus = useHealthStore((state) => state.updateMedicationStatus);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ plan: MedicationPlan; time: string; record?: MedicationRecord; date: string } | null>(null);
  const [detailNote, setDetailNote] = useState('');
  const [detailTime, setDetailTime] = useState('');
  const [detailMissedReason, setDetailMissedReason] = useState('');

  useDidShow(() => {
    console.log('[Medication] 页面显示');
  });

  const getRecordsByDate = (date: string) => {
    return medicationRecords.filter((r) => dayjs(r.scheduledTime).format('YYYY-MM-DD') === date);
  };

  const getStatsByDate = (date: string) => {
    const records = getRecordsByDate(date);
    const totalTimes = medicationPlans.reduce((sum, plan) => sum + plan.times.length, 0);
    const taken = records.filter((r) => r.status === 'taken').length;
    const missed = records.filter((r) => r.status === 'missed').length;
    return { totalTimes, taken, missed, pending: totalTimes - taken - missed };
  };

  const todayStats = useMemo(() => getStatsByDate(dayjs().format('YYYY-MM-DD')), [medicationRecords, medicationPlans]);

  const getRecordForPlan = (planId: string, time: string, date: string) => {
    return medicationRecords.find((r) => {
      const recordDate = dayjs(r.scheduledTime).format('YYYY-MM-DD');
      const recordTime = dayjs(r.scheduledTime).format('HH:mm');
      return r.planId === planId && recordDate === date && recordTime === time;
    });
  };

  const getCalendarDays = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();
    
    const days: { date: string; day: number; isCurrentMonth: boolean; hasTaken: number; hasMissed: number }[] = [];
    
    for (let i = startDay - 1; i >= 0; i--) {
      const date = startOfMonth.subtract(i + 1, 'day');
      const records = getRecordsByDate(date.format('YYYY-MM-DD'));
      days.push({
        date: date.format('YYYY-MM-DD'),
        day: date.date(),
        isCurrentMonth: false,
        hasTaken: records.filter(r => r.status === 'taken').length,
        hasMissed: records.filter(r => r.status === 'missed').length,
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = startOfMonth.date(i);
      const records = getRecordsByDate(date.format('YYYY-MM-DD'));
      days.push({
        date: date.format('YYYY-MM-DD'),
        day: i,
        isCurrentMonth: true,
        hasTaken: records.filter(r => r.status === 'taken').length,
        hasMissed: records.filter(r => r.status === 'missed').length,
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = endOfMonth.add(i, 'day');
      const records = getRecordsByDate(date.format('YYYY-MM-DD'));
      days.push({
        date: date.format('YYYY-MM-DD'),
        day: date.date(),
        isCurrentMonth: false,
        hasTaken: records.filter(r => r.status === 'taken').length,
        hasMissed: records.filter(r => r.status === 'missed').length,
      });
    }
    
    return days;
  };

  const calendarDays = useMemo(() => getCalendarDays(), [currentMonth, medicationRecords]);

  const handleMarkTaken = (planId: string, time: string, date: string) => {
    const takenAt = date + ' ' + time;
    updateMedicationStatus(planId + '_' + date + '_' + time, 'taken', takenAt, planId, {
      actualTakenTime: dayjs().toISOString(),
    });
    Taro.showToast({ title: '已标记为已服用', icon: 'success' });
  };

  const handleMarkMissed = (planId: string, time: string, date: string) => {
    Taro.showModal({
      title: '漏服确认',
      content: '确认标记为漏服吗？',
      success: (res) => {
        if (res.confirm) {
          const takenAt = date + ' ' + time;
          updateMedicationStatus(planId + '_' + date + '_' + time, 'missed', takenAt, planId);
          Taro.showToast({ title: '已标记为漏服', icon: 'none' });
        }
      },
    });
  };

  const openRecordDetail = (plan: MedicationPlan, time: string, record: MedicationRecord | undefined, date: string) => {
    setSelectedRecord({ plan, time, record, date });
    setDetailNote(record?.note || '');
    setDetailTime(record?.actualTakenTime ? dayjs(record.actualTakenTime).format('HH:mm') : time);
    setDetailMissedReason(record?.missedReason || '');
    setShowDetailModal(true);
  };

  const handleSaveDetail = () => {
    if (!selectedRecord) return;
    
    const { plan, time, date, record } = selectedRecord;
    const recordId = record?.id || (plan.id + '_' + date + '_' + time);
    const takenAt = date + ' ' + time;
    
    if (!record || record.status === 'pending') {
      Taro.showToast({ title: '请先标记为已服或漏服', icon: 'none' });
      return;
    }
    
    const actualTakenTime = record.status === 'taken' || detailTime !== time
      ? dayjs(date + ' ' + detailTime).toISOString()
      : undefined;

    updateMedicationStatus(
      recordId,
      record.status,
      takenAt,
      plan.id,
      {
        actualTakenTime,
        missedReason: detailMissedReason || undefined,
        note: detailNote || undefined,
      }
    );
    
    setShowDetailModal(false);
    Taro.showToast({ title: '保存成功', icon: 'success' });
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = { taken: '已服用', missed: '漏服', pending: '待服用' };
    return texts[status] || status;
  };

  const renderDayMedications = (date: string) => {
    const stats = getStatsByDate(date);
    return (
      <View className={styles.dayDetail}>
        <View className={styles.dayHeader}>
          <Text className={styles.dayDate}>{dayjs(date).format('YYYY年MM月DD日 dddd')}</Text>
          <View className={styles.dayStats}>
            <Text className={styles.dayStatText}>已服 {stats.taken}</Text>
            <Text className={styles.dayStatText}>漏服 {stats.missed}</Text>
            <Text className={styles.dayStatText}>待服 {stats.pending}</Text>
          </View>
        </View>

        <View className={styles.planList}>
          {medicationPlans.map((plan) => (
            <View key={plan.id} className={styles.planCard}>
              <View className={styles.planHeader}>
                <View>
                  <Text className={styles.planName}>{plan.name}</Text>
                  <Text className={styles.planDosage}>{plan.dosage} · {plan.frequency}</Text>
                </View>
              </View>
              <View className={styles.timesList}>
                {plan.times.map((time) => {
                  const record = getRecordForPlan(plan.id, time, date);
                  const status = record?.status || 'pending';
                  return (
                    <View 
                      key={time} 
                      className={classnames(styles.timeItem, styles.clickable)}
                      onClick={() => openRecordDetail(plan, time, record, date)}
                    >
                      <View className={styles.timeLeft}>
                        <Text className={styles.timeText}>{time}</Text>
                        <Text className={styles.timeLabel}>
                          {status === 'taken' 
                            ? `已服用于 ${formatTime(record!.actualTakenTime || record!.takenAt)}` 
                            : record?.missedReason
                              ? `漏服 · ${record.missedReason}`
                              : getStatusText(status)
                          }
                        </Text>
                        {record?.note && <Text className={styles.timeNote}>📝 {record.note}</Text>}
                      </View>
                      <View className={styles.timeActions}>
                        {status === 'pending' ? (
                          <>
                            <Button
                              className={classnames(styles.timeBtn, styles.taken)}
                              onClick={(e) => { e.stopPropagation(); handleMarkTaken(plan.id, time, date); }}
                            >
                              已服
                            </Button>
                            <Button
                              className={classnames(styles.timeBtn, styles.missed)}
                              onClick={(e) => { e.stopPropagation(); handleMarkMissed(plan.id, time, date); }}
                            >
                              漏服
                            </Button>
                          </>
                        ) : (
                          <Text className={classnames(styles.statusBadge, styles[status])}>
                            {getStatusText(status)}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
              {plan.instructions && (
                <View className={styles.planFooter}>
                  <Text className={styles.planNote}>💡 {plan.instructions}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.content}>
        <View className={styles.summaryCard}>
          <View className={styles.summaryRow}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{todayStats.totalTimes}</Text>
              <Text className={styles.summaryLabel}>每日次数</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{todayStats.taken}</Text>
              <Text className={styles.summaryLabel}>已服用</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{todayStats.missed}</Text>
              <Text className={styles.summaryLabel}>漏服</Text>
            </View>
          </View>
        </View>

        <View className={styles.viewToggle}>
          <Text 
            className={classnames(styles.toggleBtn, viewMode === 'list' && styles.active)}
            onClick={() => setViewMode('list')}
          >
            列表视图
          </Text>
          <Text 
            className={classnames(styles.toggleBtn, viewMode === 'calendar' && styles.active)}
            onClick={() => setViewMode('calendar')}
          >
            日历视图
          </Text>
        </View>

        {viewMode === 'calendar' && (
          <View className={styles.section}>
            <View className={styles.calendarHeader}>
              <Text className={styles.navArrow} onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}>
                ‹
              </Text>
              <Text className={styles.monthTitle}>{currentMonth.format('YYYY年MM月')}</Text>
              <Text className={styles.navArrow} onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}>
                ›
              </Text>
            </View>
            
            <View className={styles.weekDays}>
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <Text key={d} className={styles.weekDay}>{d}</Text>
              ))}
            </View>
            
            <View className={styles.calendarGrid}>
              {calendarDays.map((day, idx) => (
                <View
                  key={idx}
                  className={classnames(
                    styles.calendarDay,
                    !day.isCurrentMonth && styles.otherMonth,
                    selectedDate === day.date && styles.selected,
                    day.date === dayjs().format('YYYY-MM-DD') && styles.today
                  )}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <Text className={styles.dayNumber}>{day.day}</Text>
                  <View className={styles.dayIndicators}>
                    {day.hasTaken > 0 && <View className={classnames(styles.dot, styles.dotTaken)} />}
                    {day.hasMissed > 0 && <View className={classnames(styles.dot, styles.dotMissed)} />}
                  </View>
                </View>
              ))}
            </View>

            <View className={styles.calendarLegend}>
              <View className={styles.legendItem}>
                <View className={classnames(styles.dot, styles.dotTaken)} />
                <Text className={styles.legendText}>已服用</Text>
              </View>
              <View className={styles.legendItem}>
                <View className={classnames(styles.dot, styles.dotMissed)} />
                <Text className={styles.legendText}>有漏服</Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              {viewMode === 'calendar' 
                ? `${dayjs(selectedDate).format('MM月DD日')} 用药情况` 
                : '今日用药计划'}
            </Text>
            {viewMode === 'calendar' && (
              <Text 
                className={styles.sectionAction}
                onClick={() => setSelectedDate(dayjs().format('YYYY-MM-DD'))}
              >
                返回今日
              </Text>
            )}
          </View>

          {renderDayMedications(viewMode === 'calendar' ? selectedDate : dayjs().format('YYYY-MM-DD'))}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>最近7天记录</Text>
          <View className={styles.historySection}>
            {Array.from({ length: 7 }).map((_, offset) => {
              const date = dayjs().subtract(offset, 'day').format('YYYY-MM-DD');
              const records = getRecordsByDate(date);
              const stats = getStatsByDate(date);
              
              return (
                <View key={date} className={styles.dayHistoryItem}>
                  <View className={styles.historyDateRow}>
                    <Text className={styles.historyDate}>
                      {offset === 0 ? '今天' : offset === 1 ? '昨天' : dayjs(date).format('MM月DD日')}
                    </Text>
                    <View className={styles.historyStats}>
                      <Text className={styles.historyStatGreen}>已服 {stats.taken}</Text>
                      <Text className={styles.historyStatRed}>漏服 {stats.missed}</Text>
                    </View>
                  </View>
                  {records.length > 0 ? (
                    records.map((record) => {
                      const plan = medicationPlans.find((p) => p.id === record.planId);
                      return (
                        <View key={record.id} className={styles.historyItem}>
                          <View className={styles.historyLeft}>
                            <Text className={styles.historyMed}>{plan?.name || '未知药物'}</Text>
                            <Text className={styles.historyTime}>
                              {dayjs(record.takenAt).format('HH:mm')} · {plan?.dosage}
                              {record.missedReason && ` · 原因: ${record.missedReason}`}
                            </Text>
                            {record.note && <Text className={styles.timeNote}>📝 {record.note}</Text>}
                          </View>
                          <Text className={classnames(styles.statusBadge, styles[record.status])}>
                            {getStatusText(record.status)}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text className={styles.historyEmpty}>当日无记录</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {showDetailModal && selectedRecord && (
        <View className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>用药详情</Text>
              <Text className={styles.modalClose} onClick={() => setShowDetailModal(false)}>×</Text>
            </View>

            <View className={styles.modalBody}>
              <View className={styles.detailInfo}>
                <Text className={styles.detailMedName}>{selectedRecord.plan.name}</Text>
                <Text className={styles.detailMedInfo}>
                  {selectedRecord.plan.dosage} · 计划 {selectedRecord.time} 服用
                </Text>
                <Text className={styles.detailDate}>{selectedRecord.date}</Text>
              </View>

              {selectedRecord.record?.status === 'taken' && (
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>实际服药时间</Text>
                  <Input
                    className={styles.formInput}
                    value={detailTime}
                    onInput={(e) => setDetailTime(e.detail.value)}
                    placeholder="HH:mm"
                  />
                </View>
              )}

              {selectedRecord.record?.status === 'missed' && (
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>漏服原因</Text>
                  <Textarea
                    className={styles.formTextarea}
                    value={detailMissedReason}
                    onInput={(e) => setDetailMissedReason(e.detail.value)}
                    placeholder="请输入漏服原因（如：忘记了、身体不适等）"
                  />
                </View>
              )}

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>备注说明</Text>
                <Textarea
                  className={styles.formTextarea}
                  value={detailNote}
                  onInput={(e) => setDetailNote(e.detail.value)}
                  placeholder="请输入备注说明（选填）"
                />
              </View>
            </View>

            <View className={styles.modalFooter}>
              <Button className={styles.modalCancel} onClick={() => setShowDetailModal(false)}>
                取消
              </Button>
              <Button className={styles.modalConfirm} onClick={handleSaveDetail}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default MedicationPage;
