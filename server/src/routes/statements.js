import express from 'express'
import ExcelJS from 'exceljs'
import { pool } from '../db.js'
import { adminAuth } from '../middleware/auth.js'

const router = express.Router()

// 导出 Excel（管理员）
router.get('/export', adminAuth, async (req, res) => {
  const { userId, startDate, endDate } = req.query
  if (!userId) return res.status(400).json({ success: false, msg: '缺少 userId' })

  let sql = `SELECT o.*, u.nickname, u.phone FROM orders o
             JOIN users u ON u.id = o.user_id
             WHERE o.user_id = ? AND o.status != 'cancelled'`
  const params = [userId]
  if (startDate) { sql += ' AND o.created_at >= ?'; params.push(startDate + ' 00:00:00') }
  if (endDate) { sql += ' AND o.created_at <= ?'; params.push(endDate + ' 23:59:59') }
  sql += ' ORDER BY o.created_at ASC'

  const [orders] = await pool.query(sql, params)
  for (const o of orders) {
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [o.id])
    o.items = items
  }

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('对账单')
  ws.columns = [
    { header: '订单号', key: 'order_no', width: 24 },
    { header: '下单时间', key: 'created_at', width: 20 },
    { header: '水果', key: 'fruit', width: 20 },
    { header: '数量', key: 'qty', width: 10 },
    { header: '单价', key: 'price', width: 10 },
    { header: '小计', key: 'subtotal', width: 12 },
    { header: '订单金额', key: 'total', width: 14 },
    { header: '结算状态', key: 'settle', width: 12 },
    { header: '备注', key: 'remark', width: 30 }
  ]
  ws.getRow(1).font = { bold: true }

  let totalAmount = 0
  for (const o of orders) {
    totalAmount += Number(o.total_amount)
    for (let i = 0; i < o.items.length; i++) {
      const it = o.items[i]
      ws.addRow({
        order_no: i === 0 ? o.order_no : '',
        created_at: i === 0 ? new Date(o.created_at).toLocaleString('zh-CN') : '',
        fruit: it.fruit_name,
        qty: it.confirmed_quantity || it.quantity,
        price: it.confirmed_price || it.ref_price,
        subtotal: it.subtotal || '',
        total: i === 0 ? o.total_amount : '',
        settle: i === 0 ? (o.settle_status === 'settled' ? '已结清' : '未结算') : '',
        remark: i === 0 ? (o.merchant_remark || '') : ''
      })
    }
  }
  ws.addRow({})
  const last = ws.addRow({ order_no: '合计', total: totalAmount })
  last.font = { bold: true }

  const nickname = orders[0]?.nickname || 'customer'
  const fileName = `对账单_${nickname}_${Date.now()}.xlsx`
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
  await wb.xlsx.write(res)
  res.end()
})

export default router
