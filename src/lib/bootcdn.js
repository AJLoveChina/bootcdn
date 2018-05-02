// Created by jiehe2   2018/4/28
let axios = require("axios")
let fs = require("fs")
let path = require("path")
let config  = require("../data/config")
let packjson = require("../../package.json")

module.exports = {
  getJson() {
    return axios.get("https://api.bootcdn.cn/libraries.min.json")
  },
  getJsonCache() {
    return new Promise((resolve, reject) => {
      var filePath = path.resolve(__dirname, "../data/data.json")

      if (!fs.existsSync(filePath)) {
        this.getJson().then(res => {
          fs.writeFile(filePath, JSON.stringify(res.data));

          resolve(res.data)
        })
      } else {
        fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
          if (!err) {
            resolve(JSON.parse(data))
          } else {
            reject(err);
          }
        });
      }
    })
  },
  search(name) {
    return this.getJsonCache().then(items => {
      return items.filter(item => {
        try {
          var nameLower = name.toLowerCase();
          var itemLower = item[0].toLowerCase();
          return itemLower.indexOf(nameLower) !== -1;
        }  catch (ex) {
          return item[0].indexOf(name) !== -1;
        }
      })
    })
  },
  getDetail(name) {
    return axios.get(`https://api.bootcdn.cn/libraries/${name}.min.json`)
  },
  getDesc(name, version) {
    return this.getDetail(name).then(res => {
      var name = res.data.name;
      res = res.data;
      version = version ? version : res.version;

      return res.assets.filter(item => {
        var reg = new RegExp(version);
        return reg.test(item.version)
      }).map(item => {
        return item.files.map(filepath => `${config.BOOTCDN_URL}/${name}/${item.version}/${filepath}`)
      })[0]
    }).catch(err => {
      if (err.response.status === 404) {
        return new Error("没有找到相应的库, 请检查名称是否正确")
      } else {
        return new Error("网络错误, 请求异常")
      }
    })
  },
  getInfo() {
    return `
使用示例(以查询jquery为例) :
1.不使用版本号
${packjson.name} jquery
2.使用版本号
${packjson.name} jquery 1.10

Tip :
1.名称不区分大小写
2.版本号模糊匹配
3.如果不指定版本, 默认返回最新的稳定版本的库
        `;
  }
}