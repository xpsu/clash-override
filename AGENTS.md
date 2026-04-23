# AGENTS.md - Clash Debug 项目指南

## 项目概述

Node.js 项目，用于生成 Clash 代理配置。读取 YAML 源文件，输出带有策略组和规则的 Clash 配置。

**技术栈**: Node.js + ES Modules + js-yaml

## 构建和运行命令

```bash
npm install                  # 安装依赖

node clash.js                # 主脚本 - Geodata + Loyalsoldier
node clash-blackmatrix7.js   # Blackmatrix7 规则源
node clash-geodata.js        # Geodata 模式配置
node clash-Loyalsoldier.js   # Loyalsoldier 规则源
```

**验证 YAML**: `node -e "import('js-yaml').then(y => console.log(y.load(require('fs').readFileSync('./source.yaml', 'utf8'))))"`

**测试**: 项目无正式测试框架，手动运行脚本验证输出。

## 代码风格指南

### 模块系统

- **必须使用 ES Modules** (`import`/`export`)
- package.json 已配置 `"type": "module"`

### 导入规范

```javascript
import fs from "fs"
import jsYaml from "js-yaml"
```

### 命名约定

| 元素     | 规范       | 示例                           |
|----------|------------|--------------------------------|
| 函数/变量 | camelCase | `clashBlackmatrix7`、`allProxies` |
| 策略组名 | 中文       | `自动选择`、`故障转移`         |
| 注释     | 中文优先   | 保持与现有代码一致             |

### 文件结构模式

**纯函数模式** (clash.js 等): 导出 `main(config)` 函数
```javascript
function main(config) {
  // 处理逻辑
  return config
}
```

**独立脚本模式** (clash-blackmatrix7.js):
```javascript
import fs from "fs"
import jsYaml from "js-yaml"

try {
  const fileContents = fs.readFileSync('./source.yaml', 'utf8')
  var config = jsYaml.load(fileContents)
  console.log("✅ 成功读取 YAML 文件，节点数量:", config.proxies.length)
} catch (e) {
  console.error("❌ 读取 YAML 失败:", e)
  process.exit(1)
}
```

### 错误处理

- 文件操作和 YAML 解析必须使用 try/catch
- 成功信息使用 `✅` 前缀，错误信息使用 `❌` 前缀

### 节点筛选模式

```javascript
const allProxies = config.proxies.map(p => p.name)
const usProxies = allProxies.filter(name => name.includes("美国"))
const jpProxies = allProxies.filter(name => name.includes("日本"))

// 空数组保护
const checkNodes = nodes => nodes.length > 0 ? nodes : allProxies
```

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
```

### 规则格式

```javascript
config.rules = [
  "GEOSITE,private,DIRECT",           // 优先级从高到低
  "GEOSITE,category-ads-all,REJECT",
  "DOMAIN-SUFFIX,dmm.co.jp,日本优选",
  "RULE-SET,Advertising,REJECT",
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
const providerCommon = {
  type: "http",
  interval: 86400,
  behavior: "classical",
  format: "yaml"
}

config["rule-providers"] = {
  "Advertising": {
    ...providerCommon,
    url: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Advertising/Advertising.yaml"
  }
}
```

### 代码结构顺序

1. **导入** - 文件顶部
2. **配置加载** - 读取解析 YAML（独立脚本模式）
3. **主函数** - 节点筛选 → 策略组 → 规则提供者 → 规则
4. **执行调试** - 调用主函数并输出调试信息

### 注释规范

```javascript
// =========================================================
// 1. 节点筛选与定义
// =========================================================

// --- 筛选节点 ---
// 简单粗暴：只要名字里含有这个国家的中文，就选出来
```

### 调试输出

```javascript
console.log("\n====== 调试报告 ======")
const groupNames = result['proxy-groups'].map(g => g.name)
console.log("当前策略组列表:", groupNames)
```

### 文件路径

使用项目根目录的相对路径：`fs.readFileSync('./source.yaml', 'utf8')`
