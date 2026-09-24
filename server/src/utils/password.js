import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

// 加密
export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

// 校验（明文 vs 哈希）
export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false
  // 兼容：如果数据库里存的还是明文（旧数据），直接比对
  // 比对成功后由调用方负责升级为哈希
  if (!hash.startsWith('$2')) {
    return plain === hash
  }
  return bcrypt.compare(plain, hash)
}

// 判断是否是 bcrypt 哈希
export function isHashed(str) {
  return typeof str === 'string' && str.startsWith('$2')
}
