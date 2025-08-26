/**
 * 全局中间件
 */
const { response } = require('./response')

/**
 * 错误处理中间件
 */
const errorHandler = async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    console.error('Global Error:', error)
    
    // 根据错误类型设置响应
    if (error.name === 'ValidationError') {
      ctx.status = 400
      ctx.body = response.error(error.message, 400, error.details)
    } else if (error.name === 'AuthError') {
      ctx.status = 401
      ctx.body = response.error(error.message, 401)
    } else if (error.name === 'ForbiddenError') {
      ctx.status = 403
      ctx.body = response.error(error.message, 403)
    } else if (error.name === 'NotFoundError') {
      ctx.status = 404
      ctx.body = response.error(error.message, 404)
    } else {
      ctx.status = 500
      ctx.body = response.error(
        process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误',
        500
      )
    }
  }
}

/**
 * CORS 中间件
 */
const cors = async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (ctx.method === 'OPTIONS') {
    ctx.status = 200
    return
  }
  
  await next()
}

/**
 * 请求日志中间件
 */
const requestLogger = async (ctx, next) => {
  const start = Date.now()
  
  await next()
  
  const duration = Date.now() - start
  console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${duration}ms`)
}

/**
 * 统一响应格式中间件
 */
const responseFormatter = async (ctx, next) => {
  await next()
  
  // 如果响应体不是对象或已经是标准格式，则不处理
  if (typeof ctx.body !== 'object' || ctx.body === null || ctx.body.hasOwnProperty('success')) {
    return
  }
  
  // 将普通对象包装为标准响应格式
  ctx.body = response.success(ctx.body)
}

module.exports = {
  errorHandler,
  cors,
  requestLogger,
  responseFormatter
}
