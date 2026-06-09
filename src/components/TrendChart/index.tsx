import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import type { HealthRecord, HealthRecordType } from '@/types';
import { getRecordTypeName, getRecordUnit } from '@/utils';
import styles from './index.module.scss';

interface TrendChartProps {
  records: HealthRecord[];
  type: HealthRecordType;
  height?: number;
}

interface DataPoint {
  x: number;
  y: number;
  value: number | string;
  label: string;
  isAbnormal: boolean;
}

const typeColors: Record<HealthRecordType, string> = {
  bloodPressure: '#EF4444',
  bloodSugar: '#F97316',
  temperature: '#3B82F6',
  weight: '#22C55E',
};

const TrendChart: React.FC<TrendChartProps> = ({ records, type, height = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [systemInfo, setSystemInfo] = useState<Taro.getSystemInfoSync.Result | null>(null);
  const typeName = getRecordTypeName(type);
  const unit = getRecordUnit(type);
  const color = typeColors[type];

  useEffect(() => {
    const info = Taro.getSystemInfoSync();
    setSystemInfo(info);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !systemInfo || records.length === 0) return;

    const dpr = systemInfo.pixelRatio || 2;
    const canvasWidth = systemInfo.windowWidth - 64;
    const canvasHeight = height;

    const query = Taro.createSelectorQuery();
    query.select('#trendCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;

        const canvas = res[0].node as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        ctx.scale(dpr, dpr);

        drawChart(ctx, canvasWidth, canvasHeight);
      });
  }, [records, type, systemInfo, height]);

  const prepareData = (): DataPoint[] => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    return sorted.map((record, index) => {
      let value: number | string;
      if (type === 'bloodPressure') {
        value = (record.data as { systolic: number }).systolic;
      } else if (type === 'bloodSugar') {
        value = (record.data as { value: number }).value;
      } else if (type === 'temperature') {
        value = (record.data as { value: number }).value;
      } else {
        value = (record.data as { value: number }).value;
      }

      return {
        x: index,
        y: Number(value),
        value,
        label: dayjs(record.recordedAt).format('MM-DD'),
        isAbnormal: record.isAbnormal,
      };
    });
  };

  const drawChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const padding = { top: 40, right: 40, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const data = prepareData();
    if (data.length < 2) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '24rpx sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('数据不足，暂无法显示趋势', width / 2, height / 2);
      return;
    }

    const values = data.map((d) => d.y);
    const minY = Math.min(...values) * 0.9;
    const maxY = Math.max(...values) * 1.1;

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = '20rpx sans-serif';
      ctx.textAlign = 'right';
      const yValue = (maxY - ((maxY - minY) * i) / 4).toFixed(1);
      ctx.fillText(yValue, padding.left - 10, y + 6);
    }

    const xStep = chartWidth / (data.length - 1 || 1);

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}05`);

    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    data.forEach((point, index) => {
      const x = padding.left + index * xStep;
      const y = padding.top + chartHeight * (1 - (point.y - minY) / (maxY - minY || 1));
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(padding.left + (data.length - 1) * xStep, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    data.forEach((point, index) => {
      const x = padding.left + index * xStep;
      const y = padding.top + chartHeight * (1 - (point.y - minY) / (maxY - minY || 1));
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    data.forEach((point, index) => {
      const x = padding.left + index * xStep;
      const y = padding.top + chartHeight * (1 - (point.y - minY) / (maxY - minY || 1));

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = point.isAbnormal ? '#EF4444' : color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (index % Math.ceil(data.length / 6) === 0 || index === data.length - 1) {
        ctx.fillStyle = '#64748B';
        ctx.font = '20rpx sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, x, height - padding.bottom + 24);
      }
    });

    ctx.fillStyle = color;
    ctx.font = '24rpx sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${typeName}趋势 (${unit})`, padding.left, padding.top - 12);
  };

  const getStats = () => {
    if (records.length === 0) return null;

    const values = records.map((r) => {
      if (type === 'bloodPressure') return (r.data as { systolic: number }).systolic;
      return (r.data as { value: number }).value;
    });

    return {
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
      max: Math.max(...values).toFixed(1),
      min: Math.min(...values).toFixed(1),
      count: records.length,
    };
  };

  const stats = getStats();

  return (
    <View className={styles.chartContainer}>
      <View className={styles.statsRow}>
        {stats && (
          <>
            <View className={styles.statItem}>
              <Text className={styles.statLabel}>平均值</Text>
              <Text className={styles.statValue}>{stats.avg}</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statLabel}>最高</Text>
              <Text className={styles.statValue}>{stats.max}</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statLabel}>最低</Text>
              <Text className={styles.statValue}>{stats.min}</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statLabel}>记录数</Text>
              <Text className={styles.statValue}>{stats.count}</Text>
            </View>
          </>
        )}
      </View>
      <Canvas
        id="trendCanvas"
        ref={canvasRef}
        type="2d"
        className={styles.canvas}
        style={{ height: `${height}rpx` }}
      />
    </View>
  );
};

export default TrendChart;
