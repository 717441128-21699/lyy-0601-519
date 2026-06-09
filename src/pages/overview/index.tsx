import React, { useState, useCallback } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import {
  useHealthStore,
  useTodayRecords,
  useTodayMedications,
  useAbnormalRecords,
  useLatestTodayRecord,
} from '@/store/healthStore';
import {
  getRecordTypeName,
  getRecordUnit,
  getRecordDisplayValue,
  getRelativeTime,
} from '@/utils';
import type { HealthRecordType, MedicationRecord } from '@/types';
import styles from './index.module.scss';

interface StatCardProps {
  type: HealthRecordType;
  value: string;
  unit: string;
  extra?: string;
  isAbnormal: boolean;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ type, value, unit, extra, isAbnormal, color }) => (
  <View className={styles.statCard}>
    <View className={styles.statHeader}>
      <View className={styles.statIndicator} style={{ backgroundColor: color }} />
      <Text className={styles.statName}>{getRecordTypeName(type)}</Text>
    </View>
    <View className={styles.statValueRow}>
      <Text className={classnames(styles.statValue, isAbnormal && styles.abnormal)}>{value}</Text>
      <Text className={styles.statUnit}>{unit}</Text>
    </View>
    {extra && <Text className={styles.statExtra}>{extra}</Text>}
  </View>
);

