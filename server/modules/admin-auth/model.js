/**
 * 管理员认证数据模型
 */
const { database } = require('../../core')

// 创建管理员表的数据库操作函数
const adminDb = database.createDbOperations('admins')

/**
 * 根据用户名查找管理员
 */
const findByUsername = async (username) => {
  const sql = 'SELECT * FROM admins WHERE username = ?'
  return await adminDb.queryOne(sql, [username])
}

/**
 * 更新管理员最后登录时间
 */
const updateLastLogin = async (adminId) => {
  const sql = 'UPDATE admins SET last_login = NOW(), updated_at = NOW() WHERE id = ?'
  return await adminDb.query(sql, [adminId])
}

// 导出所有管理员模型函数
module.exports = {
  // 基础CRUD操作
  ...adminDb,
  
  // 自定义查询函数
  findByUsername,
  updateLastLogin
}
