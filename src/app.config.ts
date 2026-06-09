export default defineAppConfig({
  pages: [
    'pages/overview/index',
    'pages/records/index',
    'pages/archives/index',
    'pages/family/index',
    'pages/mine/index',
    'pages/medication/index',
    'pages/followup/index',
    'pages/abnormal/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#22C55E',
    navigationBarTitleText: '家庭健康管理',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F8FAFC'
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#22C55E',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/overview/index',
        text: '今日概览'
      },
      {
        pagePath: 'pages/records/index',
        text: '指标记录'
      },
      {
        pagePath: 'pages/archives/index',
        text: '健康档案'
      },
      {
        pagePath: 'pages/family/index',
        text: '家人协作'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
