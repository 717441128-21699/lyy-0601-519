import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Switch, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useHealthStore } from '@/store/healthStore';
import { getRecordTypeName } from '@/utils';
import type { HealthRecordType } from '@/types';
import styles from './index.module.scss';

const ArchivesPage: React.FC = () => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportResult, setShowExportResult] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const [exportStartDate, setExportStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [exportEndDate, setExportEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedTypes, setSelectedTypes] = useState<HealthRecordType[]>(['bloodPressure', 'bloodSugar', 'temperature', 'weight']);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [includeFollowUps, setIncludeFollowUps] = useState(true);

  const userProfile = useHealthStore((state) => state.userProfile);
  const medicalReports = useHealthStore((state) => state.medicalReports);
  const healthRecords = useHealthStore((state) => state.healthRecords);
  const followUpPlans = useHealthStore((state) => state.followUpPlans);
  const privacySettings = useHealthStore((state) => state.privacySettings);
  const updatePrivacySettings = useHealthStore((state) => state.updatePrivacySettings);
  const exportArchive = useHealthStore((state) => state.exportArchive);
  const addMedicalReport = useHealthStore((state) => state.addMedicalReport);

  useDidShow(() => {
    console.log('[Archives] 页面显示');
  });

  const age = userProfile.birthDate
    ? dayjs().diff(dayjs(userProfile.birthDate), 'year')
    : '-';

  const completedFollowUps = followUpPlans.filter((f) => f.status === 'completed').length;

  const handleViewReport = (report: typeof medicalReports[0]) => {
    console.log('[Archives] 查看报告:', report.title);
    Taro.showModal({
      title: report.title,
      content: `医院: ${report.hospital}\n日期: ${report.date}\n类型: ${report.type}\n${report.description || ''}`,
      showCancel: false,
    });
  };

  const handleUploadReport = () => {
    console.log('[Archives] 上传报告');
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const imageUrl = res.tempFilePaths[0];
        console.log('[Archives] 选择图片:', imageUrl);
        
        addMedicalReport({
          title: '检查报告',
          type: '影像检查',
          date: dayjs().format('YYYY-MM-DD'),
          hospital: '手动上传',
          description: '用户上传的检查报告',
          imageUrl,
          notes: '',
        });
        
        Taro.showToast({ title: '上传成功', icon: 'success' });
        console.log('[Archives] 报告已保存到列表');
      },
      fail: (err) => console.error('[Archives] 选择图片失败:', err),
    });
  };

  const formatArchiveToText = (archive: Record<string, unknown>): string => {
    const lines: string[] = [];
    lines.push('========================================');
    lines.push('           健康档案导出报告');
    lines.push('========================================');
    lines.push(`导出时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
    lines.push(`时间范围: ${exportStartDate} 至 ${exportEndDate}`);
    lines.push('');

    const profile = archive.userProfile as Record<string, unknown>;
    lines.push('【个人信息】');
    lines.push(`  姓名: ${profile.name}`);
    lines.push(`  性别: ${profile.gender === 'male' ? '男' : '女'}`);
    lines.push(`  出生日期: ${profile.birthDate}`);
    lines.push(`  联系电话: ${profile.phone}`);
    lines.push(`  身高/体重: ${profile.height}cm / ${profile.weight}kg`);
    lines.push(`  血型: ${profile.bloodType}型`);
    lines.push(`  慢性病: ${(profile.chronicDiseases as string[])?.join('、') || '无'}`);
    lines.push(`  过敏史: ${(profile.allergies as string[])?.join('、') || '无'}`);
    lines.push('');

    const records = archive.healthRecords as Record<string, unknown>[];
    if (records && records.length > 0) {
      lines.push('【健康记录】');
      records.forEach((record, idx) => {
        const typeName = getRecordTypeName(record.type as HealthRecordType);
        const date = dayjs(record.recordedAt as string).format('YYYY-MM-DD HH:mm');
        const data = record.data as Record<string, unknown>;
        let valueStr = '';
        
        if (record.type === 'bloodPressure') {
          valueStr = `${data.systolic}/${data.diastolic} mmHg`;
          if (data.pulse) valueStr += `, 脉搏: ${data.pulse} 次/分`;
        } else if (record.type === 'bloodSugar') {
          valueStr = `${data.value} mmol/L (${data.period === 'fasting' ? '空腹' : '餐后'})`;
        } else if (record.type === 'temperature') {
          valueStr = `${data.value} °C`;
        } else if (record.type === 'weight') {
          valueStr = `${data.value} kg`;
          if (data.bmi) valueStr += `, BMI: ${data.bmi}`;
        }
        
        lines.push(`  ${idx + 1}. [${date}] ${typeName}: ${valueStr}`);
        if (record.isAbnormal) lines.push(`     ⚠️ 异常值`);
        if (record.note) lines.push(`     备注: ${record.note}`);
      });
      lines.push('');
    }

    if (includeMedications && archive.medicationRecords) {
      const meds = archive.medicationRecords as Record<string, unknown>[];
      if (meds.length > 0) {
        lines.push('【用药记录】');
        meds.forEach((med, idx) => {
          const date = dayjs(med.takenAt as string).format('YYYY-MM-DD HH:mm');
          const statusText = med.status === 'taken' ? '已服用' : med.status === 'missed' ? '漏服' : '待服用';
          lines.push(`  ${idx + 1}. [${date}] ${med.name} - ${statusText}`);
        });
        lines.push('');
      }
    }

    if (includeFollowUps && archive.followUpPlans) {
      const plans = archive.followUpPlans as Record<string, unknown>[];
      if (plans.length > 0) {
        lines.push('【复诊计划】');
        plans.forEach((plan, idx) => {
          const statusText = plan.status === 'completed' ? '已完成' : '待复诊';
          lines.push(`  ${idx + 1}. [${plan.date} ${plan.time}] ${plan.title} - ${statusText}`);
          lines.push(`     医院: ${plan.hospital}, 科室: ${plan.department}`);
        });
        lines.push('');
      }
    }

    lines.push('========================================');
    lines.push('        报告结束');
    lines.push('========================================');

    return lines.join('\n');
  };

  const handleExport = () => {
    console.log('[Archives] 导出档案');
    if (selectedTypes.length === 0) {
      Taro.showToast({ title: '请至少选择一种数据类型', icon: 'none' });
      return;
    }

    const archive = exportArchive(exportStartDate, exportEndDate, {
      recordTypes: selectedTypes,
      includeMedication: includeMedications,
      includeFollowUp: includeFollowUps,
    });

    const textContent = formatArchiveToText(archive as Record<string, unknown>);
    setExportContent(textContent);
    setShowExportModal(false);
    setShowExportResult(true);

    console.log('[Archives] 导出内容已生成');
  };

  const handleCopyContent = () => {
    Taro.setClipboardData({
      data: exportContent,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
      },
    });
  };

  const toggleType = (type: HealthRecordType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const actions = [
    { name: '导出档案', color: '#22C55E', icon: '导', onClick: () => setShowExportModal(true) },
    { name: '上传报告', color: '#3B82F6', icon: '传', onClick: handleUploadReport },
    { name: '检查报告', color: '#06B6D4', icon: '报', onClick: () => Taro.showToast({ title: '检查报告列表', icon: 'none' }) },
    { name: '数据统计', color: '#8B5CF6', icon: '统', onClick: () => Taro.showToast({ title: '数据统计', icon: 'none' }) },
  ];

  const typeOptions: { key: HealthRecordType; label: string }[] = [
    { key: 'bloodPressure', label: '血压' },
    { key: 'bloodSugar', label: '血糖' },
    { key: 'temperature', label: '体温' },
    { key: 'weight', label: '体重' },
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.content}>
        <View className={styles.profileCard}>
          <View className={styles.profileHeader}>
            <View className={styles.avatar}>
              {userProfile.name?.charAt(0) || '用'}
            </View>
            <View className={styles.profileInfo}>
              <Text className={styles.profileName}>{userProfile.name}</Text>
              <Text className={styles.profileDesc}>
                {userProfile.gender === 'male' ? '男' : '女'} · {age}岁 · {userProfile.bloodType || '-'}型血
              </Text>
            </View>
          </View>
          <View className={styles.profileStats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{healthRecords.length}</Text>
              <Text className={styles.statLabel}>健康记录</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{medicalReports.length}</Text>
              <Text className={styles.statLabel}>检查报告</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{completedFollowUps}</Text>
              <Text className={styles.statLabel}>已完成复诊</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>基本信息</Text>
          </View>
          <View className={styles.infoGrid}>
            <View className={styles.infoCard}>
              <Text className={styles.infoLabel}>出生日期</Text>
              <Text className={styles.infoValue}>{userProfile.birthDate || '-'}</Text>
            </View>
            <View className={styles.infoCard}>
              <Text className={styles.infoLabel}>联系电话</Text>
              <Text className={styles.infoValue}>{userProfile.phone}</Text>
            </View>
            <View className={styles.infoCard}>
              <Text className={styles.infoLabel}>身高/体重</Text>
              <Text className={styles.infoValue}>
                {userProfile.height || '-'}cm / {userProfile.weight || '-'}kg
              </Text>
            </View>
            <View className={styles.infoCard}>
              <Text className={styles.infoLabel}>血型</Text>
              <Text className={styles.infoValue}>{userProfile.bloodType || '-'}</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>健康状况</Text>
          </View>
          <View className={styles.infoCard} style={{ marginBottom: 0 }}>
            <Text className={styles.infoLabel}>慢性病</Text>
            {userProfile.chronicDiseases && userProfile.chronicDiseases.length > 0 ? (
              <View className={styles.tagList}>
                {userProfile.chronicDiseases.map((disease, idx) => (
                  <Text key={idx} className={styles.tag}>{disease}</Text>
                ))}
              </View>
            ) : (
              <Text className={styles.infoValue}>无</Text>
            )}
            <Text className={styles.infoLabel} style={{ marginTop: '24rpx' }}>过敏史</Text>
            {userProfile.allergies && userProfile.allergies.length > 0 ? (
              <View className={styles.tagList}>
                {userProfile.allergies.map((allergy, idx) => (
                  <Text key={idx} className={styles.tag} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>{allergy}</Text>
                ))}
              </View>
            ) : (
              <Text className={styles.infoValue}>无</Text>
            )}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>快捷操作</Text>
          </View>
          <View className={styles.actionGrid}>
            {actions.map((action) => (
              <View key={action.name} className={styles.actionCard} onClick={action.onClick}>
                <View className={styles.actionIcon} style={{ backgroundColor: action.color }}>
                  {action.icon}
                </View>
                <Text className={styles.actionName}>{action.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>最近检查报告</Text>
            <Text className={styles.sectionAction} onClick={handleUploadReport}>上传</Text>
          </View>
          <View className={styles.reportList}>
            {medicalReports.length > 0 ? (
              medicalReports.slice(0, 5).map((report) => (
                <View key={report.id} className={styles.reportItem} onClick={() => handleViewReport(report)}>
                  <View className={styles.reportIcon}>📄</View>
                  <View className={styles.reportInfo}>
                    <Text className={styles.reportTitle}>{report.title}</Text>
                    <Text className={styles.reportMeta}>
                      {report.hospital} · {report.date}
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

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>隐私设置</Text>
          </View>
          <View className={styles.privacySection}>
            <View className={styles.privacyItem}>
              <View className={styles.privacyInfo}>
                <Text className={styles.privacyTitle}>允许家人查看</Text>
                <Text className={styles.privacyDesc}>家人可以查看您的健康数据</Text>
              </View>
              <Switch
                checked={privacySettings.allowFamilyView}
                onChange={(e) => updatePrivacySettings({ allowFamilyView: e.detail.value })}
                color="#22C55E"
              />
            </View>
            <View className={styles.privacyItem}>
              <View className={styles.privacyInfo}>
                <Text className={styles.privacyTitle}>允许家人编辑</Text>
                <Text className={styles.privacyDesc}>家人可以为您记录健康数据</Text>
              </View>
              <Switch
                checked={privacySettings.allowFamilyEdit}
                onChange={(e) => updatePrivacySettings({ allowFamilyEdit: e.detail.value })}
                color="#22C55E"
              />
            </View>
            <View className={styles.privacyItem}>
              <View className={styles.privacyInfo}>
                <Text className={styles.privacyTitle}>数据加密</Text>
                <Text className={styles.privacyDesc}>健康数据端到端加密存储</Text>
              </View>
              <Switch
                checked={privacySettings.dataEncrypted}
                onChange={(e) => updatePrivacySettings({ dataEncrypted: e.detail.value })}
                color="#22C55E"
              />
            </View>
            <View className={styles.privacyItem}>
              <View className={styles.privacyInfo}>
                <Text className={styles.privacyTitle}>自动备份</Text>
                <Text className={styles.privacyDesc}>自动备份健康数据到云端</Text>
              </View>
              <Switch
                checked={privacySettings.autoBackup}
                onChange={(e) => updatePrivacySettings({ autoBackup: e.detail.value })}
                color="#22C55E"
              />
            </View>
          </View>
        </View>
      </View>

      {showExportModal && (
        <View className={styles.exportModal} onClick={() => setShowExportModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>导出健康档案</Text>

            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>开始日期</Text>
              <Input
                className={styles.modalInput}
                type="number"
                value={exportStartDate}
                onInput={(e) => setExportStartDate(e.detail.value)}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>结束日期</Text>
              <Input
                className={styles.modalInput}
                type="number"
                value={exportEndDate}
                onInput={(e) => setExportEndDate(e.detail.value)}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>导出数据类型</Text>
              <View className={styles.checkboxGroup}>
                {typeOptions.map((type) => (
                  <View
                    key={type.key}
                    className={classnames(styles.checkboxItem, selectedTypes.includes(type.key) && styles.active)}
                    onClick={() => toggleType(type.key)}
                  >
                    {type.label}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>其他数据</Text>
              <View className={styles.checkboxGroup}>
                <View
                  className={classnames(styles.checkboxItem, includeMedications && styles.active)}
                  onClick={() => setIncludeMedications(!includeMedications)}
                >
                  用药记录
                </View>
                <View
                  className={classnames(styles.checkboxItem, includeFollowUps && styles.active)}
                  onClick={() => setIncludeFollowUps(!includeFollowUps)}
                >
                  复诊计划
                </View>
              </View>
            </View>

            <View className={styles.modalButtons}>
              <Button
                className={classnames(styles.modalButton, styles.secondary)}
                onClick={() => setShowExportModal(false)}
              >
                取消
              </Button>
              <Button
                className={classnames(styles.modalButton, styles.primary)}
                onClick={handleExport}
              >
                确认导出
              </Button>
            </View>
          </View>
        </View>
      )}

      {showExportResult && (
        <View className={styles.exportModal} onClick={() => setShowExportResult(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>导出成功</Text>
              <Text className={styles.modalClose} onClick={() => setShowExportResult(false)}>×</Text>
            </View>

            <Text className={styles.exportSubtitle}>以下内容可复制保存</Text>

            <ScrollView className={styles.exportContent} scrollY>
              <Textarea
                className={styles.exportTextarea}
                value={exportContent}
                disabled
                autoHeight
              />
            </ScrollView>

            <View className={styles.modalButtons}>
              <Button
                className={classnames(styles.modalButton, styles.secondary)}
                onClick={() => setShowExportResult(false)}
              >
                关闭
              </Button>
              <Button
                className={classnames(styles.modalButton, styles.primary)}
                onClick={handleCopyContent}
              >
                复制全部内容
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ArchivesPage;
