import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Input,
  Textarea,
  Button,
  ScrollView,
} from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useHealthStore } from '@/store/healthStore';
import {
  getRecordTypeName,
  getRecordUnit,
  getRecordDisplayValue,
  getBloodSugarPeriodName,
  formatDateTime,
  calculateBMI,
  getBMILevel,
} from '@/utils';
import type {
  HealthRecordType,
  HealthRecord,
  BloodPressureRecord,
  BloodSugarRecord,
  TemperatureRecord,
  WeightRecord,
} from '@/types';
import TrendChart from '@/components/TrendChart';
import StatusBadge from '@/components/StatusBadge';
import styles from './index.module.scss';

interface TabItem {
  key: HealthRecordType;
  label: string;
  color: string;
}

const tabs: TabItem[] = [
  { key: 'bloodPressure', label: '血压', color: '#EF4444' },
  { key: 'bloodSugar', label: '血糖', color: '#F97316' },
  { key: 'temperature', label: '体温', color: '#3B82F6' },
  { key: 'weight', label: '体重', color: '#22C55E' },
];

const bloodSugarPeriods = [
  { key: 'fasting', label: '空腹' },
  { key: 'beforeMeal', label: '餐前' },
  { key: 'afterMeal', label: '餐后2h' },
  { key: 'beforeBed', label: '睡前' },
];

const RecordsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HealthRecordType>('bloodPressure');
  const [showForm, setShowForm] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [sugarPeriod, setSugarPeriod] = useState<'fasting' | 'beforeMeal' | 'afterMeal' | 'beforeBed'>('fasting');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('170');
  const [note, setNote] = useState('');
  const [diet, setDiet] = useState('');
  const [sleep, setSleep] = useState('');

  const healthRecords = useHealthStore((state) => state.healthRecords);
  const addHealthRecord = useHealthStore((state) => state.addHealthRecord);
  const userProfile = useHealthStore((state) => state.userProfile);

  useDidShow(() => {
    console.log('[Records] 页面显示');
  });

  const filteredRecords = useMemo(() => {
    const typeRecords = healthRecords.filter((r) => r.type === activeTab);
    const now = dayjs();
    let startDate: dayjs.Dayjs;

    switch (timeRange) {
      case '7d':
        startDate = now.subtract(7, 'day');
        break;
      case '30d':
        startDate = now.subtract(30, 'day');
        break;
      default:
        return typeRecords;
    }

    return typeRecords.filter((r) => dayjs(r.recordedAt).isAfter(startDate));
  }, [healthRecords, activeTab, timeRange]);

  const handleSubmit = useCallback(() => {
    let data: HealthRecord['data'] | undefined;
    let isValid = true;

    switch (activeTab) {
      case 'bloodPressure': {
        const sys = Number(systolic);
        const dia = Number(diastolic);
        const pul = pulse ? Number(pulse) : undefined;
        if (!sys || !dia) {
          Taro.showToast({ title: '请输入收缩压和舒张压', icon: 'none' });
          isValid = false;
          break;
        }
        data = { systolic: sys, diastolic: dia, pulse: pul } as BloodPressureRecord;
        break;
      }
      case 'bloodSugar': {
        const value = Number(bloodSugar);
        if (!value) {
          Taro.showToast({ title: '请输入血糖值', icon: 'none' });
          isValid = false;
          break;
        }
        data = { value, period: sugarPeriod } as BloodSugarRecord;
        break;
      }
      case 'temperature': {
        const value = Number(temperature);
        if (!value) {
          Taro.showToast({ title: '请输入体温', icon: 'none' });
          isValid = false;
          break;
        }
        data = { value } as TemperatureRecord;
        break;
      }
      case 'weight': {
        const w = Number(weight);
        const h = height ? Number(height) : userProfile.height;
        if (!w) {
          Taro.showToast({ title: '请输入体重', icon: 'none' });
          isValid = false;
          break;
        }
        const bmi = h ? calculateBMI(w, h) : undefined;
        data = { value: w, height: h, bmi } as WeightRecord;
        break;
      }
      default:
        return;
    }

    if (!isValid || !data) return;

    addHealthRecord({
      type: activeTab,
      data,
      note: note || undefined,
      diet: diet || undefined,
      sleep: sleep || undefined,
      recordedAt: new Date().toISOString(),
      recordedBy: '张小明',
    });

    Taro.showToast({ title: '记录成功', icon: 'success' });
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setBloodSugar('');
    setTemperature('');
    setWeight('');
    setNote('');
    setDiet('');
    setSleep('');

    console.log('[Records] 记录已添加:', activeTab, data);
  }, [activeTab, systolic, diastolic, pulse, bloodSugar, sugarPeriod, temperature, weight, height, note, diet, sleep, addHealthRecord, userProfile.height]);

  const renderForm = () => {
    switch (activeTab) {
      case 'bloodPressure':
        return (
          <>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>收缩压（高压）</Text>
              <View className={styles.inputWrapper}>
                <Input
                  className={styles.inputField}
                  type="digit"
                  value={systolic}
                  onInput={(e) => setSystolic(e.detail.value)}
                  placeholder="请输入收缩压"
                  placeholderClass="input-placeholder"
                />
                <Text className={styles.inputUnit}>mmHg</Text>
              </View>
            </View>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>舒张压（低压）</Text>
              <View className={styles.inputWrapper}>
                <Input
                  className={styles.inputField}
                  type="digit"
                  value={diastolic}
                  onInput={(e) => setDiastolic(e.detail.value)}
                  placeholder="请输入舒张压"
                  placeholderClass="input-placeholder"
                />
                <Text className={styles.inputUnit}>mmHg</Text>
              </View>
            </View>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>脉搏（可选）</Text>
              <View className={styles.inputWrapper}>
                <Input
                  className={styles.inputField}
                  type="digit"
                  value={pulse}
                  onInput={(e) => setPulse(e.detail.value)}
                  placeholder="请输入脉搏"
                  placeholderClass="input-placeholder"
                />
                <Text className={styles.inputUnit}>次/分</Text>
              </View>
            </View>
          </>
        );

      case 'bloodSugar':
        return (
          <>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>测量时段</Text>
              <View className={styles.segmentedControl}>
                {bloodSugarPeriods.map((period) => (
                  <View
                    key={period.key}
                    className={classnames(styles.segmentedItem, sugarPeriod === period.key && styles.active)}
                    onClick={() => setSugarPeriod(period.key as typeof sugarPeriod)}
                  >
                    {period.label}
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>血糖值</Text>
              <View className={styles.inputWrapper}>
                <Input
                  className={styles.inputField}
                  type="digit"
                  value={bloodSugar}
                  onInput={(e) => setBloodSugar(e.detail.value)}
                  placeholder="请输入血糖值"
                  placeholderClass="input-placeholder"
                />
                <Text className={styles.inputUnit}>mmol/L</Text>
              </View>
            </View>
          </>
        );

      case 'temperature':
        return (
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>体温</Text>
            <View className={styles.inputWrapper}>
              <Input
                className={styles.inputField}
                type="digit"
                value={temperature}
                onInput={(e) => setTemperature(e.detail.value)}
                placeholder="请输入体温"
                placeholderClass="input-placeholder"
              />
              <Text className={styles.inputUnit}>℃</Text>
            </View>
          </View>
        );

      case 'weight':
        return (
          <>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>体重</Text>
              <View className={styles.inputWrapper}>
                <Input
                  className={styles.inputField}
                  type="digit"
                  value={weight}
                  onInput={(e) => setWeight(e.detail.value)}
                  placeholder="请输入体重"
                  placeholderClass="input-placeholder"
                />
                <Text className={styles.inputUnit}>kg</Text>
              </View>
            </View>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>身高（用于计算BMI）</Text>
              <View className={styles.inputWrapper}>
                <Input
                  className={styles.inputField}
                  type="digit"
                  value={height}
                  onInput={(e) => setHeight(e.detail.value)}
                  placeholder="请输入身高"
                  placeholderClass="input-placeholder"
                />
                <Text className={styles.inputUnit}>cm</Text>
              </View>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const renderRecordExtra = (record: typeof filteredRecords[0]) => {
    const tags: string[] = [];

    if (record.type === 'bloodSugar') {
      tags.push(getBloodSugarPeriodName((record.data as BloodSugarRecord).period));
    }
    if (record.type === 'weight' && (record.data as WeightRecord).bmi) {
      const bmi = (record.data as WeightRecord).bmi!;
      const { level } = getBMILevel(bmi);
      tags.push(`BMI: ${bmi} (${level})`);
    }
    if (record.type === 'bloodPressure' && (record.data as BloodPressureRecord).pulse) {
      tags.push(`脉搏: ${(record.data as BloodPressureRecord).pulse}次/分`);
    }
    if (record.diet) tags.push(`饮食: ${record.diet}`);
    if (record.sleep) tags.push(`睡眠: ${record.sleep}`);

    return tags.length > 0 ? (
      <View className={styles.recordMeta}>
        {tags.map((tag, idx) => (
          <Text key={idx} className={styles.metaTag}>{tag}</Text>
        ))}
      </View>
    ) : null;
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.tabBar}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => {
              setActiveTab(tab.key);
              console.log('[Records] 切换指标:', tab.key);
            }}
          >
            {tab.label}
          </View>
        ))}
      </View>

      <View className={styles.content}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            记录{getRecordTypeName(activeTab)}
          </Text>
          <Button
            className={styles.toggleButton}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '收起表单' : '展开表单'}
          </Button>
        </View>

        {showForm && (
          <View className={styles.recordForm}>
            <Text className={styles.formTitle}>
              录入{getRecordTypeName(activeTab)}数据
            </Text>
            {renderForm()}

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>备注（可选）</Text>
              <Textarea
                className={styles.textareaField}
                value={note}
                onInput={(e) => setNote(e.detail.value)}
                placeholder="输入备注信息..."
                maxlength={200}
              />
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>饮食情况（可选）</Text>
              <Input
                className={styles.inputField}
                value={diet}
                onInput={(e) => setDiet(e.detail.value)}
                placeholder="如：清淡饮食、油腻等"
                style={{ background: '#F1F5F9', borderRadius: '12rpx', padding: '16rpx 24rpx', height: '88rpx' }}
              />
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>睡眠情况（可选）</Text>
              <Input
                className={styles.inputField}
                value={sleep}
                onInput={(e) => setSleep(e.detail.value)}
                placeholder="如：睡眠7小时、失眠等"
                style={{ background: '#F1F5F9', borderRadius: '12rpx', padding: '16rpx 24rpx', height: '88rpx' }}
              />
            </View>

            <Button className={styles.submitButton} onClick={handleSubmit}>
              保存记录
            </Button>
          </View>
        )}

        <View className={styles.chartSection}>
          <View className={styles.filterBar}>
            <Text className={styles.filterTitle}>趋势图表</Text>
            <View className={styles.filterButtons}>
              {(['7d', '30d', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  className={classnames(styles.filterButton, timeRange === range && styles.active)}
                  onClick={() => setTimeRange(range)}
                >
                  {range === '7d' ? '7天' : range === '30d' ? '30天' : '全部'}
                </Button>
              ))}
            </View>
          </View>
          <TrendChart records={filteredRecords} type={activeTab} height={350} />
        </View>

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>历史记录</Text>
          <Text style={{ fontSize: '24rpx', color: '#94A3B8' }}>
            共 {filteredRecords.length} 条
          </Text>
        </View>

        {filteredRecords.length > 0 ? (
          <View className={styles.recordsList}>
            {filteredRecords.map((record) => (
              <View
                key={record.id}
                className={classnames(styles.recordItem, record.isAbnormal && styles.abnormal)}
                onClick={() => {
                  Taro.showModal({
                    title: `${getRecordTypeName(record.type)}详情`,
                    content: `数值: ${getRecordDisplayValue(record)} ${getRecordUnit(record.type)}\n时间: ${formatDateTime(record.recordedAt)}\n记录人: ${record.recordedBy}${record.note ? `\n备注: ${record.note}` : ''}`,
                    showCancel: false,
                  });
                }}
              >
                <View className={styles.recordHeader}>
                  <Text className={styles.recordTime}>
                    {formatDateTime(record.recordedAt)}
                  </Text>
                  <StatusBadge
                    status={record.isAbnormal ? 'danger' : 'success'}
                    text={record.isAbnormal ? '异常' : '正常'}
                    size="sm"
                  />
                </View>
                <View className={styles.recordValueRow}>
                  <Text
                    className={classnames(styles.recordValue, record.isAbnormal && styles.abnormal)}
                  >
                    {getRecordDisplayValue(record)}
                  </Text>
                  <Text className={styles.recordUnit}>
                    {getRecordUnit(record.type)}
                  </Text>
                </View>
                {renderRecordExtra(record)}
                {record.note && (
                  <Text className={styles.recordNote}>备注: {record.note}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📊</Text>
            <Text className={styles.emptyText}>暂无{getRecordTypeName(activeTab)}记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default RecordsPage;
