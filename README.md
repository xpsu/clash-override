# clash-override

Clash/Mihomo 代理配置覆写脚本集合，支持多种规则源和平台。

## 功能特性

- **多规则源支持**：Geodata、Loyalsoldier 混合、远程规则集
- **多平台适配**：桌面端 (Clash Verge Rev)、移动端 (FlClash / FlClashX)
- **智能节点筛选**：中文关键词 / 正则匹配，兼容中英文、城市名与 emoji 旗标命名
- **地区分流**：香港 / 日本 / 新加坡 / 美国 / 台湾独立策略组
- **AI 分流**：Gemini / AI 服务独立策略组
- **移动端优化**：低内存 geodata 加载、懒测速、Sniffer 嗅探

## 文件说明

| 文件 | 用途 | 适用平台 |
|------|------|----------|
| `clash.js` | 主脚本，Geodata + Loyalsoldier 混合 | 桌面端 |
| `clash-latest.js` | 最新稳定版本（推荐用于覆写） | 桌面端 |
| `clash-mobile.js` | 移动端优化版本（低内存、省电、Sniffer） | 移动端 |
| `clash-ruleset.js` | 基于 Loyalsoldier 远程规则集的版本 | 桌面端 |
| `clash-default.js` | 缺省脚本（直通，原样返回配置），空白模板 / 兜底默认值 | 通用 |

## 各脚本差异

| 项目 | `clash.js` | `clash-latest.js` | `clash-ruleset.js` | `clash-mobile.js` |
|------|-----------|-------------------|--------------------|-------------------|
| 节点匹配方式 | 中文关键词 `includes` | 正则 `/i` | 正则 `/i` | 正则 + 字母码边界 + emoji |
| 主策略组 | `Proxy` | `🌐 Proxy` | `🌐 Proxy` | `🚀 节点选择` |
| 自动选择 | `自动选择` | `🚀 自动选择` | `🚀 自动选择` | `⚡ 自动选择` |
| 故障转移 | `故障转移` | `🔄 故障转移` | `🔄 故障转移` | `🔄 故障转移` |
| AI 策略组 | `Gemini` | `🤖 Gemini` | `🤖 Gemini` | `🤖 AI 服务` |
| 地区策略组 | 香港优选、日本优选 | 🇭🇰 香港、🇯🇵 日本 | 🇭🇰 香港、🇯🇵 日本 | 🇭🇰 🇯🇵 🇸🇬 🇺🇸 🇹🇼 |
| 规则来源 | GEOSITE/GEOIP + applications | GEOSITE/GEOIP + applications | 远程 `rule-providers` | GEOSITE/GEOIP |
| 进程匹配 | 内核默认 | 内核默认 | 内核默认 | 关闭 (`off`) |
| Sniffer 嗅探 | 无 | 无 | 无 | 启用 |
| 入口函数 | `main(config)` | `main(config)` | `main(config)` | `main(config)` |

> ⚠️ `clash-latest.js` 与 `clash-ruleset.js` 虽然计算了新加坡 / 美国 / 台湾的节点变量，
> 但**目前只生成香港、日本两个地区策略组**；需要其它地区组需自行添加。

## 使用方法

### 桌面端 (Clash Verge Rev)

1. 订阅配置 → 点击订阅 → 「覆写脚本」
2. 粘贴 `clash-latest.js` 内容
3. 保存并更新订阅

### 移动端 (FlClash / FlClashX)

1. 配置 → 选择订阅 → 「覆写」→ 新建脚本
2. 粘贴 `clash-mobile.js` 内容并选中该脚本
3. 保存并更新订阅

> ⚠️ Clash Meta for Android 自带的「覆写」是结构化表单（端口 / DNS / 进程匹配等少量字段），
> **不能执行 JS 脚本**。如需在 Android 上使用本脚本，请改用 FlClash 等支持
> `main(config)` 覆写脚本的客户端。

### 缺省脚本

`clash-default.js` 不做任何修改，仅原样返回配置，可作为空白模板使用。

## 节点命名规范

各脚本识别的地区关键词如下（**大小写不敏感**）：

| 地区 | `clash.js` | `clash-latest.js` / `clash-ruleset.js` | `clash-mobile.js` |
|------|-----------|----------------------------------------|-------------------|
| 🇭🇰 香港 | `香港` | `香港` `HK` `HKG` | `香港` `🇭🇰` `HK` `HKG` |
| 🇯🇵 日本 | `日本` | `日本` `JP` `Japan` `Tokyo` `Osaka` | `日本` `东京` `大阪` `🇯🇵` `JP` `JPN` |
| 🇸🇬 新加坡 | `新加坡` | `新加坡` `SG` `Singapore` | `新加坡` `狮城` `🇸🇬` `SG` `SGP` |
| 🇺🇸 美国 | `美国` | `美国` `US` `USA` `America` | `美国` `洛杉矶` `纽约` `西雅图` `🇺🇸` `US` `USA` |
| 🇹🇼 台湾 | — | `台湾` `TW` `Taiwan` | `台湾` `台北` `🇹🇼` `TW` `TWN` |

> 匹配不到任何关键词的节点仍会出现在「主策略组」「自动选择」「故障转移」中，
> 只是不会归入地区组。

### ⚠️ 正则匹配注意事项

**不要使用 `\b`（单词边界）匹配中文节点：**

```javascript
// ✅ 正确 - 中文关键词直接匹配
/香港|日本/.test(name)

// ❌ 错误 - \b 对中文字符不起作用，匹配不到 "🇭🇰 香港01" 这类节点
/\b(香港|日本)\b/.test(name)
```

原因：`\b` 依赖单词字符 `[a-zA-Z0-9_]`，而中文字符不属于此类，
「空格 + 中文」之间不存在边界。

**2~3 位字母国家码需要"边界守卫"，否则会误判：**

```javascript
// ❌ 危险 - "Russia"、"AUS 澳洲" 都会被当成美国
/US/.test(name)

// ✅ 正确 - 要求 US 前后不是英文字母（clash-mobile.js 的做法）
/(?:^|[^A-Za-z])(?:US|USA)(?:[^A-Za-z]|$)/i.test(name)
```

`^` 与 `$` 分别补上"位于字符串开头 / 结尾"这两种没有字符可用的边界情况。

## 自定义

添加地区关键词时，直接往关键词数组里加即可（以 `clash-mobile.js` 为例）：

```javascript
// 原：只认 香港 / 🇭🇰 / HK / HKG
const hkPattern = regionPattern(['香港', '🇭🇰'], ['HK', 'HKG'])

// 改：补充英文全称与机房代号
const hkPattern = regionPattern(['香港', '🇭🇰', 'Hong Kong', 'HKT'], ['HK', 'HKG', 'HKT'])
```

## 技术栈

- 纯 JavaScript (ES Modules)
- 无需安装依赖

## 许可证

MIT
