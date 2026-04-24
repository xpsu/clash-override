# clash-override

Clash/Mihomo 代理配置覆写脚本集合，支持多种规则源和平台。

## 功能特性

- **多规则源支持**：Geodata、Loyalsoldier 混合
- **多平台适配**：桌面端 (Clash Verge) + 移动端 (Clash Meta for Android)
- **智能节点筛选**：正则匹配，兼容中英文节点命名
- **精细化分流**：AI 服务、流媒体、社交媒体独立策略组

## 文件说明

| 文件 | 用途 | 适用平台 |
|------|------|----------|
| `clash.js` | 主脚本，Geodata + Loyalsoldier 混合 | 桌面端 |
| `clash-latest.js` | 最新稳定版本（推荐用于覆写） | 桌面端 |
| `clash-example.js` | 示例代码，供参考学习 | 参考 |

## 使用方法

### 桌面端 (Clash Verge Rev)

1. 订阅配置 → 点击订阅 → 「覆写脚本」
2. 粘贴 `clash-latest.js` 内容
3. 保存并更新订阅

### 移动端 (Clash Meta for Android)

1. 配置 → 选择订阅 → 右上角菜单 → 「覆写脚本」
2. 粘贴 `clash-latest.js` 内容
3. 保存并更新

## 节点命名规范

脚本使用正则匹配节点，支持以下命名格式：

```
美国 / US / USA / America
新加坡 / SG / Singapore
日本 / JP / Japan / Tokyo / Osaka
香港 / HK / HKG
```

### ⚠️ 正则匹配注意事项

由于中文字符的特殊性，**不要使用 `\b`（单词边界）** 匹配中文节点：

```javascript
// ✅ 正确 - 直接匹配关键字
/(日本|JP|Japan|Tokyo|Osaka)/i

// ❌ 错误 - \b 对中文字符不起作用，会匹配不到 "日本 01" 这类节点
/\b(日本|JP|Japan|Tokyo|Osaka)\b/i
```

原因：`\b` 依赖于单词字符 `[a-zA-Z0-9_]`，而中文字符不属于此类。

## 技术栈

- 纯 JavaScript（ES Modules）
- 无需安装依赖

## 许可证

MIT
