/**
 * clash-mobile.js
 * 移动端（Android / iOS）覆写脚本，基于 mihomo（Clash.Meta）内核。
 *
 * 适用客户端（提供 JS 覆写脚本能力）：
 *   - FlClash / FlClashX（Android / iOS / 桌面）
 *   - 其它基于 mihomo 且以 main(config) 作为入口的移动客户端
 *
 * 注意：Clash Meta for Android 自带的「覆写」是结构化表单（override.json），
 *       只支持端口、DNS、进程匹配等少量字段，无法执行 JS 脚本。
 *       移动端如需本脚本请使用 FlClash，或改用规则片段。
 *
 * 与桌面端 clash-latest.js 的差异（移动端优化）：
 *   - 关闭进程匹配（Android 无桌面进程名）、降低探测频率、开启 lazy，省电省内存
 *   - geodata 使用 memconservative 低内存加载
 *   - 补全 DNS：代理节点域名 / 直连域名 / fake-ip 白名单分开解析
 *   - 启用 sniffer，解决 App 直接用 IP / QUIC 时规则无法命中域名的问题
 *   - 移除桌面端 applications 规则集（PROCESS-NAME 在 Android 上无效）
 *   - 过滤机场信息节点并补齐连接性检查、推送等直连规则
 */
function main(config) {
  // =========================================================
  // 0. 全局高级设置（移动端：省电 / 低内存）
  // =========================================================
  config['tcp-concurrent'] = true // 并发握手，加速首屏打开
  config['unified-delay'] = true // 统一延迟算法，节点测速更准确
  config['find-process-mode'] = 'off' // 移动端不做进程匹配，避免卡顿与额外耗电

  // =========================================================
  // 1. geodata 设置
  // =========================================================
  config['geodata-mode'] = true // 使用 geodata 数据文件模式
  config['geodata-loader'] = 'memconservative' // 低内存加载，移动端推荐

  config['geo-auto-update'] = true // 开启自动更新
  config['geo-update-interval'] = 168 // 更新间隔（小时）：7 天，减少流量消耗
  config['geox-url'] = {
    geosite: 'https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat',
    geoip: 'https://raw.githubusercontent.com/Loyalsoldier/geoip/release/geoip-only-cn-private.dat'
  }

  // =========================================================
  // 2. profile：持久化选择与 fake-ip，App 被系统回收后不丢失
  // =========================================================
  config.profile = {
    'store-selected': true,
    'store-fake-ip': true
  }

  // =========================================================
  // 3. DNS 配置（TUN + fake-ip）
  // =========================================================
  config.dns = {
    enable: true,
    'cache-algorithm': 'arc',
    ipv6: false,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    // 需要真实 IP 的域名（连接性检查、NTP、游戏主机、STUN 等），避免 fake-ip 导致检测失败
    'fake-ip-filter': [
      '*.lan',
      '*.localdomain',
      '*.localhost',
      'localhost.ptlogin2.qq.com',
      'localhost.sec.qq.com',
      'time.*.com',
      'ntp.*.com',
      'time.windows.com',
      '+.msftconnecttest.com',
      '+.msftncsi.com',
      '+.srv.nintendo.net',
      '+.stun.playstation.net',
      'xbox.*.microsoft.com',
      '*.xboxlive.com',
      'stun.*.*',
      'stun.*.*.*',
      '*.n.n.srv.nintendo.net',
      'connectivitycheck.gstatic.com',
      'connectivitycheck.android.com',
      'connectivitycheck.platform.hicloud.com',
      'captive.apple.com',
      '+.push.apple.com'
    ],

    // 默认 DNS：用于解析其它 DNS 服务器的域名，必须是纯 IP
    'default-nameserver': [
      'tls://223.5.5.5',
      'tls://223.6.6.6'
    ],
    // 域名解析：使用对大陆解析精准的 DNS
    nameserver: [
      'https://dns.alidns.com/dns-query',
      'https://doh.pub/dns-query'
    ]
  }

  // =========================================================
  // 4. Sniffer：移动端 App 常直接使用 IP / QUIC，需嗅探出域名才能命中规则
  // =========================================================
  config.sniffer = {
    enable: true,
    'force-dns-mapping': true, // 对 TUN / Redir 流量强制嗅探
    'parse-pure-ip': true, // 对未获取到域名的纯 IP 流量强制嗅探
    'override-destination': false, // 保守起见不全局改写目标，仅 HTTP 改写
    // ports 必须是字符串，支持 "8080-8880" 这样的端口段
    sniff: {
      HTTP: {
        ports: ['80', '8080-8880'],
        'override-destination': true
      },
      TLS: {
        ports: ['443', '8443']
      },
      QUIC: {
        ports: ['443']
      }
    },
    'skip-domain': [
      'Mijia Cloud',
      '+.push.apple.com'
    ]
  }

  // =========================================================
  // 5. 节点筛选与定义
  // =========================================================
  const rawProxies = Array.isArray(config.proxies) ? config.proxies : []

  // 机场常用「公告 / 到期 / 流量」等占位节点，无法连接且会污染测速组
  const NOISE = /(剩余|流量|到期|过期|官网|订阅|重置|群组|客服|防失联|加群|https?:\/\/|www\.)/i

  const seen = new Set()
  const keptProxies = []
  for (const proxy of rawProxies) {
    const name = proxy?.name
    if (typeof name !== 'string' || name.length === 0) continue
    if (NOISE.test(name)) continue
    if (seen.has(name)) continue // 重名节点会导致内核加载失败，需去重
    seen.add(name)
    keptProxies.push(proxy)
  }

  // 有可用节点时，回写清理后的节点列表以节省移动端内存
  if (keptProxies.length > 0) {
    const keptNames = new Set(keptProxies.map(p => p.name))
    const removedNames = new Set(
      rawProxies.map(p => p?.name).filter(n => typeof n === 'string' && !keptNames.has(n))
    )
    // 被清理节点如果被其它节点的 dialer-proxy 引用，需摘除该引用，否则加载失败
    for (const proxy of keptProxies) {
      const dialer = proxy['dialer-proxy']
      if (typeof dialer === 'string' && removedNames.has(dialer)) {
        delete proxy['dialer-proxy']
      }
    }
    config.proxies = keptProxies
  }

  const allProxies = (keptProxies.length > 0 ? keptProxies : rawProxies)
    .map(p => p?.name)
    .filter(name => typeof name === 'string' && name.length > 0)

  // 无内联节点时退回 proxy-providers，避免策略组为空导致配置无法加载
  const providerNames = Object.keys(config['proxy-providers'] ?? {})
  const useProviders = allProxies.length === 0 && providerNames.length > 0 ? { use: providerNames } : {}

  // 按节点名称中的地区关键词归类
  // 注意：中文不能使用 \b 单词边界；2~3 位字母国家码用非字母字符包夹，避免 US 误命中 Russia
  const regionPattern = (keywords, codes) =>
    new RegExp(`(${keywords.join('|')}|(?:^|[^A-Za-z])(?:${codes.join('|')})(?:[^A-Za-z]|$))`, 'i')

  const hkPattern = regionPattern(['香港', '🇭🇰'], ['HK', 'HKG'])
  const jpPattern = regionPattern(['日本', '东京', '大阪', '🇯🇵'], ['JP', 'JPN'])
  const sgPattern = regionPattern(['新加坡', '狮城', '🇸🇬'], ['SG', 'SGP'])
  const usPattern = regionPattern(['美国', '洛杉矶', '纽约', '西雅图', '🇺🇸'], ['US', 'USA'])
  const twPattern = regionPattern(['台湾', '台北', '🇹🇼'], ['TW', 'TWN'])

  const hkProxies = allProxies.filter(name => hkPattern.test(name))
  const jpProxies = allProxies.filter(name => jpPattern.test(name))
  const sgProxies = allProxies.filter(name => sgPattern.test(name))
  const usProxies = allProxies.filter(name => usPattern.test(name))
  const twProxies = allProxies.filter(name => twPattern.test(name))

  // AI 专用节点池，默认使用全部节点
  const aiNodes = [...allProxies]

  // 分组为空时回退到全部节点，仍为空则回退 DIRECT，避免策略组无可用节点
  const checkNodes = nodes => {
    if (nodes.length > 0) return nodes
    if (allProxies.length > 0) return allProxies
    return ['DIRECT']
  }

  // =========================================================
  // 6. 定义策略组
  // =========================================================
  const GROUP_MAIN = '🚀 节点选择'
  const GROUP_AUTO = '⚡ 自动选择'
  const GROUP_FALLBACK = '🔄 故障转移'
  const GROUP_AI = '🤖 AI 服务'
  const GROUP_HK = '🇭🇰 香港节点'
  const GROUP_JP = '🇯🇵 日本节点'
  const GROUP_SG = '🇸🇬 新加坡节点'
  const GROUP_US = '🇺🇸 美国节点'
  const GROUP_TW = '🇹🇼 台湾节点'

  // 自动选择：延迟最低的节点（lazy：仅在被使用时测速，移动端省电）
  const autoGroup = {
    name: GROUP_AUTO,
    type: 'url-test',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 50,
    lazy: true,
    'expected-status': 204,
    proxies: allProxies.length > 0 ? allProxies : ['DIRECT'],
    ...useProviders
  }
  // 故障转移：按顺序自动切换至可用节点
  const fallbackGroup = {
    name: GROUP_FALLBACK,
    type: 'fallback',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    lazy: true,
    'expected-status': 204,
    proxies: allProxies.length > 0 ? allProxies : ['DIRECT'],
    ...useProviders
  }

  const regionGroups = [
    { name: GROUP_HK, type: 'select', proxies: checkNodes(hkProxies), ...useProviders },
    { name: GROUP_JP, type: 'select', proxies: checkNodes(jpProxies), ...useProviders },
    { name: GROUP_SG, type: 'select', proxies: checkNodes(sgProxies), ...useProviders },
    { name: GROUP_US, type: 'select', proxies: checkNodes(usProxies), ...useProviders },
    { name: GROUP_TW, type: 'select', proxies: checkNodes(twProxies), ...useProviders }
  ]

  // 主策略组：手动选择，默认包含自动选择、故障转移与各地区分组
  const proxyGroup = {
    name: GROUP_MAIN,
    type: 'select',
    proxies: [
      GROUP_AUTO,
      GROUP_FALLBACK,
      ...regionGroups.map(g => g.name),
      ...allProxies,
      'DIRECT'
    ],
    ...useProviders
  }

  // AI 业务策略组
  const aiGroup = {
    name: GROUP_AI,
    type: 'select',
    proxies: checkNodes(aiNodes),
    ...useProviders
  }

  config['proxy-groups'] = [proxyGroup, autoGroup, fallbackGroup, aiGroup, ...regionGroups]

  // =========================================================
  // 7. 重写规则（自上而下匹配，命中即止）
  // =========================================================
  config.rules = [
    // 私有地址
    'GEOIP,private,DIRECT,no-resolve',
    'GEOSITE,private,DIRECT',

    // 广告拦截
    'GEOSITE,category-ads-all,REJECT',

    // 移动端系统流量：连接性检查 / 推送直连，避免网络状态误判
    'DOMAIN-SUFFIX,connectivitycheck.gstatic.com,DIRECT',
    'DOMAIN-SUFFIX,connectivitycheck.android.com,DIRECT',
    'DOMAIN-SUFFIX,connectivitycheck.platform.hicloud.com,DIRECT',
    'DOMAIN-SUFFIX,captive.apple.com,DIRECT',
    'DOMAIN-SUFFIX,push.apple.com,DIRECT',
    'DOMAIN-SUFFIX,www.msftconnecttest.com,DIRECT',

    // 特定站点：按归属地区指定出口节点
    'DOMAIN-SUFFIX,javdb.com,🇭🇰 香港节点',
    'DOMAIN-SUFFIX,jdbstatic.com,🇭🇰 香港节点',
    'DOMAIN-SUFFIX,dmm.co.jp,🇯🇵 日本节点',
    'DOMAIN-SUFFIX,dmm.com,🇯🇵 日本节点',
    'DOMAIN-SUFFIX,mgstage.com,🇯🇵 日本节点',

    // Google / Gemini：走 AI 策略组（利用 Geosite 标签）
    'GEOSITE,google,🤖 AI 服务',

    // ChatGPT：复用 AI 策略组
    'GEOSITE,openai,🤖 AI 服务',

    // 国内流量：直连
    'GEOSITE,cn,DIRECT',
    'GEOIP,cn,DIRECT,no-resolve',

    // 兜底：其余流量走主代理
    'MATCH,🚀 节点选择'
  ]

  console.log(
    `[clash-mobile] 节点 ${allProxies.length} 个，策略组 ${config['proxy-groups'].length} 个`
  )

  return config
}
