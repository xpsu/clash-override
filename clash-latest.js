function main(config) {
  // --- 1. 全局高级设置 ---
  config['tcp-concurrent'] = true // TCP 并发连接，加速首屏打开

  // --- 2. geodata设置 ---
  config['geodata-mode'] = true
  // config['geodata-loader'] = 'memconservative'; // 内存节省模式

  config['geox-auto-update'] = true // 开启自动更新
  config['geox-update-interval'] = 6 // 更新间隔，单位为小时
  config['geox-url'] = {
    geoip: 'https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat',
    geosite: 'https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat',
    mmdb: 'https://github.com/Loyalsoldier/geoip/releases/latest/download/Country.mmdb'
  }

  // --- 3. DNS 配置 ---
  config.dns = {
    enable: true,
    'cache-algorithm': 'arc',
    ipv6: false,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    "fake-ip-filter": [
      // QQ快速登录检测失败
      "localhost.ptlogin2.qq.com",
      "localhost.sec.qq.com",
      // 微信快速登录检测失败
      "localhost.work.weixin.qq.com"
    ],

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

  let geminiNodes = [...sgProxies, ...usProxies, ...hkProxies]

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
    applications: {
      type: 'http',
      behavior: 'classical',
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt',
      path: 'ruleset/applications.yaml',
      interval: 86400
    }
  }

  // =========================================================
  // 4. 重写规则
  // =========================================================
  config.rules = [
    // 本地基础设施 (直接调用 dat 里的私有分类)
    'GEOSITE,private,DIRECT',
    'GEOIP,private,DIRECT,no-resolve',
    'RULE-SET,applications,DIRECT',

    // 广告拦截
    'GEOSITE,category-ads-all,REJECT',

    // 特定业务 (你的日本优选)
    'DOMAIN-SUFFIX,dmm.co.jp,🇯🇵 日本节点',
    'DOMAIN-SUFFIX,dmm.com,🇯🇵 日本节点',
    'DOMAIN-SUFFIX,mgstage.com,🇯🇵 日本节点',
    'DOMAIN-SUFFIX,javdb.com,🇭🇰 香港节点',
    'DOMAIN-SUFFIX,jdbstatic.com,🇭🇰 香港节点',

    // Google & Gemini (利用 Geosite 标签)
    'GEOSITE,google,🤖 Gemini',
    // 'GEOSITE,google-gemini,🤖 Gemini',

    // Telegram
    'GEOSITE,telegram,🌐 Proxy',
    'GEOIP,telegram,🌐 Proxy,no-resolve',

    // --- 微软分流逻辑：精准提取直连，余下全部代理 ---
    // "GEOSITE,github,Proxy",
    // "GEOSITE,win-update,DIRECT",
    // "GEOSITE,microsoft,Proxy",

    // 国内外大分流
    'GEOSITE,cn,DIRECT',
    'GEOIP,cn,DIRECT,no-resolve',
    'GEOSITE,geolocation-!cn,🌐 Proxy', // 所有非中国域名，快速通行证

    'MATCH,🌐 Proxy'
  ]

  return config
}
