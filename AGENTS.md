# AGENTS.md - Clash Override 项目指南

## 项目概述

Clash/Mihomo 代理配置覆写脚本集合，用于 Clash Verge、Clash Meta for Android 等客户端的「覆写脚本」功能。

**技术栈**: 纯 JavaScript (ES Modules)，无需外部依赖

## 文件说明

| 文件 | 用途 |
|------|------|
| `clash.js` | 主脚本 - Geodata + Loyalsoldier 混合 |
| `clash-latest.js` | 最新稳定版本（推荐用于覆写） |
| `clash-example.js` | 示例代码，供参考学习 |

## 使用方式

脚本通过 Clash 客户端的「覆写脚本」功能直接执行，**无需安装依赖**。

### 覆写脚本原理

```javascript
// 客户端将已解析的 config 对象传入 main 函数
function main(config) {
  // 修改 config
  return config
}
```

## 代码风格指南

### 模块系统

- **必须使用 ES Modules** (`import`/`export`)
- package.json 已配置 `"type": "module"`

### 命名约定

| 元素     | 规范       | 示例                           |
|----------|------------|--------------------------------|
| 函数/变量 | camelCase | `allProxies`、`jpProxies` |
| 策略组名 | 中文       | `自动选择`、`故障转移`、`日本节点` |
| 注释     | 中文优先   | 保持与现有代码一致             |

### 文件结构

**覆写脚本模式** (clash-latest.js): 导出 `main(config)` 函数
```javascript
function main(config) {
  // 节点筛选
  const allProxies = config.proxies.map(p => p.name)
  const jpProxies = allProxies.filter(name => /(日本|JP|Japan|Tokyo|Osaka)/i.test(name))
  
  // 策略组定义
  config['proxy-groups'] = [...]
  
  // 规则定义
  config.rules = [...]
  
  return config
}
```

### 错误处理

- 使用 `console.log` 输出调试信息
- 成功信息使用 `✅` 前缀，错误信息使用 `❌` 前缀

### 节点筛选模式

```javascript
const allProxies = config.proxies.map(p => p.name)
const usProxies = allProxies.filter(name => /(美国|US|USA|America)/i.test(name))
const sgProxies = allProxies.filter(name => /(新加坡|SG|Singapore)/i.test(name))
const jpProxies = allProxies.filter(name => /(日本|JP|Japan|Tokyo|Osaka)/i.test(name))
const hkProxies = allProxies.filter(name => /(香港|HK|HKG)/i.test(name))

// 空数组保护
const checkNodes = nodes => nodes.length > 0 ? nodes : allProxies
```

### ⚠️ 正则匹配注意事项

**不要使用 `\b`（单词边界）** 匹配中文节点：

```javascript
// ✅ 正确 - 直接匹配关键字
/(日本|JP|Japan|Tokyo|Osaka)/i

// ❌ 错误 - \b 对中文字符不起作用，会匹配不到 "日本 01" 这类节点
/\b(日本|JP|Japan|Tokyo|Osaka)\b/i
```

原因：`\b` 依赖于单词字符 `[a-zA-Z0-9_]`，而中文字符不属于此类。

### 策略组定义

```javascript
const autoGroup = {
  name: "自动选择",
  type: "url-test",        // select | url-test | fallback
  url: "http://www.gstatic.com/generate_204",
  interval: 600,
  tolerance: 50,
  proxies: allProxies
}

const jpGroup = {
  name: "日本节点",
  type: "url-test",
  url: "http://www.gstatic.com/generate_204",
  interval: 600,
  tolerance: 50,
  proxies: checkNodes(jpProxies)
}
```

### 规则格式

```javascript
config.rules = [
  "GEOSITE,private,DIRECT",           // 优先级从高到低
  "GEOSITE,category-ads-all,REJECT",
  "DOMAIN-SUFFIX,dmm.co.jp,日本节点",
  "GEOSITE,cn,DIRECT",
  "GEOIP,cn,DIRECT,no-resolve",
  "MATCH,Proxy"                        // 兜底规则必须放最后
]
```

### 对象属性访问

Clash 配置键含连字符时必须用方括号：

```javascript
config['geodata-mode'] = true
config['proxy-groups'] = [...]
config['rule-providers'] = {...}
```

### 规则提供者

```javascript
config["rule-providers"] = {
  "applications": {
    type: "http",
    behavior: "classical",
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
    path: "ruleset/applications.yaml",
    interval: 86400
  }
}
```

### 代码结构顺序

1. **主函数定义** - 接收 config 对象
2. **节点筛选** - 从 config.proxies 中提取节点
3. **策略组定义** - 创建代理策略组
4. **规则配置** - 定义分流规则
5. **返回 config** - 返回修改后的配置

### 注释规范

```javascript
// =========================================================
// 1. 节点筛选与定义
// =========================================================

// --- 筛选节点 ---
```

### 调试输出

```javascript
console.log("日本节点数量:", jpProxies.length)
```
