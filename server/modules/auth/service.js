/**
 * 函数式认证业务服务
 */
const { validator, errors, utils } = require('../../core')
const authModel = require('./model')
const jwt = require('jsonwebtoken')
const config = require('../../../config')

const { 
  validate, required, custom 
} = validator

const { 
  AuthError, BusinessError, throwIf 
} = errors

const { 
  getCurrentTime, pipe 
} = utils

/**
 * 微信登录数据验证规则
 */
const validateWechatLogin = (loginData) => 
  validate(
    loginData,
    required('code', '微信code不能为空'),
    required('invite_code', '场馆邀请码不能为空')
  )

/**
 * 获取微信用户信息
 * 这里需要集成微信API，暂时模拟实现
 */
const getWechatUserInfo = async (code) => {
  // 实际项目中应该调用微信API获取用户信息
  // 这里模拟返回用户信息
  return {
    openid: `mock_openid_${Date.now()}`,
    nickname: '微信用户',
    avatar_url: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132'
  }
}

/**
 * 处理用户和租户关联
 */
const handleUserTenantRelation = async (user, tenant) => {
  // 检查是否已有关联
  const existingRelation = await authModel.checkUserTenantRelation(user.id, tenant.id)
  if (!existingRelation) {
    // 创建新的关联
    await authModel.createUserTenantRelation(user.id, tenant.id)
  }
  return { user, tenant }
}

/**
 * 生成JWT Token
 */
const generateToken = (user, tenant) => {
  const payload = {
    userId: user.id,
    openid: user.openid,
    tenantId: tenant.id,
    type: 'mini-program'
  }
  
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

/**
 * 检查用户会员状态
 */
const checkMemberStatus = async (userId, tenantId) => {
  // 这里需要查询会员卡信息，暂时返回true
  // 实际项目中应该查询member_cards表
  return true
}

/**
 * 业务逻辑函数
 */

/**
 * 微信登录
 */
const wechatLogin = async (loginData) => {
  // 数据验证
  validateWechatLogin(loginData)

  // 获取微信用户信息
  const wechatUserInfo = await getWechatUserInfo(loginData.code)
  
  // 查找或创建用户
  let user = await authModel.findByOpenId(wechatUserInfo.openid)
  if (!user) {
    // 创建新用户
    const result = await authModel.createUser(wechatUserInfo)
    user = {
      id: result.insertId,
      ...wechatUserInfo
    }
  }

  // 查找租户
  const tenant = await authModel.findTenantByInviteCode(loginData.invite_code)
  if (!tenant) {
    throw BusinessError('无效的场馆邀请码')
  }

  // 处理用户-租户关联
  await handleUserTenantRelation(user, tenant)

  // 检查会员状态
  const isMember = await checkMemberStatus(user.id, tenant.id)

  // 生成token
  const token = generateToken(user, tenant)

  // 返回登录结果
  return {
    token,
    user_info: {
      id: user.id,
      nickname: user.nickname,
      avatar_url: user.avatar_url
    },
    current_tenant: {
      id: tenant.id,
      name: tenant.name
    },
    is_member: isMember
  }
}

/**
 * 获取当前用户信息
 */
const getCurrentUser = async (userId) => {
  const user = await authModel.findById(userId)
  if (!user) {
    throw AuthError('用户不存在')
  }

  // 获取用户关联的租户
  const tenants = await authModel.getUserTenants(userId)

  return {
    id: user.id,
    nickname: user.nickname,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
    tenants: tenants
  }
}

module.exports = {
  wechatLogin,
  getCurrentUser,
  
  // 导出验证函数供其他模块使用
  validateWechatLogin
}
