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

## 后端图片

<img width="1440" height="772" alt="截屏2026-09-24 15 10 34" src="https://github.com/user-attachments/assets/692ddef8-bca8-42df-a3fd-16fa783280ec" />
<img width="1431" height="769" alt="截屏2026-09-24 15 10 46" src="https://github.com/user-attachments/assets/3dfe7e52-ef20-47c1-9b52-de86a098eb1c" />
<img width="1429" height="768" alt="截屏2026-09-24 15 10 53" src="https://github.com/user-attachments/assets/c195291b-f5fb-4fff-b25b-9345991b080c" />
<img width="1439" height="776" alt="截屏2026-09-24 15 12 01" src="https://github.com/user-attachments/assets/29fe2002-ae9e-4460-8084-a3505835bf2d" />
<img width="1440" height="775" alt="截屏2026-09-24 15 11 12" src="https://github.com/user-attachments/assets/7430463a-762b-4820-b8b3-db3210c0cad8" />
<img width="1430" height="763" alt="截屏2026-09-24 15 11 01" src="https://github.com/user-attachments/assets/e6376741-ca99-4243-b55f-0ccfa3e8beac" />

## 小程序图片

<img width="314" height="610" alt="截屏2026-09-24 15 30 56" src="https://github.com/user-attachments/assets/066de14a-9d35-4dde-b088-f5a8d3d0cc82" />
<img width="297" height="616" alt="截屏2026-09-24 15 30 40" src="https://github.com/user-attachments/assets/f94fdf0f-b1d3-4e03-b56b-d75bf67ec24d" />
<img width="293" height="616" alt="截屏2026-09-24 15 33 33" src="https://github.com/user-attachments/assets/155e4ad4-7645-4400-8014-50ef992d1525" />
<img width="303" height="610" alt="截屏2026-09-24 15 32 58" src="https://github.com/user-attachments/assets/4d1a03ea-a59b-4cc0-a5a1-b60c0d23c126" />
<img width="297" height="619" alt="截屏2026-09-24 15 31 52" src="https://github.com/user-attachments/assets/73b97179-76a8-4b3d-8efb-a48b3cafc960" />
<img width="299" height="618" alt="截屏2026-09-24 15 32 15" src="https://github.com/user-attachments/assets/e39ce81b-ebc2-4d7f-bea7-565917916194" />
<img width="316" height="616" alt="截屏2026-09-24 15 31 33" src="https://github.com/user-attachments/assets/420beb12-4ae1-454e-8db6-12cfd1312a9b" />




