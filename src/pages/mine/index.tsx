import React from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useHealthStore, useEmergencyContacts } from '@/store/healthStore';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const userProfile = useHealthStore((state) => state.userProfile);
  const healthRecords = useHealthStore((state) => state.healthRecords);
  const medicalReports = useHealthStore((state) => state.medicalReports);
  const careTasks = useHealthStore((state) => state.careTasks);
  const emergencyContacts = useEmergencyContacts();

  useDidShow(() => {
    console.log('[Mine] 页面显示');
  });

  const handleCall = (phone: string, name: string) => {
    console.log('[Mine] 拨打电话:', name, phone);
    Taro.makePhoneCall({
      phoneNumber: phone,
      fail: (err) => console.error('[Mine] 拨号失败:', err),
    });
  };

  const handleEmergencyCall = () => {
    console.log('[Mine] 紧急呼叫 120');
    Taro.makePhoneCall({
      phoneNumber: '120',
      fail: (err) => console.error('[Mine] 紧急呼叫失败:', err),
    });
  };

  const handleMenuClick = (menu: string) => {
    console.log('[Mine] 点击菜单:', menu);
    switch (menu) {
      case 'medication':
        Taro.navigateTo({ url: '/pages/medication/index' });
        break;
      case 'followup':
        Taro.navigateTo({ url: '/pages/followup/index' });
        break;
      case 'abnormal':
        Taro.navigateTo({ url: '/pages/abnormal/index' });
        break;
      case 'archives':
        Taro.switchTab({ url: '/pages/archives/index' });
        break;
      case 'privacy':
        Taro.switchTab({ url: '/pages/archives/index' });
        break;
      default:
        Taro.showToast({ title: menu, icon: 'none' });
    }
  };

  const menuItems = [
    { name: '用药提醒', icon: '药', color: '#8B5CF6', desc: '管理用药计划和提醒', key: 'medication' },
    { name: '复诊计划', icon: '诊', color: '#06B6D4', desc: '复诊预约和提醒', key: 'followup' },
    { name: '异常上报', icon: '警', color: '#EF4444', desc: '异常情况记录和上报', key: 'abnormal' },
    { name: '健康档案', icon: '档', color: '#22C55E', desc: '查看和导出健康档案', key: 'archives' },
    { name: '隐私设置', icon: '私', color: '#6366F1', desc: '隐私授权和数据安全', key: 'privacy' },
    { name: '使用帮助', icon: '帮', color: '#F59E0B', desc: '常见问题和使用指南', key: 'help' },
    { name: '关于我们', icon: '关', color: '#64748B', desc: '版本信息和服务条款', key: 'about' },
  ];

  const completedTasks = careTasks.filter((t) => t.status === 'completed').length;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.profileRow}>
          <View className={styles.avatar}>
            {userProfile.name?.charAt(0) || '用'}
          </View>
          <View className={styles.profileInfo}>
            <Text className={styles.name}>{userProfile.name}</Text>
            <Text className={styles.phone}>{userProfile.phone}</Text>
          </View>
          <Button
            className={styles.editButton}
            onClick={() => Taro.showToast({ title: '编辑资料', icon: 'none' })}
          >
            编辑
          </Button>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsCard}>
          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{healthRecords.length}</Text>
              <Text className={styles.statLabel}>健康记录</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{medicalReports.length}</Text>
              <Text className={styles.statLabel}>检查报告</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{completedTasks}</Text>
              <Text className={styles.statLabel}>完成任务</Text>
            </View>
          </View>
        </View>

        <View className={styles.emergencyCard}>
          <View className={styles.emergencyHeader}>
            <View className={styles.emergencyIcon}>!</View>
            <Text className={styles.emergencyTitle}>紧急联系人</Text>
          </View>
          <View className={styles.emergencyList}>
            {emergencyContacts.slice(0, 3).map((contact) => (
              <View key={contact.id} className={styles.emergencyItem}>
                <View>
                  <Text className={styles.emergencyName}>
                    {contact.name}（{contact.relationship}）
                  </Text>
                  <Text className={styles.emergencyPhone}>{contact.phone}</Text>
                </View>
                <Button
                  className={styles.emergencyCall}
                  onClick={() => handleCall(contact.phone, contact.name)}
                >
                  呼叫
                </Button>
              </View>
            ))}
          </View>
          <Button className={styles.sosButton} onClick={handleEmergencyCall}>
            🚨 一键呼叫 120
          </Button>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>功能菜单</Text>
          <View className={styles.menuList}>
            {menuItems.map((item) => (
              <View
                key={item.key}
                className={styles.menuItem}
                onClick={() => handleMenuClick(item.key)}
              >
                <View
                  className={styles.menuIcon}
                  style={{ backgroundColor: item.color }}
                >
                  {item.icon}
                </View>
                <View className={styles.menuContent}>
                  <Text className={styles.menuName}>{item.name}</Text>
                  <Text className={styles.menuDesc}>{item.desc}</Text>
                </View>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>

        <Text className={styles.version}>家庭健康管理 v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default MinePage;
