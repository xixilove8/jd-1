/*
31 6,18 * * * jd_tree.js
 */
const $ = new Env('云养树');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let cookiesArr = [];
Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
})
let activityID = '',cookie = '',userName = '';
let token = '',LZ_TOKEN_KEY = '',LZ_TOKEN_VALUE = '',Referer = '',nickname = '';
let Host = '', venderId = ``,shopId = ``,pin =  ``,lz_jdpin_token = ``;
let hotFlag = false;
let attrTouXiang = '',actorUuid = '';
!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
        return;
    }
    $.shareUuid = '2be917bf080d4d1596152f9a9979030d';
    let activityList = [{'id':'dz2105100000169401','endTime':'1640966399000'},];
    for (let i = 0; i < cookiesArr.length; i++) {
        let index = i + 1;
        cookie = cookiesArr[i];
        userName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        console.log(`\n*****开始【京东账号${index}】${userName}*****\n`);
        hotFlag = false;
        for (let j = 0; j < activityList.length && !hotFlag; j++) {
            let nowTime = Date.now();
            if(nowTime < activityList[j].endTime){
                activityID = activityList[j].id;
                console.log(`\n活动ID：`+ activityID);
                await main();
                console.log(`防止黑IP，等待30秒`);
                await $.wait(30000);
            }else{
                console.log(`\n活动ID：${activityID},已过期`)
            }
        }
    }
})().catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
}).finally(() => {
    $.done();
});

