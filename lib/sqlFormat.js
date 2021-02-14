const assert = require('assert')

/**
 * [cFormat 参数自定义处理]
 * @param  {Object} option [description]
 * @return {Object}        [description]
 */
function cFormat (option) {
  if (typeof option.data === 'object') {
    let page = {}
    // 分页参数处理
    for (let key in option.data) {
      if (/page_(index|size)/.test(key)) {
        page[key] = option.data[key]
        delete option.data[key]
      }
    }
    if (Object.keys(page).length && !option.limit) {
      let index = ((page.page_index - 1) || 0) * (page.page_size || 15)
      option.limit = ` ${index}, ${page.page_size} `
    }
  }
  return option
}

function noop () {}

// (>) 大于 - $gt
// (<) 小于 - $lt
// (>=) 大于等于 - $gte
// (<= ) 小于等于 - $lte
const ConditionalOperator = ['$gt', '$lt', '$gte', '$lte']

/**
 * 参数对象
 */
class Option {
  constructor (opt) {
    this.type = ''
    this.sql = ''
    this.tableName = ''
    this.limit = ''
    this.order = ''
    this.data = {}
    this.where = '',
    if (opt.format) {
      this.setFormat(this) 
    }
    this.format = opt.format || noop
  }
  setFormat (opt) {
    return this.format.bind(this, this, opt)()
  }
}

/**
 * sql语句对象实例化
 */
export default class SqlFormat {
  constructor (opt) {
    assert(!opt.mysql, 'mysql is required')
    this.mysql = opt.mysql
  }

  format (obj) {
    const option = new Option(obj)
    let sql = ''
    if (typeof obj === 'string') return obj
    if (option.sql) return option.sql
    assert(!option.tableName, 'tableName is required')
    assert(!option.type, 'type is required')
    // data
    const [fileds, values] = this.createData(option.data)
    // where
    const where = this.createWhere(option.where)
    // limit
    const limit = this.createLimit(option.limit)
    // order
    const order = this.createOrderBy
    // type
    switch (option.type) {
      case 'select':
        let select = fileds.length ? fileds.join(',') : '*'
        sql = `SELECT ${select} FROM ${option.tableName} ${where} ${order} ${limit} `
        break
      case 'insert':
        assert(!fileds.length || !values.length || fileds.length !== values.length, 'option.data is error')
        sql = `INSERT INTO ${option.tableName} (${fileds.join(',')}) VALUES (${values.join(',')})`
        break
      case 'update':
        const update = fileds.map((v, i) => {
          return ` ${v}=${values[i]} `
        }).join(' ')
        sql = `UPDATE ${option.tableName} SET ${update} ${where}`
        break
      case 'delete':
        sql = `DELETE FROM ${option.tableName} ${where}`
        break
      case 'count':
        sql = `SELECT sum(1) as count FROM ${option.tableName} ${where}`
        break
      default:
        console.log('option.type', option.type)
        break
    }
  }

  createData (data) {
    const fileds = []
    const values = []
    for (let key in data) {
      fileds.push(key)
      let v = data[key]
      if (utils.Type.isString(v)) {
        v = data[key].replace(/([\"\'])/g, '\\$1')
      }
      values.push(`"${v}"`)
    }
    return [fileds, values]
  }

  createWhere (w) {
    let where = ''
    if (typeof w === 'string') {
      where = w
    } else {
      const wheres = []
      let hasOP = false
      for (let key in w) {
        const v = w[key]
        wheres.push(` ${v} `)
        if (/\s/.test(v)) hasOP = true
      }
      !hasOP && (where = wheres.join(' AND '))
    }
    where && (where = ` WHERE ${where} `)
    return where
  }

  createLimit (l) {
    let limit = ''
    if (typeof l === 'string') {
      limit = l
    } else {
      assert(!l.index || !l.size, 'limit need index or size')
      const index = ((l.index - 1) || 0) * (l.size || 15)
      limit = ` ${index},${l.size} `
    }
    limit && (limit = ` LIMIT ${limit} `)
    return limit
  }

  createOrderBy (o) {
    let order = ''
    if (typeof o === 'string') {
      order = o
    } else {
      order = Object.keys(o).join(',')
    }
    order && (order = ` ORDER BY ${order} `)
    return order
  }

  query (opt) {
    const sql = this.format(opt)
    const data = await this.mysql.query(sql)
    console.log('data0', data)
    return data
  }

  async insert (opt = {}) {
    opt.type = 'insert'
    return this.query(opt)
  }

  async select (opt = {}) {
    opt.type = 'select'
    return this.query(opt)[0]
  }

  async count (opt = {}) {
    opt.type = 'count'
    return this.query(opt)[0].count || 0
  }

  async update (opt = {}) {
    opt.type = 'update'
    return this.query(opt)
  }

  async delete (opt = {}) {
    opt.type = 'delete'
    return this.query(opt)
  }
}
