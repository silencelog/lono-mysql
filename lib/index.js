class Mysql {
  constructor (opt, mysql) {
    this.name = 'mysql'
    this.isLono = true
    this.opt = opt
    this.connectionMap = {}
    this.mysql = mysql
  }
  install (app) {
    const config = app.$config.mysql
    if (config && config.client) {
      if (Array.isArray(config.client)) {
        config.client.forEach((item) => {
          this.createDB(item)
        })
      } else if (typeof config.client === 'object') {
        this.createDB(config.client)
      }
    }
    app.context.mysql = this
  }
  async createDB (client) {
    const name = client.name || 'default'
    const mode = client.mode || 'pool'
    switch (mode) {
      case 'pool':
        this.connectionMap[name] = await this.createPool(client)
        break
      case 'connection':
        this.connectionMap[name] = await this.createConnection(client)
        break
      default:
        break
    }
  }
  async createConnection (client) {
    client.user = client.username || client.user
    delete client.type
    delete client.username
    delete client.name
    const conn = await mysql.createConnection(client)
    return conn
  }
  async createPool (client) {
    // {host:'localhost', user: 'root', password:'root' database: 'test'}
    client.user = client.username || client.user
    delete client.type
    delete client.username
    delete client.name
    const pool = this.mysql.createPool(client)
    const promisePool = pool.promise()
    return promisePool
  }
  get (name) {
    return this.connectionMap[name || 'default']
  }
}

module.exports = function (opt) {
  const mysql = require('mysql2')
  return new Mysql(opt, mysql)
}
