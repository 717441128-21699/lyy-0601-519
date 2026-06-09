import React, { useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useHealthStore } from '@/store/healthStore';
import { formatTime } from '@/utils';
import styles from './index.module.scss';

const MedicationPage: React.FC = () => {
  const medicationPlans = useHealthStore((state) => state.medicationPlans);
  const medicationRecords = useHealthStore((state) => state.medicationRecords);
  const updateMedicationStatus = useHealthStore((state) => state.updateMedicationStatus);

  useDidShow(() => {
    console.log('[Medication] 页面显示');
  });

  const todayRecords = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return medicationRecords.filter((r) => dayjs(r.takenAt).format('YYYY-MM-DD') === today);
  }, [medicationRecords]);

  const stats = useMemo(() => {
    const totalTimes = medicationPlans.reduce((sum, plan) => sum + plan.times.length, 0);
    const takenToday = todayRecords.filter((r) => r.status === 'taken').length;
    const missedToday = todayRecords.filter((r) => r.status === 'missed').length;
    return { totalTimes, takenToday, missedToday, pending: totalTimes - takenToday - missedToday };
  }, [medicationPlans, todayRecords]);

  const getTodayRecord = (planId: string, time: string) => {
    const today = dayjs().format('YYYY-MM-DD');
    return medicationRecords.find((r) => {
      const recordDate = dayjs(r.takenAt).format('YYYY-MM-DD');
      const recordTime = dayjs(r.takenAt).format('HH:mm');
      return r.planId === planId && recordDate === today && recordTime === time;
    });
  };

  const handleMarkTaken = (planId: string, time: string) => {
    const takenAt = dayjs().format('YYYY-MM-DD') + ' ' + time;
    updateMedicationStatus(planId + '_' + time, 'taken', takenAt, planId);
    Taro.showToast({ title: '已标记为已服用', icon: 'success' });
    console.log('[Medication] 标记已服用:', planId, time);
  };

  const handleMarkMissed = (planId: string, time: string) => {
    Taro.showModal({
      title: '漏服确认',
      content: '确认标记为漏服吗？',
      success: (res) => {
        if (res.confirm) {
          const takenAt = dayjs().format('YYYY-MM-DD') + ' ' + time;
          updateMedicationStatus(planId + '_' + time, 'missed', takenAt, planId);
          Taro.showToast({ title: '已标记为漏服', icon: 'none' });
          console.log('[Medication] 标记漏服:', planId, time);
        }
      },
    });
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = { taken: '已服用', missed: '漏服', pending: '待服用' };
    return texts[status] || status;
  };

  const recentRecords = useMemo(() => {
    return [...medicationRecords]
      .sort((a, b) => dayjs(b.takenAt).valueOf() - dayjs(a.takenAt).valueOf())
      .slice(0, 5);
  }, [medicationRecords]);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.content}>
        <View className={styles.summaryCard}>
          <View className={styles.summaryRow}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{stats.totalTimes}</Text>
              <Text className={styles.summaryLabel}>每日次数</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{stats.takenToday}</Text>
              <Text className={styles.summaryLabel}>已服用</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{stats.missedToday}</Text>
              <Text className={styles.summaryLabel}>漏服</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24rpx' }}>
            <Text className={styles.sectionTitle}>用药计划</Text>
            <Text className={styles.sectionAction} onClick={() => Taro.showToast({ title: '添加用药', icon: 'none' })}>
              + 添加
            </Text>
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
                    const record = getTodayRecord(plan.id, time);
                    const status = record?.status || 'pending';
                    return (
                      <View key={time} className={styles.timeItem}>
                        <View className={styles.timeLeft}>
                          <Text className={styles.timeText}>{time}</Text>
                          <Text className={styles.timeLabel}>
                            {status === 'taken' ? `已服用于 ${formatTime(record!.takenAt)}` : getStatusText(status)}
                          </Text>
                        </View>
                        <View className={styles.timeActions}>
                          {status === 'pending' ? (
                            <>
                              <Button
                                className={classnames(styles.timeBtn, styles.taken)}
                                onClick={() => handleMarkTaken(plan.id, time)}
                              >
                                已服
                              </Button>
                              <Button
                                className={classnames(styles.timeBtn, styles.missed)}
                                onClick={() => handleMarkMissed(plan.id, time)}
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

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>最近记录</Text>
          <View className={styles.historySection}>
            {recentRecords.length > 0 ? (
              recentRecords.map((record) => {
                const plan = medicationPlans.find((p) => p.id === record.planId);
                return (
                  <View key={record.id} className={styles.historyItem}>
                    <View className={styles.historyLeft}>
                      <Text className={styles.historyMed}>{plan?.name || '未知药物'}</Text>
                      <Text className={styles.historyTime}>
                        {dayjs(record.takenAt).format('MM-DD HH:mm')} · {plan?.dosage}
                      </Text>
                    </View>
                    <Text className={classnames(styles.statusBadge, styles[record.status])}>
                      {getStatusText(record.status)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View className={styles.empty}>暂无用药记录</View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default MedicationPage;
