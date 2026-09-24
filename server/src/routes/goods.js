import express from 'express'
import { pool } from '../db.js'
import { adminAuth } from '../middleware/auth.js'

const router = express.Router()
router.use(adminAuth)

// 商品列表
router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM fruits ORDER BY id DESC')
  res.json({ success: true, data: rows })
})

// 新增商品
router.post('/', async (req, res) => {
  const {
    name, unit, ref_price, category, image, origin,
    description, wholesale_price, wholesale_spec, wholesale_unit
  } = req.body

  if (!name || !unit) return res.status(400).json({ success: false, msg: '名称和单位必填' })

  const [r] = await pool.query(
    `INSERT INTO fruits
      (name, unit, ref_price, category, image, origin, description,
       wholesale_price, wholesale_spec, wholesale_unit, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      name, unit, ref_price || 0, category || '', image || '',
      origin || '', description || '',
      wholesale_price || 0, wholesale_spec || '', wholesale_unit || '箱'
    ]
  )
  res.json({ success: true, id: r.insertId })
})

// 编辑商品（含所有新字段）
router.put('/:id', async (req, res) => {
  const {
    name, unit, ref_price, category, image, origin,
    description, wholesale_price, wholesale_spec, wholesale_unit, status
  } = req.body

  await pool.query(
    `UPDATE fruits SET
      name = ?,
      unit = ?,
      ref_price = ?,
      category = ?,
      image = ?,
      origin = ?,
      description = ?,
      wholesale_price = ?,
      wholesale_spec = ?,
      wholesale_unit = ?,
      status = ?
     WHERE id = ?`,
    [
      name, unit, ref_price, category, image,
      origin || '', description || '',
      wholesale_price || 0, wholesale_spec || '', wholesale_unit || '箱',
      status ?? 1,
      req.params.id
    ]
  )
  res.json({ success: true })
})

// 软删除
router.delete('/:id', async (req, res) => {
  await pool.query('UPDATE fruits SET status=0 WHERE id=?', [req.params.id])
  res.json({ success: true })
})

export default router
