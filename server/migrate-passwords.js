import { pool } from './src/db.js'
import { hashPassword, isHashed } from './src/utils/password.js'

async function main() {
  console.log('开始扫描 admins 表...')
  const [admins] = await pool.query('SELECT * FROM admins')
  let count = 0

  for (const a of admins) {
    if (isHashed(a.password)) {
      console.log(`  [跳过] ${a.username} 已是哈希`)
      continue
    }
    const hashed = await hashPassword(a.password)
    await pool.query('UPDATE admins SET password = ? WHERE id = ?', [hashed, a.id])
    console.log(`  [升级] ${a.username} 已加密`)
    count++
  }

  console.log(`\n完成：共升级 ${count} 个账号`)
  process.exit(0)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
