#! /usr/bin/env node
// Created by jiehe2   2018/4/28
let bootcdn = require("../src/lib/bootcdn");
let inquirer = require("inquirer");
let arguments = process.argv.splice(2);
let name = arguments[0];
let version = arguments[1];

if (/\-info$/.test(name) || name === undefined) {
    return console.log(bootcdn.getInfo());
}

bootcdn.search(name).then(items => {
    let count = items.length;
    if (count > 10) {
        console.log("当前查询结果较多, 只显示前十条数据");
    } else if (count === 0) {
        return console.log("没有找到相应的库, 请检查名称是否正确");
    }
    let newList = items.slice(0, 10);

    if (newList.length > 1) {
        let map = [{
            type: 'list',
            name: 'project',
            message: "当前查询结果较多, 请选择库",
            choices: newList.map(arr => arr[0])
        }];

        inquirer.prompt(map).then(answers => {
            deal(answers.project)
        });
    } else {
        deal(newList[0][0]);
    }


    function deal(project) {
        bootcdn.getDesc(project, version).then(result => {
            if (result === undefined) {
                console.log("未找到相应版本");
            } else {
                console.log(JSON.stringify(result, null, 2));
            }
        }).catch(ex => {
            console.log(ex.message);
        })
    }
});