async function main() {
    Host = `lzdz1-isv.isvjcloud.com`;
    Referer = `https://lzdz1-isv.isvjcloud.com/dingzhi/qingfeng/planttrees/activity/${activityID}?activityId=${activityID}&shareUuid=${$.shareUuid}`;
    console.log(`活动地址：${Referer}`);
    token = '',LZ_TOKEN_KEY='',LZ_TOKEN_VALUE='',lz_jdpin_token = ``,venderId = ``,shopId = ``,pin =  ``,nickname = '',actorUuid = '';
    token = await getToken();
    if(!token){console.log(`获取token失败`);return;}
    await getWxCommonInfoToken('https://lzdz1-isv.isvjcloud.com/wxCommonInfo/token');
    if(!LZ_TOKEN_KEY || !LZ_TOKEN_VALUE){
        console.log(`初始化失败`);return;
    }
    await takePostRequest('getSimpleActInfoVo');
    if (venderId === ``) {console.log(`获取venderId失败`);return;}
    console.log(`venderId :${venderId}`);
    await getMyPing('https://lzdz1-isv.isvjcloud.com/customer/getMyPing');
    if (pin === ``) {hotFlag = true;console.log(`获取pin失败,该账号可能是黑号`);return;}
    await accessLogWithAD('https://lzdz1-isv.isvjcloud.com/common/accessLogWithAD');
    attrTouXiang = 'https://img10.360buyimg.com/imgzone/jfs/t1/7020/27/13511/6142/5c5138d8E4df2e764/5a1216a3a5043c5d.png';
    await getUserInfo('https://lzdz1-isv.isvjcloud.com/wxActionCommon/getUserInfo');
    await getHtml();
    $.activityData = {};
    await takePostRequest('activityContent');
    if(JSON.stringify($.activityData) === '{}'){
        console.log(`获取活动信息失败`);
        return ;
    }
    console.log(`获取活动信息成功`);
    actorUuid = $.activityData.actorUuid;
    await takePostRequest('drawContent');
    await $.wait(1000);

    if($.activityData.cowHas === 0){
        await takePostRequest('saveCow');
        await $.wait(1000);
    }
    await doTask();
    await $.wait(1000);
    await takePostRequest('activityContent');
    await $.wait(1000);
    let canScore = Math.floor($.activityData.score2/20);
    console.log(`可以浇水${canScore}次`);
    let fresh = false;
    for (let i = 0; i < canScore; i++) {
        console.log(`进行一次浇水`)
        await takePostRequest('feedCow');
        await $.wait(2000);
        fresh = true;
    }
    if(fresh){
        await takePostRequest('activityContent');
        await $.wait(1000);
    }
    let assistCount = $.activityData.assistCount;
    console.log(`可以抽奖${assistCount}次`);
    for (let i = 0; i < assistCount; i++) {
        console.log(`\n进行一次抽奖`)
        await takePostRequest('start');
        await $.wait(2000);
    }
}
async function doTask(){
    let taskTypeLis = [
        {'type':'signData','taskType':0,'taskValue':'1'},
        {'type':'toVenderShop','taskType':14,'taskValue':'1000001694'},
        {'type':'toPopShop','taskType':14,'taskValue':'56268'},
        {'type':'shopFollowData','taskType':23,'taskValue':'56268'},
        {'type':'takeCouponStatus','taskType':13,'taskValue':'56268'},
    ];
    for (let i = 0; i < taskTypeLis.length; i++) {
        if(!$.activityData[taskTypeLis[i].type]){
            console.log(`任务：${taskTypeLis[i].type},去执行`);
            $.taskType = taskTypeLis[i].taskType;
            $.taskValue = taskTypeLis[i].taskValue;
            await takePostRequest('saveTask');
            await $.wait(1000);
        }else{
            console.log(`任务：${taskTypeLis[i].type},已完成`);
        }
    }
    taskTypeLis = [
        {'type':'skuAllAddCartData','taskType':21,},
    ];
    for (let i = 0; i < taskTypeLis.length; i++) {
        let type = taskTypeLis[i].type;
        if($.activityData[type].allStatus){
            console.log(`任务：${type},已完成`);
        }else{
            console.log(`任务：${type},去执行`);
            $.taskType = taskTypeLis[i].taskType;
            $.taskValue = '';
            await takePostRequest('saveTask');
            await $.wait(1000);
        }
    }
}
function takePostRequest(type) {
    let url = '';
    let body = ``;
    switch (type) {
        case 'getSimpleActInfoVo':
            url = 'https://lzdz1-isv.isvjcloud.com/dz/common/getSimpleActInfoVo';
            body = `activityId=${activityID}`;
            break;
        case 'activityContent':
            url = 'https://lzdz1-isv.isvjcloud.com/dingzhi/qingfeng/planttrees/activityContent';
            body = `activityId=${activityID}&pin=${encodeURIComponent(pin)}&pinImg=${encodeURIComponent(attrTouXiang)}&nick=${encodeURIComponent(nickname)}&cjyxPin=&cjhyPin=&shareUuid=${$.shareUuid}`;
            break;
        case 'drawContent':
            url= 'https://lzdz1-isv.isvjcloud.com/dingzhi/taskact/common/drawContent';
            body = `activityId=${activityID}&pin=${encodeURIComponent(pin)}`;
            break;
        case 'saveCow':
            let cowNick = '小树';//getRandomChineseWord()+getRandomChineseWord()+'牛';
            console.log(`领取一颗树，取名：${cowNick}`);
            url= 'https://lzdz1-isv.isvjcloud.com/dingzhi/qingfeng/planttrees/saveCow';
            body = `activityId=${activityID}&pin=${encodeURIComponent(pin)}&actorUuid=${actorUuid}&cowNick=${cowNick}&shareUuid=${$.shareUuid}`;
            break;
        case 'feedCow':
            url= 'https://lzdz1-isv.isvjcloud.com/dingzhi/qingfeng/planttrees/feedCow';
            body = `activityId=${activityID}&actorUuid=${actorUuid}&pin=${encodeURIComponent(pin)}`;
            break;
        case 'saveTask':
            url= 'https://lzdz1-isv.isvjcloud.com/dingzhi/qingfeng/planttrees/saveTask';
            body = `activityId=${activityID}&actorUuid=${actorUuid}&pin=${encodeURIComponent(pin)}&taskType=${$.taskType}&taskValue=${$.taskValue}`;
            break;
        case 'start':
            url= 'https://lzdz1-isv.isvjcloud.com/dingzhi/qingfeng/planttrees/start';
            body = `activityId=${activityID}&actorUuid=${actorUuid}&pin=${encodeURIComponent(pin)}`;
            break;
        default:
            console.log(`错误${type}`);
    }
    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dealReturn(type, data);
            } catch (e) {
                console.log(data);
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function dealReturn(type, data) {
    if(type === 'drawContent'){
        return;
    }
    try {
        data = JSON.parse(data);
    } catch (e) {
        console.log(`执行任务异常`);
        console.log(data);
    }
    if (data.data && data.result && data.count === 0) {
    } else {
        console.log(`\n${type},执行异常`);
        console.log(JSON.stringify(data));
    }
    switch (type) {
        case 'getSimpleActInfoVo':
            shopId = data.data.shopId;
            venderId = data.data.venderId;
            break;
        case 'activityContent':
            $.activityData = data.data;
            break;
        case 'saveCow':
            console.log(`种植成功`);
            break;
        case 'saveTask':
            console.log(`执行成功，获得${data.data.milkCount || 0}滴水`);
            break;
        case 'feedCow':
            console.log(`成功，当前等级：${data.data.cowDetailMap.cowLevel},需要浇水：${data.data.cowDetailMap.totalFeedTimes}次，还需要浇水：${data.data.cowDetailMap.remainderTimes}次`);
            break;
        case 'start':
            console.log(`获得：${data.data.dataname || '空气'}`);
            console.log(JSON.stringify(data));
            break;
        default:
            console.log(JSON.stringify(data));
    }
}
function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function getHtml() {
    let config ={
        url:Referer,
        headers: {
            'Host':Host,
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cookie': `IsvToken=${token};${cookie} LZ_TOKEN_KEY=${LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${LZ_TOKEN_VALUE}; AUTH_C_USER=${pin}; ${lz_jdpin_token}`,
            "User-Agent": 'jdapp;iPhone;10.1.4;14.6;5a8a5743a5d2a4110a8ed396bb047471ea120c6a;network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214111493;appBuild/167814;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
            'Accept-Language':'zh-cn',
            'Accept-Encoding':'gzip, deflate, br',
            'Connection':'keep-alive'
        }
    }
    return new Promise(resolve => {
        $.get(config, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {

                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}
function getUserInfo(url) {
    const body = `pin=${encodeURIComponent(pin)}`;
    let myRequest = getPostRequest(url, body);
    return new Promise(resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                }
                else {
                    if(data){
                        data = JSON.parse(data);
                        if(data.count === 0 && data.result){
                            if(data.data.yunMidImageUrl){
                                attrTouXiang = data.data.yunMidImageUrl
                            }
                        }
                    }
                }
            } catch (e) {
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function accessLogWithAD(url) {
    let body = `venderId=${venderId}&code=99&pin=${encodeURIComponent(pin)}&activityId=${activityID}&pageUrl=${encodeURIComponent(Referer)}&subType=app&adSource=null`
    let myRequest = getPostRequest(url, body);
    return new Promise(resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    let setcookie = resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || ''
                    if(setcookie){
                        let LZTOKENKEY = setcookie.filter(row => row.indexOf("LZ_TOKEN_KEY") !== -1)[0]
                        if(LZTOKENKEY && LZTOKENKEY.indexOf("LZ_TOKEN_KEY=") > -1){
                            LZ_TOKEN_KEY = LZTOKENKEY.split(';') && (LZTOKENKEY.split(';')[0]) || ''
                            LZ_TOKEN_KEY = LZ_TOKEN_KEY.replace('LZ_TOKEN_KEY=','')
                        }
                        let LZTOKENVALUE = setcookie.filter(row => row.indexOf("LZ_TOKEN_VALUE") !== -1)[0]
                        if(LZTOKENVALUE && LZTOKENVALUE.indexOf("LZ_TOKEN_VALUE=") > -1){
                            LZ_TOKEN_VALUE = LZTOKENVALUE.split(';') && (LZTOKENVALUE.split(';')[0]) || ''
                            LZ_TOKEN_VALUE = LZ_TOKEN_VALUE.replace('LZ_TOKEN_VALUE=','')
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}
function getPostRequest(url, body) {
    const headers = {
        'X-Requested-With' : `XMLHttpRequest`,
        'Connection' : `keep-alive`,
        'Accept-Encoding' : `gzip, deflate, br`,
        'Content-Type' : `application/x-www-form-urlencoded`,
        'Origin' : `https://${Host}`,
        "User-Agent": `jdapp;iPhone;10.1.4;14.6;5a8a5743a5d2a4110a8ed396bb047471ea120c6a;network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214111493;appBuild/167814;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
        'Cookie': `${cookie} LZ_TOKEN_KEY=${LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${LZ_TOKEN_VALUE}; AUTH_C_USER=${pin}; ${lz_jdpin_token}`,
        'Host' : Host,
        'Referer' : Referer,
        'Accept-Language' : `zh-cn`,
        'Accept' : `application/json`
    };
    return {url: url, method: `POST`, headers: headers, body: body};
}
function getMyPing(url) {
    let body = `userId=${venderId}&token=${encodeURIComponent(token)}&fromType=APP`;
    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                let setcookie = resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || ''
                if(setcookie){
                    let lzjdpintoken = setcookie.filter(row => row.indexOf("lz_jdpin_token") !== -1)[0]
                    if(lzjdpintoken && lzjdpintoken.indexOf("lz_jdpin_token=") > -1){
                        lz_jdpin_token = lzjdpintoken.split(';') && (lzjdpintoken.split(';')[0] + ';') || ''
                    }
                    let LZTOKENVALUE = setcookie.filter(row => row.indexOf("LZ_TOKEN_VALUE") !== -1)[0]
                    if(LZTOKENVALUE && LZTOKENVALUE.indexOf("LZ_TOKEN_VALUE=") > -1){
                        LZ_TOKEN_VALUE = LZTOKENVALUE.split(';') && (LZTOKENVALUE.split(';')[0]) || ''
                        LZ_TOKEN_VALUE = LZ_TOKEN_VALUE.replace('LZ_TOKEN_VALUE=','')
                    }
                }
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.log(`执行任务异常`);
                    console.log(data);
                }
                if (data.data && data.data.secretPin) {
                    pin = data.data.secretPin
                    nickname = data.data.nickname
                } else {
                    console.log(JSON.stringify(data));
                }
            } catch (e) {
                console.log(data);
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function getWxCommonInfoToken (url) {
    const method = `POST`;
    const headers = {
        'X-Requested-With' : `XMLHttpRequest`,
        'Connection' : `keep-alive`,
        'Accept-Encoding' : `gzip, deflate, br`,
        'Content-Type' : `application/x-www-form-urlencoded`,
        'Origin' : `https://${Host}`,
        'User-Agent' : `jdapp;iPhone;10.1.4;14.6;5a8a5743a5d2a4110a8ed396bb047471ea120c6a;network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214111493;appBuild/167814;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
        'Cookie' : cookie,
        'Host' : Host,
        'Referer' : Referer,
        'Accept-Language' : `zh-cn`,
        'Accept' : `application/json`
    };
    const body = ``;
    const myRequest = {url: url, method: method, headers: headers, body: body};
    return new Promise(resolve => {
        $.post(myRequest, async (err, resp, data) => {
            try {
                let res = $.toObj(data);
                if(typeof res == 'object' && res.result === true){
                    if(typeof res.data.LZ_TOKEN_KEY != 'undefined') LZ_TOKEN_KEY = res.data.LZ_TOKEN_KEY;
                    if(typeof res.data.LZ_TOKEN_VALUE != 'undefined') LZ_TOKEN_VALUE = res.data.LZ_TOKEN_VALUE;
                }else if(typeof res == 'object' && res.errorMessage){
                    console.log(`token ${res.errorMessage || ''}`)
                }else{
                    console.log(data)
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}
function getToken() {
    let config = {
        url: 'https://api.m.jd.com/client.action?functionId=isvObfuscator',
        body: 'area=2_2830_51828_0&body=%7B%22url%22%3A%22https%3A%5C/%5C/lzdz1-isv.isvjcloud.com%22%2C%22id%22%3A%22%22%7D&build=167814&client=apple&clientVersion=10.1.4&d_brand=apple&d_model=iPhone9%2C2&eid=eidI42470115RDhDRjM1NjktODdGQi00RQ%3D%3DB3mSBu%2BcGp7WhKUUyye8/kqi1lxzA3Dv6a89ttwC7YFdT6JFByyAtAfO0TOmN9G2os20ud7RosfkMq80&isBackground=N&joycious=92&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=5a8a5743a5d2a4110a8ed396bb047471ea120c6a&osVersion=14.6&partner=apple&rfs=0000&scope=01&screen=1242%2A2208&sign=a5a2e76dd2804c0282a57408f2c6f498&st=1632903172362&sv=101',
        headers: {
            'Host': 'api.m.jd.com',
            'accept': '*/*',
            'user-agent': 'JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)',
            'accept-language': 'zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6',
            'content-type': 'application/x-www-form-urlencoded',
            'Cookie': cookie
        }
    }
    return new Promise(resolve => {
        $.post(config, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data['token'] || '');
            }
        })
    })
}
function getRandomArrayElements(arr, count) {
    var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}
function getAuthorShareCode(url) {
    return new Promise(async resolve => {
        const options = {
            "url": `${url}`,
            "timeout": 10000,
            "headers": {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
            }
        };
        if ($.isNode() && process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
            const tunnel = require("tunnel");
            const agent = {
                https: tunnel.httpsOverHttp({
                    proxy: {
                        host: process.env.TG_PROXY_HOST,
                        port: process.env.TG_PROXY_PORT * 1
                    }
                })
            }
            Object.assign(options, { agent })
        }
        $.get(options, async (err, resp, data) => {
            try {
                if (err) {
                } else {
                    if (data) data = JSON.parse(data)
                }
            } catch (e) {
                // $.logErr(e, resp)
            } finally {
                resolve(data || []);
            }
        })
        await $.wait(10000)
        resolve();
    })
}
function getRandomChineseWord () {
    var _rsl = "";
    var _randomUniCode = Math.floor(Math.random() * (40870 - 19968) + 19968).toString(16);
    eval("_rsl=" + '"\\u' + _randomUniCode + '"');
    return _rsl;
}
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
