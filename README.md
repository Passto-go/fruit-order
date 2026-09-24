# 水果批发下单系统

一套面向水果批发场景的微信小程序 + 商家后台系统。

## 技术栈

| 端 | 技术 |
|----|------|
| 小程序 | 微信小程序原生 |
| 商家后台 | Vue3 + Vite + Element Plus + ECharts |
| 服务端 | Node.js + Express + MySQL |
| 部署 | 阿里云 + Nginx + PM2 |

## 目录结构

- server/ — 后端 API（Node.js）
- admin/ — 商家后台（Vue3）
- miniprogram/ — 微信小程序

## 功能

### 小程序端

- 商品浏览（分类、搜索、热销）
- 零售/批发双价
- 购物车、确认订单
- 订单轨迹
- 确认/取消报价
- 再次购买
- 我的账单 / 收藏

### 商家后台

- 数据看板
- 订单管理（报价、状态、结算）
- 客户管理
- 对账导出 Excel
- 商品管理（双价、规格、描述）

## 支付说明

当前版本未启用在线支付功能。

原因：项目当前为个人主体小程序，未取得微信支付商户号资质。批发场景下，结算方式为线下转账或月结，商家后台支持手动标记"已结清"。

代码中已预留支付接入位置：

- 环境变量 PAY_ENABLED（off/on）
- 路由 /api/pay/create/:orderId（小程序端 JSAPI 下单）
- 路由 /api/pay/notify（微信支付回调）
- 路由 /api/pay/status/:orderId（查询支付状态）

接入流程：主体升级为企业或个体工商户后，申请微信支付商户号，配置商户号、APIv3 密钥、证书序列号到 .env，将 PAY_ENABLED 改为 on，补充 utils/wxpay.js 的三个函数（统一下单、签名验证、回调解密）即可启用。

## 本地运行

后端：进入 server 目录，运行 npm install，再 npm run dev。

后台：进入 admin 目录，运行 npm install，再 npm run dev。

小程序：用微信开发者工具打开 miniprogram 目录。

## License

GPL-3.0
