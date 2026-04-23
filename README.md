# clash-override

Clash/Mihomo 代理配置覆写脚本集合，支持多种规则源和平台。

## 功能特性

- **多规则源支持**：Geodata、Loyalsoldier、Blackmatrix7
- **多平台适配**：桌面端 (Clash Verge) + 移动端 (Clash Meta for Android)
- **智能节点筛选**：正则匹配，兼容中英文节点命名
- **精细化分流**：AI 服务、流媒体、社交媒体独立策略组

## 文件说明

| 文件 | 用途 | 适用平台 |
|------|------|----------|
| `clash.js` | 主脚本，Geodata + Loyalsoldier 混合 | 桌面端 |
| `clash-latest.js` | 最新稳定版本 | 桌面端 |
| `clash-example.js` | 示例代码 | 参考 |

## 使用方法

### 桌面端 (Clash Verge Rev)

1. 订阅配置 → 点击订阅 → 「覆写脚本」
2. 粘贴 `clash-latest.js` 内容
3. 保存并更新订阅

### 移动端 (Clash Meta for Android)

1. 配置 → 选择订阅 → 右上角菜单 → 「覆写脚本」
2. 粘贴 `clash-latest.js` 内容（需确保包含移动端适配代码）
3. 保存并更新

## 节点命名规范

脚本使用正则匹配节点，支持以下命名格式：

```
美国 / US / USA / America
新加坡 / SG / Singapore
日本 / JP / Japan / Tokyo
香港 / HK / HongKong
```

## 技术栈

- Node.js 18+
- ES Modules
- js-yaml

## 许可证

MIT
