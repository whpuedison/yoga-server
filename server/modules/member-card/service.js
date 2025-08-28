/**
 * 函数式会员卡业务服务
 */
const { validator, errors, utils, database } = require('../../core')
const memberCardModel = require('./model')
const userModel = require('../../modules/user/model')

const { 
  validate, required, custom 
} = validator

const { 
  BusinessError, throwIf 
} = errors

const { 
  getCurrentTime 
} = utils

const { getPagination } = database

/**
 * 会员卡数据验证规则
 */
const validateMemberCardCreate = (cardData) => 
  validate(
    cardData,
    required('user_id', '用户ID不能为空'),
    required('type_id', '卡类型ID不能为空')
  )

/**
 * 格式化会员卡信息
 */
const formatMemberCardInfo = (card) => ({
  id: card.id,
  user_id: card.user_id,
  tenant_id: card.tenant_id,
  type_id: card.type_id,
  type: card.type,
  total_count: card.total_count,
  used_count: card.used_count,
  remaining_count: card.remaining_count,
  frozen_count: card.frozen_count,
  valid_days: card.valid_days,
  activated_at: card.activated_at,
  expires_at: card.expires_at,
  status: card.status,
  created_at: card.created_at,
  updated_at: card.updated_at,
  // 关联信息
  user_nickname: card.nickname,
  user_avatar: card.avatar_url,
  template_name: card.template_name
})

/**
 * 检查会员卡创建条件
 */
const checkMemberCardConditions = async (userId, typeId, tenantId) => {
  // 检查用户是否存在
  const user = await userModel.findById(userId)
  if (!user) {
    throw BusinessError('用户不存在')
  }

  // 检查用户是否属于该租户
  // 这里需要实现用户-租户关联检查
  // 暂时跳过，实际项目中需要验证

  // 检查卡类型是否存在
  // 这里需要实现卡类型检查
  // 暂时跳过，实际项目中需要验证

  return true
}

/**
 * 业务逻辑函数
 */

/**
 * 获取会员卡列表
 */
const getMemberCardList = async (tenantId, options = {}) => {
  const { page, size, offset } = getPagination(options.page, options.size)
  
  const result = await memberCardModel.findMemberCardList({
    tenantId,
    userId: options.user_id,
    status: options.status,
    type: options.type,
    offset,
    limit: size
  })
  
  return {
    list: result.list.map(formatMemberCardInfo),
    total: result.total,
    page,
    size
  }
}

/**
 * 获取会员卡详情
 */
const getMemberCardDetail = async (cardId, tenantId) => {
  const card = await memberCardModel.findByIdAndTenant(cardId, tenantId)
  if (!card) {
    throw BusinessError('会员卡不存在')
  }
  
  return formatMemberCardInfo(card)
}

/**
 * 获取用户会员卡列表
 */
const getUserMemberCards = async (userId, tenantId) => {
  const cards = await memberCardModel.findByUserId(userId, tenantId)
  return cards.map(formatMemberCardInfo)
}

/**
 * 创建会员卡
 */
const createMemberCard = async (tenantId, cardData) => {
  // 数据验证
  validateMemberCardCreate(cardData)

  const { user_id, type_id } = cardData

  // 检查创建条件
  await checkMemberCardConditions(user_id, type_id, tenantId)

  // 创建会员卡数据
  // 这里需要根据卡类型获取默认值
  const cardCreateData = {
    user_id: user_id,
    tenant_id: tenantId,
    type_id: type_id,
    type: 'count', // 默认类型，实际应从卡类型表获取
    total_count: 30, // 默认值，实际应从卡类型表获取
    remaining_count: 30, // 默认值
    used_count: 0,
    frozen_count: 0,
    valid_days: 180, // 默认值，实际应从卡类型表获取
    status: 'inactive',
    created_at: getCurrentTime(),
    updated_at: getCurrentTime()
  }

  const result = await memberCardModel.create(cardCreateData)
  
  if (!result.insertId) {
    throw BusinessError('会员卡创建失败')
  }

  // 返回会员卡信息
  return await getMemberCardDetail(result.insertId, tenantId)
}

/**
 * 激活会员卡
 */
const activateMemberCard = async (cardId, tenantId) => {
  const card = await memberCardModel.findByIdAndTenant(cardId, tenantId)
  if (!card) {
    throw BusinessError('会员卡不存在')
  }

  if (card.status !== 'inactive') {
    throw BusinessError('只能激活未激活的会员卡')
  }

  await memberCardModel.activateCard(cardId)
  return await getMemberCardDetail(cardId, tenantId)
}

/**
 * 冻结会员卡次数
 */
const freezeCardCount = async (cardId, count) => {
  await memberCardModel.updateFrozenCount(cardId, count)
  return true
}

/**
 * 解冻会员卡次数
 */
const unfreezeCardCount = async (cardId, count) => {
  await memberCardModel.updateFrozenCount(cardId, -count)
  return true
}

/**
 * 使用会员卡次数
 */
const useCardCount = async (cardId, count) => {
  await memberCardModel.updateRemainingCount(cardId, -count)
  await memberCardModel.updateUsedCount(cardId, count)
  return true
}

module.exports = {
  getMemberCardList,
  getMemberCardDetail,
  getUserMemberCards,
  createMemberCard,
  activateMemberCard,
  freezeCardCount,
  unfreezeCardCount,
  useCardCount,
  
  // 导出验证函数供其他模块使用
  validateMemberCardCreate
}
