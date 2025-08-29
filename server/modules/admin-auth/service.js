/**
 * 管理员认证业务服务
 */
const { validator, errors, utils } = require('../../core')
const adminAuthModel = require('./model')
const jwt = require('jsonwebtoken')
const config = require('../../../config')
const bcrypt = require('bcryptjs')

const { 
  validate, required, length 
} = validator

const { 
  AuthError, BusinessError 
} = errors

const { 
  getCurrentTime 
} = utils

/**
 * 管理员登录数据验证规则
 */
const validateAdminLogin = (loginData) => 
  validate(
    loginData,
    required('username', '用户名不能为空'),
    required('password', '密码不能为空')
  )

/**
 * 生成管理员JWT Token
 */
const generateAdminToken = (admin) => {
  const payload = {
    adminId: admin.id,
    username: admin.username,
    role: admin.role,
    type: 'admin'
  }
  
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '12h' })
}

/**
 * 验证管理员密码
 */
const verifyPassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword)
}

/**
 * 业务逻辑函数
 */

/**
 * 管理员登录
 */
const adminLogin = async (loginData) => {
  // 数据验证
  validateAdminLogin(loginData)

  const { username, password } = loginData

  // 查找管理员
  const admin = await adminAuthModel.findByUsername(username)
  if (!admin) {
    throw AuthError('用户名或密码错误')
  }

  // 验证密码
  if (!verifyPassword(password, admin.password)) {
    throw AuthError('用户名或密码错误')
  }

  // 更新最后登录时间
  await adminAuthModel.updateLastLogin(admin.id)

  // 生成token
  const token = generateAdminToken(admin)

  // 返回登录结果
  return {
    token,
    user_info: {
      id: admin.id,
      username: admin.username,
      role: admin.role
    }
  }
}

/**
 * 管理员登出
 * 实际登出逻辑由客户端处理（清除token）
 */
const adminLogout = async () => {
  return { message: '登出成功' }
}

module.exports = {
  adminLogin,
  adminLogout,
  
  // 导出验证函数供其他模块使用
  validateAdminLogin
}
