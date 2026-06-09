import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { HealthRecord, HealthRecordType } from '@/types';
import {
  getRecordTypeName,
  getRecordUnit,
  getRecordDisplayValue,
  formatDateTime,
  getBloodSugarPeriodName,
} from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import styles from './index.module.scss';

interface HealthCardProps {
  record: HealthRecord;
  showDetails?: boolean;
  onClick?: () => void;
}

const typeColors: Record<HealthRecordType, string> = {
  bloodPressure: '#EF4444',
  bloodSugar: '#F97316',
  temperature: '#3B82F6',
  weight: '#22C55E',
};

const HealthCard: React.FC<HealthCardProps> = ({ record, showDetails = false, onClick }) => {
  const typeColor = typeColors[record.type];
  const displayValue = getRecordDisplayValue(record);
  const unit = getRecordUnit(record.type);
  const typeName = getRecordTypeName(record.type);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.showToast({
        title: `${typeName}: ${displayValue} ${unit}`,
        icon: 'none',
      });
    }
  };

  const renderExtraInfo = () => {
    if (record.type === 'bloodSugar') {
      const data = record.data as { period: string };
      return (
        <Text className={styles.extra}>
          {getBloodSugarPeriodName(data.period)}
        </Text>
      );
    }
    if (record.type === 'weight' && (record.data as { bmi?: number }).bmi) {
      const bmi = (record.data as { bmi?: number }).bmi;
      return <Text className={styles.extra}>BMI: {bmi}</Text>;
    }
    if (record.type === 'bloodPressure' && (record.data as { pulse?: number }).pulse) {
      const pulse = (record.data as { pulse?: number }).pulse;
      return <Text className={styles.extra}>脉搏: {pulse}次/分</Text>;
    }
    return null;
  };

  return (
    <View
      className={classnames(styles.card, record.isAbnormal && styles.abnormal)}
      onClick={handleClick}
    >
      <View className={styles.header}>
        <View className={styles.typeIndicator} style={{ backgroundColor: typeColor }} />
        <Text className={styles.typeName}>{typeName}</Text>
        <View className={styles.spacer} />
        <StatusBadge
          status={record.isAbnormal ? 'danger' : 'success'}
          text={record.isAbnormal ? '异常' : '正常'}
          size="sm"
        />
      </View>

      <View className={styles.valueRow}>
        <Text
          className={classnames(styles.value, record.isAbnormal && styles.valueAbnormal)}
        >
          {displayValue}
        </Text>
        <Text className={styles.unit}>{unit}</Text>
      </View>

      {renderExtraInfo()}

      {showDetails && (
        <View className={styles.details}>
          {record.note && <Text className={styles.note}>备注: {record.note}</Text>}
          {record.diet && <Text className={styles.note}>饮食: {record.diet}</Text>}
          {record.sleep && <Text className={styles.note}>睡眠: {record.sleep}</Text>}
          <Text className={styles.time}>
            记录于 {formatDateTime(record.recordedAt)}
          </Text>
          <Text className={styles.recorder}>记录人: {record.recordedBy}</Text>
        </View>
      )}
    </View>
  );
};

export default HealthCard;
