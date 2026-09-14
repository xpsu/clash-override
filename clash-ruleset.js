function main(config) {
  // --- 1. 全局高级设置 ---
  config['tcp-concurrent'] = true // TCP 并发连接，加速首屏打开

  // --- 2. DNS 配置 ---
  config.dns = {
    enable: true,
    'cache-algorithm': 'arc',
    ipv6: false,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',

    // 默认 DNS, 用于解析 DNS 服务器 的域名
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

  const usProxies = allProxies.filter(name => /(美国|US|USA|America)/i.test(name))
  const sgProxies = allProxies.filter(name => /(新加坡|SG|Singapore)/i.test(name))
  const jpProxies = allProxies.filter(name => /(日本|JP|Japan|Tokyo|Osaka)/i.test(name))
  const hkProxies = allProxies.filter(name => /(香港|HK|HKG)/i.test(name))
  const twProxies = allProxies.filter(name => /(台湾|TW|Taiwan)/i.test(name))

  const geminiNodes = [...allProxies]

  const checkNodes = nodes => nodes.length > 0 ? nodes : allProxies

  // =========================================================
  // 2. 定义策略组
  // =========================================================
  const autoGroup = {
    name: '🚀 自动选择',
    type: 'url-test',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 50,
    proxies: allProxies
  }
  const fallbackGroup = {
    name: '🔄 故障转移',
    type: 'fallback',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    proxies: allProxies
  }
  const proxyGroup = {
    name: '🌐 Proxy',
    type: 'select',
    proxies: ['🚀 自动选择', '🔄 故障转移', ...allProxies]
  }
  const geminiGroup = {
    name: '🤖 Gemini',
    type: 'select',
    proxies: checkNodes(geminiNodes)
  }
  const jpGroup = {
    name: '🇯🇵 日本节点',
    type: 'url-test',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 50,
    proxies: checkNodes(jpProxies)
  }
  const hkGroup = {
    name: '🇭🇰 香港节点',
    type: 'select',
    proxies: checkNodes(hkProxies)
  }

  config['proxy-groups'] = [proxyGroup, autoGroup, fallbackGroup, geminiGroup, hkGroup, jpGroup]

  // =========================================================
  // 3. 引用源
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
      url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Google/Google.yaml',
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
  // 4. 重写规则
  // =========================================================
  config.rules = [
    // 本地基础设施
    'RULE-SET,lancidr,DIRECT',
    'RULE-SET,private,DIRECT',
    'RULE-SET,applications,DIRECT',

    // 广告拦截
    'RULE-SET,reject,REJECT',

    // 特定业务 (你的日本优选)
    'DOMAIN-SUFFIX,javdb.com,🇭🇰 香港节点',
    'DOMAIN-SUFFIX,jdbstatic.com,🇭🇰 香港节点',
    'DOMAIN-SUFFIX,dmm.co.jp,🇯🇵 日本节点',
    'DOMAIN-SUFFIX,dmm.com,🇯🇵 日本节点',
    'DOMAIN-SUFFIX,mgstage.com,🇯🇵 日本节点',

    // Google & Gemini
    'RULE-SET,google,🤖 Gemini',

    // 核心：国内直连，国外都走代理
    'RULE-SET,direct,DIRECT',
    'RULE-SET,cncidr,DIRECT,no-resolve',

    // 兜底：国外全走代理
    'MATCH,🌐 Proxy'
  ]

  return config
}
