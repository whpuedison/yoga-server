/**
 * 会员卡模板业务服务
 */
const { validator, errors, utils, database } = require('../../core')
const templateModel = require('./model')

const { 
  validate, required, length, custom 
} = validator

const { 
  BusinessError, throwIf 
} = errors

const { 
  getCurrentTime 
} = utils

const { getPagination } = database

/**
 * 会员卡模板数据验证规则
 */
const validateTemplateCreate = (templateData) => 
  validate(
    templateData,
    required('name', '模板名称不能为空'),
    length('name', 1, 100, '模板名称长度应在1-100字符之间'),
    required('type', '卡类型不能为空'),
    custom('type', (value) => ['count', 'period'].includes(value), '卡类型必须是count或period'),
    required('total_count', '总次数不能为空'),
    custom('total_count', (value) => value > 0, '总次数必须大于0'),
    required('valid_days', '有效天数不能为空'),
    custom('valid_days', (value) => value > 0, '有效天数必须大于0'),
    required('price', '价格不能为空'),
    custom('price', (value) => value >= 0, '价格不能为负数')
  )

/**
 * 格式化会员卡模板信息
 */
const formatTemplateInfo = (template) => ({
  id: template.id,
  name: template.name,
  type: template.type,
  totalCount: template.total_count,
  validDays: template.valid_days,
  price: template.price,
  description: template.description,
  tenantId: template.tenant_id,
  createdAt: template.created_at,
  updatedAt: template.updated_at
})

/**
 * 业务逻辑函数
 */

/**
 * 获取会员卡模板列表
 */
const getTemplateList = async (tenantId) => {
  const templates = await templateModel.findByTenantId(tenantId)
  return templates.map(formatTemplateInfo)
}

/**
 * 获取会员卡模板详情
 */
const getTemplateDetail = async (templateId, tenantId) => {
  const template = await templateModel.findByIdAndTenant(templateId, tenantId)
  if (!template) {
    throw BusinessError('会员卡模板不存在')
  }
  
  return formatTemplateInfo(template)
}

/**
 * 创建会员卡模板
 */
const createTemplate = async (tenantId, templateData) => {
  // 数据验证
  validateTemplateCreate(templateData)

  // 创建模板数据
  const templateCreateData = {
    ...templateData,
    tenant_id: tenantId,
    created_at: getCurrentTime(),
    updated_at: getCurrentTime()
  }

  const result = await templateModel.create(templateCreateData)
  
  if (!result.insertId) {
    throw BusinessError('会员卡模板创建失败')
  }

  // 返回模板信息
  return await getTemplateDetail(result.insertId, tenantId)
}

module.exports = {
  getTemplateList,
  getTemplateDetail,
  createTemplate,
  
  // 导出验证函数供其他模块使用
  validateTemplateCreate
}
