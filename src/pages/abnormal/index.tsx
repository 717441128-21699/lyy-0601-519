import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useHealthStore } from '@/store/healthStore';
import { formatDateTime } from '@/utils';
import styles from './index.module.scss';

type AbnormalType = 'blood_pressure' | 'blood_sugar' | 'temperature' | 'symptom' | 'medication' | 'other';
type SeverityLevel = 'mild' | 'moderate' | 'severe';

const typeOptions = [
  { key: 'blood_pressure' as const, icon: '🩺', label: '血压异常' },
  { key: 'blood_sugar' as const, icon: '🩸', label: '血糖异常' },
  { key: 'temperature' as const, icon: '🌡️', label: '体温异常' },
  { key: 'symptom' as const, icon: '🤒', label: '身体不适' },
  { key: 'medication' as const, icon: '💊', label: '用药问题' },
  { key: 'other' as const, icon: '⚠️', label: '其他异常' },
];

const levelOptions = [
  { key: 'mild' as const, label: '轻微' },
  { key: 'moderate' as const, label: '中等' },
  { key: 'severe' as const, label: '严重' },
];

const AbnormalPage: React.FC = () => {
  const abnormalReports = useHealthStore((state) => state.abnormalReports);
  const addAbnormalReport = useHealthStore((state) => state.addAbnormalReport);

  const [abnormalType, setAbnormalType] = useState<AbnormalType>('symptom');
  const [severity, setSeverity] = useState<SeverityLevel>('mild');
  const [description, setDescription] = useState('');
  const [symptoms, setSymptoms] = useState('');

  useDidShow(() => {
    console.log('[Abnormal] 页面显示');
  });

  const handleSubmit = () => {
    if (!description.trim()) {
      Taro.showToast({ title: '请描述异常情况', icon: 'none' });
      return;
    }

    if (severity === 'severe') {
      Taro.showModal({
        title: '严重异常警告',
        content: '您标记为严重异常，是否立即呼叫紧急联系人？',
        confirmText: '立即呼叫',
        cancelText: '仅上报',
        success: (res) => {
          if (res.confirm) {
            console.log('[Abnormal] 呼叫紧急联系人');
            Taro.makePhoneCall({ phoneNumber: '120' });
          }
          submitReport();
        },
      });
    } else {
      submitReport();
    }
  };

  const submitReport = () => {
    const typeLabel = typeOptions.find((t) => t.key === abnormalType)?.label || '异常';
    addAbnormalReport({
      type: typeLabel,
      severity,
      description: description.trim(),
      symptoms: symptoms.trim(),
      reportedBy: '用户',
      status: 'pending',
    });

    setDescription('');
    setSymptoms('');
    setAbnormalType('symptom');
    setSeverity('mild');

    Taro.showToast({ title: '上报成功', icon: 'success' });
    console.log('[Abnormal] 异常已上报');
  };

  const sortedReports = useMemo(() => {
    return [...abnormalReports]
      .sort((a, b) => dayjs(b.reportedAt).valueOf() - dayjs(a.reportedAt).valueOf())
      .slice(0, 10);
  }, [abnormalReports]);

  const getLevelText = (level: string) => {
    const texts: Record<string, string> = { mild: '轻微', moderate: '中等', severe: '严重' };
    return texts[level] || level;
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.content}>
        <View className={styles.alertBanner}>
          <Text className={styles.alertTitle}>🚨 异常情况上报</Text>
          <Text className={styles.alertDesc}>
            如遇紧急情况，请直接拨打120或联系紧急联系人
          </Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>上报异常</Text>
          <View className={styles.formCard}>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>异常类型
              </Text>
              <View className={styles.typeGrid}>
                {typeOptions.map((opt) => (
                  <View
                    key={opt.key}
                    className={classnames(styles.typeItem, abnormalType === opt.key && styles.active)}
                    onClick={() => setAbnormalType(opt.key)}
                  >
                    <Text className={styles.typeIcon}>{opt.icon}</Text>
                    <Text className={styles.typeText}>{opt.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>严重程度
              </Text>
              <View className={styles.levelRow}>
                {levelOptions.map((opt) => (
                  <View
                    key={opt.key}
                    className={classnames(
                      styles.levelItem,
                      severity === opt.key && styles.active,
                      severity === opt.key && styles[opt.key]
                    )}
                    onClick={() => setSeverity(opt.key)}
                  >
                    <Text className={classnames(
                      styles.levelText,
                      severity === opt.key && styles[opt.key]
                    )}>
                      {opt.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>异常描述
              </Text>
              <Textarea
                className={styles.formTextarea}
                value={description}
                onInput={(e) => setDescription(e.detail.value)}
                placeholder="请详细描述异常情况，例如：血压160/95，伴有头晕..."
                maxlength={500}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>具体症状（可选）</Text>
              <Input
                className={styles.formInput}
                value={symptoms}
                onInput={(e) => setSymptoms(e.detail.value)}
                placeholder="例如：头晕、头痛、恶心..."
              />
            </View>

            {severity === 'severe' && (
              <View className={styles.emergencyTips}>
                <Text className={styles.tipsTitle}>⚠️ 紧急提醒</Text>
                <Text className={styles.tipsText}>
                  您标记为严重异常，提交时将提示呼叫紧急联系人。
                  如情况危急，请立即拨打120急救电话。
                </Text>
              </View>
            )}

            <Button className={styles.submitBtn} onClick={handleSubmit}>
              📤 提交上报
            </Button>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>历史上报</Text>
            <Text className={styles.sectionAction}>共 {abnormalReports.length} 条</Text>
          </View>
          <View className={styles.historySection}>
            {sortedReports.length > 0 ? (
              sortedReports.map((report) => (
                <View key={report.id} className={styles.historyItem}>
                  <View className={styles.historyHeader}>
                    <Text className={styles.historyType}>{report.type}</Text>
                    <Text className={classnames(styles.historyLevel, styles[report.severity])}>
                      {getLevelText(report.severity)}
                    </Text>
                  </View>
                  <Text className={styles.historyDesc}>{report.description}</Text>
                  {report.symptoms && (
                    <Text className={styles.historyDesc}>症状：{report.symptoms}</Text>
                  )}
                  <Text className={styles.historyTime}>
                    {formatDateTime(report.reportedAt)} · {report.reportedBy}
                  </Text>
                </View>
              ))
            ) : (
              <View className={styles.empty}>暂无异常上报记录</View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default AbnormalPage;
