# AGENTS.md - Clash Override 项目指南

## 项目概述

Clash/Mihomo 代理配置覆写脚本，用于 Clash Verge、Clash Meta for Android 等客户端。

**技术栈**: 纯 JavaScript (ES Modules)，无需外部依赖

## 文件说明

| 文件 | 用途 |
|------|------|
| `clash.js` | Geodata + Loyalsoldier 混合 |
| `clash-latest.js` | 最新稳定版本（推荐） |
| `clash-example.js` | 示例代码 |

## 核心规范

### 命名约定

| 元素     | 规范       | 示例 |
|----------|------------|------|
| 函数/变量 | camelCase | `allProxies`、`jpProxies` |
| 策略组名 | 中文       | `自动选择`、`日本节点` |
| 注释     | 中文优先   | - |

### ⚠️ 正则匹配注意事项

**不要使用 `\b`（单词边界）** 匹配中文节点：

```javascript
// ✅ 正确
/(日本|JP|Japan|Tokyo|Osaka)/i

// ❌ 错误 - \b 对中文字符不起作用
/\b(日本|JP|Japan|Tokyo|Osaka)\b/i
```

### 对象属性访问

Clash 配置键含连字符时必须用方括号：

```javascript
config['geodata-mode'] = true
config['proxy-groups'] = [...]
```

## 代码结构顺序

1. 主函数定义 → 接收 config
2. 节点筛选 → 从 config.proxies 提取
3. 策略组定义 → config['proxy-groups']
4. 规则配置 → config.rules
5. 返回 config