// Created by jiehe2   2018/4/28
let axios = require("axios");
let fs = require("fs");
let path = require("path");
let config = require("../data/config");
let packjson = require("../../package.json");

module.exports = {
    downloadJsonFileFromBootcdn() {
        return axios.get("https://api.bootcdn.cn/libs.min.json")
    },

    cache(data) {
        try {
            let filePath = path.resolve(__dirname, "../data/data.json");

            fs.writeFileSync(filePath, JSON.stringify({
                data,
                timestamp: +new Date()
            }));
        } catch (ex) {
            throw new Error("保存bootcdn的json文件失败, 失败原因 : " + ex.message);
        }
    },

    getCacheJson() {
        let filePath = path.resolve(__dirname, "../data/data.json");
        if (!fs.existsSync(filePath)) {
            return null;
        } else {
            let data = fs.readFileSync(filePath, {encoding: 'utf8'});
            return JSON.parse(data);
        }
    },

    async getJsonFromCacheOrDownload() {
        // 2019年1月31日 修改缓存策略 : 缓存的文件超过2天需要从server端更新
        let json;

        try {
            json = this.getCacheJson();
        } catch (ex) {
            json = null;
        }

        if (json == null) {
            this.cache((await this.downloadJsonFileFromBootcdn()).data);
        } else if (json.timestamp === undefined || (Math.abs(+new Date() - json.timestamp) / (1000 * 3600 * 24) >= 2)) {
            this.cache((await this.downloadJsonFileFromBootcdn()).data);
        }

        return this.getCacheJson().data;
    },
    search(name) {
        return this.getJsonFromCacheOrDownload().then(items => {
            return items.filter(item => {
                try {
                    var nameLower = name.toLowerCase();
                    var itemLower = item[0].toLowerCase();
                    return itemLower.indexOf(nameLower) !== -1;
                } catch (ex) {
                    return item[0].indexOf(name) !== -1;
                }
            })
        })
    },
    getDetail(name) {
        return axios.get(`https://api.bootcdn.cn/libraries/${name}.min.json`)
    },
    getDesc(name, version) {
        if (["list", "detail", "all", "version"].indexOf(version) !== -1) {
            return this.getDetail(name).then(res => {
                let list = [];
                list.push(`主页 : ${res.data.homepage}`);
                list.push(`描述 : ${res.data.description}`);
                list.push(`license : ${res.data.license}`);
                list.push(`已列出所有的版本, 最新版本是 ${res.data.version}`);
                list.push(...res.data.assets.map(item => item.version));

                list = list.reverse();
                return list;
            });
        }

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
bootcdn官网js库查询工具        
使用示例(以查询jquery为例) :
1.不使用版本号
${packjson.name} jquery
2.使用版本号
${packjson.name} jquery 1.10
3.查询所有版本
${packjson.name} jquery all

Tip :
1.名称不区分大小写
2.版本号模糊匹配
3.如果不指定版本, 默认返回最新的稳定版本的库
        `;
    }
}
