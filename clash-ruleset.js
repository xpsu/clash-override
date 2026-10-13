function main(config) {
  // --- 全局高级设置 ---
  config['tcp-concurrent'] = true // 启用 TCP 并发连接，加速首屏打开

  // --- DNS 配置 ---
  config.dns = {
    enable: true,
    'cache-algorithm': 'arc',
    ipv6: false,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',

    // 默认 DNS：用于解析其他 DNS 服务器的域名
    'default-nameserver': [
      'tls://223.5.5.5',
      'tls://223.6.6.6'
    ],
    nameserver: [
      'https://dns.alidns.com/dns-query',
      'https://doh.pub/dns-query'
    ]
  }

  // =========================================================
  // 1. 节点筛选与定义
  // =========================================================
  const allProxies = config.proxies.map(p => p.name)

  // 按节点名称中的地区关键词归类（勿用 \b 单词边界，对中文无效）
  const usProxies = allProxies.filter(name => /(美国|US|USA|America)/i.test(name))
  const sgProxies = allProxies.filter(name => /(新加坡|SG|Singapore)/i.test(name))
  const jpProxies = allProxies.filter(name => /(日本|JP|Japan|Tokyo|Osaka)/i.test(name))
  const hkProxies = allProxies.filter(name => /(香港|HK|HKG)/i.test(name))
  const twProxies = allProxies.filter(name => /(台湾|TW|Taiwan)/i.test(name))

  // Gemini 专用节点池，默认使用全部节点
  const geminiNodes = [...allProxies]

  // 分组为空时回退到全部节点，避免策略组无可用节点
  const checkNodes = nodes => nodes.length > 0 ? nodes : allProxies

  // =========================================================
  // 2. 定义策略组
  // =========================================================
  // 自动选择：延迟最低的节点
  const autoGroup = {
    name: '🚀 自动选择',
    type: 'url-test',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 50,
    proxies: allProxies
  }
  // 故障转移：按顺序自动切换至可用节点
  const fallbackGroup = {
    name: '🔄 故障转移',
    type: 'fallback',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    proxies: allProxies
  }
  // 主策略组：手动选择，默认包含自动选择与故障转移
  const proxyGroup = {
    name: '🌐 Proxy',
    type: 'select',
    proxies: ['🚀 自动选择', '🔄 故障转移', ...allProxies]
  }
  // 细分业务策略组
  const geminiGroup = {
    name: '🤖 Gemini',
    type: 'select',
    proxies: checkNodes(geminiNodes)
  }
  const jpGroup = {
    name: '🇯🇵 日本节点',
    type: 'select',
    proxies: checkNodes(jpProxies)
  }
  const hkGroup = {
    name: '🇭🇰 香港节点',
    type: 'select',
    proxies: checkNodes(hkProxies)
  }

  config['proxy-groups'] = [proxyGroup, autoGroup, fallbackGroup, geminiGroup, hkGroup, jpGroup]

  // =========================================================
  // 3. 引用源（远程规则集）
  // =========================================================
  config['rule-providers'] = {
    lancidr: {
      type: 'http',
      behavior: 'ipcidr',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt',
      path: 'ruleset/lancidr.yaml',
      interval: 86400
    },

    private: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt',
      path: 'ruleset/private.yaml',
      interval: 86400
    },

    applications: {
      type: 'http',
      behavior: 'classical',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt',
      path: 'ruleset/applications.yaml',
      interval: 86400
    },

    reject: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
      path: 'ruleset/reject.yaml',
      interval: 86400
    },

    google: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt',
      path: 'ruleset/google.yaml',
      interval: 86400
    },

    direct: {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
      path: 'ruleset/direct.yaml',
      interval: 86400
    },

    cncidr: {
      type: 'http',
      behavior: 'ipcidr',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt',
      path: 'ruleset/cncidr.yaml',
      interval: 86400
    }
  }

  // =========================================================
  // 4. 重写规则（自上而下匹配，命中即止）
  // =========================================================
  config.rules = [
    // 局域网 / 私有地址 
    'RULE-SET,lancidr,DIRECT,no-resolve',
    'RULE-SET,private,DIRECT',

    // 广告拦截
    'RULE-SET,reject,REJECT',

    // 本机应用
    'RULE-SET,applications,DIRECT',

    // 特定站点：按归属地区指定出口节点
    'DOMAIN-SUFFIX,javdb.com,🇭🇰 香港节点',
    'DOMAIN-SUFFIX,jdbstatic.com,🇭🇰 香港节点',
    'DOMAIN-SUFFIX,dmm.co.jp,🇯🇵 日本节点',
    'DOMAIN-SUFFIX,dmm.com,🇯🇵 日本节点',
    'DOMAIN-SUFFIX,mgstage.com,🇯🇵 日本节点',

    // Google / Gemini：走 Gemini 策略组
    'RULE-SET,google,🤖 Gemini',

    // 国内流量：直连
    'RULE-SET,direct,DIRECT',
    'RULE-SET,cncidr,DIRECT,no-resolve',

    // 兜底：其余流量走主代理
    'MATCH,🌐 Proxy'
  ]

  return config
}
