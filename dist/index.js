"use strict";

var _promise = _interopRequireDefault(require("mysql2/promise"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

class LodeMysql {
  constructor(opt, mysql) {
    this.name = 'mysql';
    this.isLode = true;
    this.opt = opt;
    this.connectionMap = {};
    this.mysql = mysql;
  }

  install(lode) {
    const config = lode.$config.mysql;

    if (config && config.client) {
      if (Array.isArray(config.client)) {
        config.client.forEach(item => {
          this.createDB(item);
        });
      } else if (typeof config.client === 'object') {
        this.createDB(config.client);
      }
    }

    lode.context.mysql = this;
  }

  createDB(client) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const name = client.name || 'default';
      const mode = client.mode || 'pool';

      switch (mode) {
        case 'pool':
          _this.connectionMap[name] = yield _this.createPool(client);
          break;

        case 'connection':
          _this.connectionMap[name] = yield _this.createConnection(client);
          break;

        default:
          break;
      }
    })();
  }

  createConnection(client) {
    return _asyncToGenerator(function* () {
      client.user = client.username || client.user;
      delete client.type;
      delete client.username;
      delete client.name;
      const conn = yield _promise.default.createConnection(client);
      return conn;
    })();
  }

  createPool(client) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      // {host:'localhost', user: 'root', password:'root' database: 'test'}
      client.user = client.username || client.user;
      delete client.type;
      delete client.username;
      delete client.name;

      const pool = _this2.mysql.createPool(client);

      const promisePool = pool.promise();
      return promisePool;
    })();
  }

  get(name) {
    return this.connectionMap[name || 'default'];
  }

}

module.exports = function (opt) {
  const mysql = require('mysql2');

  return new LodeMysql(opt, mysql);
};