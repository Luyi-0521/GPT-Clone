# ChatGPT Clone 项目文档

## 项目概述

这是一个功能完整的ChatGPT克隆应用，采用双列布局设计，左侧为历史会话列表区域，右侧为主要聊天交互界面。应用集成了AI Builders API，支持与多种AI模型进行对话，提供流畅的用户体验。

## 核心功能

### 1. 双列布局设计
- 左侧：历史会话列表，显示所有过往对话记录
- 右侧：主要聊天交互界面，包含消息输入框、发送按钮、消息显示区域及模型选择功能

### 2. 会话管理
- 创建新会话
- 选择历史会话
- 删除会话
- 会话标题智能生成（基于对话内容）

### 3. 消息交互
- 消息发送与接收
- 消息气泡样式，区分用户消息与AI回复
- 加载状态指示
- 多行文本输入支持
- Shift+Enter快捷键换行，Enter键发送消息
- 文本输入框高度自适应

### 4. 模型配置
- 支持多种AI模型：Grok-4-fast、DeepSeek、Supermind Agent、Kimi K2.5、Gemini 2.5 Pro、Gemini 3 Flash
- 模型切换功能

### 5. 历史记录
- 本地存储用户对话历史
- 页面刷新后数据不丢失

## 技术栈

- **前端框架**：Next.js 16.1.6
- **开发语言**：TypeScript 5.9.3
- **UI库**：React 19.2.4
- **CSS框架**：Tailwind CSS 3.4.1
- **API集成**：AI Builders API
- **本地存储**：localStorage
- **构建工具**：Next.js内置构建系统

## 环境要求

- Node.js 16.0.0 或更高版本
- npm 7.0.0 或更高版本

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd GPT Clone
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件，并添加AI Builders API密钥：

```env
# AI Builders API Token
NEXT_PUBLIC_AI_BUILDER_TOKEN=your-api-token-here
```

### 4. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 5. 构建生产版本

```bash
npm run build
```

### 6. 启动生产服务器

```bash
npm start
```

## 使用指南

### 创建新会话
1. 点击左侧的"新会话"按钮
2. 输入您的问题或指令
3. 按Enter键或点击"发送"按钮

### 选择历史会话
- 点击左侧会话列表中的任意会话，右侧将显示该会话的历史消息

### 删除会话
- 点击会话右侧的删除图标，确认后会话将被删除

### 切换AI模型
- 在右侧聊天界面顶部的模型选择下拉菜单中选择不同的AI模型

### 多行文本输入
- 正常输入文本，文本框会自动调整高度
- 按住Shift键并按Enter键进行换行
- 直接按Enter键发送消息

## 配置说明

### API配置

应用使用AI Builders API进行AI对话。您需要在 `.env.local` 文件中配置API密钥：

```env
# AI Builders API Token
NEXT_PUBLIC_AI_BUILDER_TOKEN=your-api-token-here
```

### 模型配置

应用支持以下AI模型：
- `grok-4-fast`（默认）
- `deepseek`
- `supermind-agent-v1`
- `kimi-k2.5`
- `gemini-2.5-pro`
- `gemini-3-flash-preview`

### 本地存储

应用使用localStorage存储会话历史，数据结构如下：

```typescript
interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}
```

## 贡献规范

### 代码风格
- 遵循TypeScript和React的最佳实践
- 使用ESLint进行代码检查
- 保持代码风格一致

### 提交规范
- 提交信息应清晰描述变更内容
- 使用语义化提交信息（如：feat、fix、chore、docs等）

### 开发流程
1. Fork项目仓库
2. 创建特性分支
3. 提交代码变更
4. 发起Pull Request

## 许可证

本项目采用 MIT 许可证。详见 `LICENSE` 文件。

## 联系方式

如果您有任何问题或建议，请通过以下方式联系我们：

- 项目地址：<repository-url>
- 问题反馈：<issues-url>

---

**感谢使用 ChatGPT Clone！** 我们希望这个应用能够为您提供优质的AI对话体验。