# Hour Tracker 微信小程序

基于 Taro + React + 微信云开发的 10000 小时爱好追踪小程序。

## 功能特性

- 📅 日历打卡模式 - 记录每日练习时间
- 📷 图片记录模式 - 照片日记形式记录成果
- 👤 用户登录 - 微信一键登录，数据云端同步
- ☁️ 云端存储 - 所有数据存储在微信云开发，多设备同步
- 🎨 多项目管理 - 支持同时追踪多个爱好
- 🌙 深色模式 - 自动跟随系统主题

## 技术栈

- **Taro 4.x** - 跨平台开发框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS 4.x** - 样式框架
- **Redux Toolkit** - 状态管理
- **微信云开发** - 后端服务

## 项目结构

```
miniprogram/
├── cloudfunctions/          # 云函数
│   └── login/               # 登录云函数
├── src/
│   ├── components/          # 组件
│   │   ├── CalendarView.tsx # 日历视图
│   │   ├── GalleryView.tsx  # 相册视图
│   │   ├── ProgressView.tsx # 进度视图
│   │   ├── Navigation.tsx   # 底部导航
│   │   └── ProjectModal.tsx # 项目编辑弹窗
│   ├── pages/               # 页面
│   │   └── index/           # 主页
│   ├── services/            # 服务
│   │   └── cloudService.ts  # 云开发服务
│   ├── store/               # Redux Store
│   │   └── slices/          # Redux Slices
│   ├── types/               # 类型定义
│   ├── utils/               # 工具函数
│   ├── app.tsx              # 应用入口
│   └── app.config.ts        # 应用配置
└── project.config.json      # 小程序项目配置
```

## 云开发配置

### 1. 开通云开发

1. 打开微信开发者工具
2. 点击 "云开发" 按钮
3. 开通云开发服务，创建环境

### 2. 创建数据库集合

在云开发控制台创建以下集合：

#### users 集合
存储用户信息
```json
{
  "_id": "自动生成",
  "openid": "用户openid",
  "nickName": "用户昵称",
  "avatarUrl": "头像URL",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

#### projects 集合
存储项目数据
```json
{
  "_id": "自动生成",
  "id": "本地ID",
  "userId": "用户openid",
  "name": "项目名称",
  "description": "项目描述",
  "mode": "calendar|gallery",
  "colorBase": "#3b82f6",
  "goalHours": 10000,
  "hoursPerCheckIn": 1,
  "checkInLevels": [1, 2, 3, 4, 5],
  "checkInShape": "square|circle",
  "logs": { "2024-01-01": 2 },
  "photos": ["cloud://xxx"],
  "photoAspectRatio": "1:1",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

### 3. 设置数据库权限

为 `users` 和 `projects` 集合设置以下权限规则：

```json
{
  "read": "auth.openid == doc.openid || auth.openid == doc.userId",
  "write": "auth.openid == doc.openid || auth.openid == doc.userId"
}
```

### 4. 部署云函数

在微信开发者工具中：
1. 右键点击 `cloudfunctions/login` 目录
2. 选择 "上传并部署：云端安装依赖"

### 5. 配置云存储

云存储无需特殊配置，图片会自动上传到 `photos/` 目录下。

## 开发指南

### 安装依赖

```bash
cd miniprogram
npm install
```

### 开发模式

```bash
npm run dev:weapp
```

然后在微信开发者工具中打开 `dist/weapp` 目录。

### 生产构建

```bash
npm run build:weapp
```

## 环境要求

- Node.js >= 18
- 微信开发者工具
- 已开通微信云开发

## AppID

```
wx3e68ca20bb296674
```

## License

MIT