const OverviewPage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const todayRecords = useTodayRecords();
  const todayMedications = useTodayMedications();
  const abnormalRecords = useAbnormalRecords();
  const userProfile = useHealthStore((state) => state.userProfile);

  const latestBP = useLatestTodayRecord('bloodPressure');
  const latestBS = useLatestTodayRecord('bloodSugar');
  const latestTemp = useLatestTodayRecord('temperature');
  const latestWeight = useLatestTodayRecord('weight');

  useDidShow(() => {
    console.log('[Overview] 页面显示，最新记录:', { latestBP, latestBS, latestTemp, latestWeight });
  });

  const completedRecords = todayRecords.length;
  const totalExpected = 6;
  const progressPercent = Math.min((completedRecords / totalExpected) * 100, 100);

  const pendingMedications = todayMedications.filter((m) => m.status === 'pending');
  const latestAbnormal = abnormalRecords[0];

  const greeting = () => {
    const hour = dayjs().hour();
    if (hour < 6) return '夜深了，注意休息';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    console.log('[Overview] 下拉刷新');
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  }, []);

  const handleQuickRecord = (type: HealthRecordType) => {
    console.log('[Overview] 快捷记录:', type);
    Taro.showToast({
      title: `记录${getRecordTypeName(type)}`,
      icon: 'none',
    });
    Taro.switchTab({ url: '/pages/records/index' });
  };

  const handleNavigate = (url: string) => {
    console.log('[Overview] 导航到:', url);
    if (url.startsWith('/pages/medication') || url.startsWith('/pages/followup') || url.startsWith('/pages/abnormal')) {
      Taro.navigateTo({ url });
    } else {
      Taro.switchTab({ url });
    }
  };

  const handleEmergencyCall = () => {
    console.log('[Overview] 紧急呼叫');
    Taro.makePhoneCall({
      phoneNumber: '120',
      fail: (err) => console.error('[Overview] 拨号失败:', err),
    });
  };

  const getMedicationStatusText = (status: MedicationRecord['status']) => {
    const texts = { pending: '待服用', taken: '已服用', missed: '漏服' };
    return texts[status];
  };

  const entries = [
    { name: '用药提醒', url: '/pages/medication/index', color: '#8B5CF6', icon: '药' },
    { name: '复诊计划', url: '/pages/followup/index', color: '#06B6D4', icon: '诊' },
    { name: '异常上报', url: '/pages/abnormal/index', color: '#EF4444', icon: '警' },
    { name: '健康档案', url: '/pages/archives/index', color: '#10B981', icon: '档' },
  ];

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.header}>
        <View className={styles.dateRow}>
          <Text className={styles.dateText}>
            {dayjs().format('YYYY年MM月DD日 dddd')}
          </Text>
        </View>
        <Text className={styles.greeting}>{greeting()}，{userProfile.name}</Text>
        <Text className={styles.subGreeting}>今天也要保持健康哦 💚</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.statsGrid}>
          <StatCard
            type="bloodPressure"
            value={latestBP ? getRecordDisplayValue(latestBP) : '--'}
            unit={getRecordUnit('bloodPressure')}
            extra={latestBP?.note}
            isAbnormal={latestBP?.isAbnormal || false}
            color="#EF4444"
          />
          <StatCard
            type="bloodSugar"
            value={latestBS ? getRecordDisplayValue(latestBS) : '--'}
            unit={getRecordUnit('bloodSugar')}
            extra={latestBS?.note}
            isAbnormal={latestBS?.isAbnormal || false}
            color="#F97316"
          />
          <StatCard
            type="temperature"
            value={latestTemp ? getRecordDisplayValue(latestTemp) : '--'}
            unit={getRecordUnit('temperature')}
            extra={latestTemp?.note}
            isAbnormal={latestTemp?.isAbnormal || false}
            color="#3B82F6"
          />
          <StatCard
            type="weight"
            value={latestWeight ? getRecordDisplayValue(latestWeight) : '--'}
            unit={getRecordUnit('weight')}
            extra={latestWeight?.note}
            isAbnormal={latestWeight?.isAbnormal || false}
            color="#22C55E"
          />
        </View>

        <View className={styles.progressCard}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressTitle}>今日记录完成度</Text>
            <Text className={styles.progressCount}>{completedRecords} / {totalExpected}</Text>
          </View>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </View>
        </View>

        <View className={styles.quickActions}>
          <Button
            className={styles.quickButton}
            onClick={() => handleQuickRecord('bloodPressure')}
          >
            记录血压
          </Button>
          <Button
            className={classnames(styles.quickButton, styles.secondary)}
            onClick={() => handleQuickRecord('bloodSugar')}
          >
            记录血糖
          </Button>
          <Button
            className={classnames(styles.quickButton, styles.secondary)}
            onClick={() => handleQuickRecord('temperature')}
          >
            记录体温
          </Button>
          <Button
            className={classnames(styles.quickButton, styles.secondary)}
            onClick={() => handleQuickRecord('weight')}
          >
            记录体重
          </Button>
        </View>

        {latestAbnormal && (
          <View className={styles.alertCard}>
            <View className={styles.alertHeader}>
              <View className={styles.alertIcon}>!</View>
              <Text className={styles.alertTitle}>健康异常提醒</Text>
            </View>
            <Text className={styles.alertContent}>
              {getRelativeTime(latestAbnormal.recordedAt)}测量
              {getRecordTypeName(latestAbnormal.type)}：
              <Text className={classnames(styles.statValue, styles.abnormal)}>
                {getRecordDisplayValue(latestAbnormal)}
              </Text>
              {getRecordUnit(latestAbnormal.type)}，超出正常范围，请密切关注。
            </Text>
            <Button className={styles.alertAction} onClick={handleEmergencyCall}>
              紧急呼叫
            </Button>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>今日用药提醒</Text>
            <Text
              className={styles.sectionMore}
              onClick={() => handleNavigate('/pages/medication/index')}
            >
              查看全部
            </Text>
          </View>
          <View className={styles.reminderList}>
            {pendingMedications.length > 0 ? (
              pendingMedications.slice(0, 3).map((med) => (
                <View
                  key={med.id}
                  className={styles.reminderItem}
                  onClick={() => handleNavigate('/pages/medication/index')}
                >
                  <View className={classnames(styles.reminderDot, styles[med.status])} />
                  <View className={styles.reminderContent}>
                    <Text className={styles.reminderTitle}>{med.name}</Text>
                    <Text className={styles.reminderTime}>
                      {dayjs(med.scheduledTime).format('HH:mm')} · {med.status === 'missed' ? '漏服' : '待服用'}
                    </Text>
                  </View>
                  <Text className={classnames(styles.reminderStatus, styles[med.status])}>
                    {getMedicationStatusText(med.status)}
                  </Text>
                </View>
              ))
            ) : (
              <View className={styles.empty}>今日用药已全部完成 ✓</View>
            )}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>功能入口</Text>
          </View>
          <View className={styles.entryGrid}>
            {entries.map((entry) => (
              <View
                key={entry.name}
                className={styles.entryItem}
                onClick={() => handleNavigate(entry.url)}
              >
                <View className={styles.entryIcon} style={{ backgroundColor: entry.color }}>
                  {entry.icon}
                </View>
                <Text className={styles.entryName}>{entry.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default OverviewPage;
