# 前端 HTML 开发规则

## 项目概述

这是一个纯前端的 AI 工具箱项目，使用原生 HTML、CSS 和 JavaScript 开发，无需构建工具。

## 技术栈

- HTML5
- JavaScript (ES6+)
- Tailwind CSS (通过 CDN 引入)
- Font Awesome 图标库 (通过 CDN 引入)

## 目录结构规范

```
项目根目录/
├── index.html          # 入口文件/首页
├── *.html              # 其他页面
├── main.js             # 公共 JavaScript 逻辑
├── api/                # API 代理函数
├── Doc/                # 文档
└── styles/             # 样式文件(如有)
```

## HTML 编写规范

### 1. 文档结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面标题</title>
    <!-- CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="...">
    <!-- 字体 -->
    <link href="..." rel="stylesheet">
    <!-- 内联样式/配置 -->
    <script>...</script>
    <style>...</style>
</head>
<body>
    <!-- 内容 -->
    <script>...</script>
</body>
</html>
```

### 2. 标签使用规则

- 使用语义化标签：`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>`
- 按钮使用 `<button>`，链接使用 `<a>`
- 列表使用 `<ul>`/`<ol>`/`<li>`
- 图片必须包含 `alt` 属性
- 输入框必须关联 `<label>`

### 3. class 命名规范

- 使用小写字母和连字符：`card-hover`, `btn-primary`
- 采用 BEM 命名法（可选）：`block__element--modifier`
- 语义化命名：`nav-link`, `hero-section`, `tool-card`

## CSS 编写规范

### 1. Tailwind CSS 使用

- 优先使用 Tailwind CSS 类
- 自定义样式放在 `<style>` 标签中
- 使用 Tailwind 配置自定义主题

### 2. 响应式设计

- 使用 Tailwind 的响应式前缀：`md:`, `lg:`, `xl:`
- 移动优先原则
- 标准断点：sm(640px), md(768px), lg(1024px), xl(1280px)

### 3. 动画效果

- 使用 CSS transition 和 animation
- 推荐使用 cubic-bezier 缓动函数
- 动画时长：0.2s-0.4s 为宜

## JavaScript 编写规范

### 1. ES6+ 语法

- 使用 `const` 和 `let`，避免 `var`
- 使用箭头函数
- 使用模板字符串
- 使用解构赋值
- 使用 async/await 处理异步

### 2. DOM 操作

- 优先使用 `querySelector` 和 `querySelectorAll`
- 事件委托处理多个元素
- 使用 `addEventListener` 而非内联事件

### 3. 本地存储

- 使用 `localStorage` 保存用户配置
- 存储键命名规范：`playai_` 前缀

### 4. API 调用

- 封装统一的 API 请求方法
- 处理错误和异常
- 显示加载状态

## 页面设计规范

### 1. 风格选择

项目统一使用 **Apple/黑白商务风格**：

**主要风格特点**
- 背景：白色/浅灰色渐变 (#ffffff → #f5f5f7)
- 文字：深灰色 (#1d1d1f)
- 按钮：圆角胶囊形状 (rounded-full)
- 卡片：圆角 + 柔和阴影 + 悬停上移效果
- 导航：毛玻璃效果 (backdrop-filter: blur)
- 字体：Inter
- 主题色：apple-blue (#0071e3), apple-dark (#1d1d1f), apple-gray (#f5f5f7)
- 动画：fade-in, fade-in-up
- 过渡：cubic-bezier(0.25, 0.46, 0.45, 0.94)

### 2. 组件规范

**卡片组件**
- 圆角：`rounded-2xl` 或 `rounded-3xl`
- 悬停效果：`transform: translateY(-8px)` + 阴影
- 过渡动画：0.3s-0.4s

**按钮**
- 主要按钮：实心背景 + 白色文字
- 次要按钮：白色背景 + 边框
- 悬停效果：`transform: scale(1.02)`

### 3. 响应式布局

- 使用 `max-w-6xl mx-auto` 限制最大宽度
- 网格布局：`grid md:grid-cols-2 lg:grid-cols-3`
- 间距：使用 Tailwind 的 gap 系统

## 性能优化

### 1. 加载优化

- CDN 资源使用稳定版本
- 字体使用 `font-display: swap`
- CSS 放在 head，JS 放在 body 末尾

### 2. 代码优化

- 减少 DOM 操作次数
- 使用事件委托
- 懒加载非关键资源

## 可访问性 (a11y)

- 图片必须有 `alt` 属性
- 按钮和链接要有明确的焦点状态
- 使用语义化 HTML
- 支持键盘导航
- 颜色对比度符合 WCAG 标准

## 文件命名规范

- HTML 文件：小写字母，连字符分隔
- JavaScript 文件：小写字母，连字符分隔
- CSS 文件：小写字母，连字符分隔

## 代码格式

- 缩进：4 空格（或 2 空格，根据项目风格）
- 属性值使用双引号
- 保持代码简洁，避免重复

## 注意事项

1. **所有回复使用中文**
2. 修改代码前先阅读相关文件
3. 保持与现有代码风格一致
4. 避免引入不必要的依赖
5. 确保响应式设计在各种设备上正常工作
