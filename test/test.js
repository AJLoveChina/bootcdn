// Created by jiehe2   2018/4/28
let bootcdn = require("../src/lib/bootcdn")

bootcdn.getDesc("jquery", "all").then(data => {
    console.log(data);
}).catch(err => {
    console.log(err.message);
});
