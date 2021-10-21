/*
* 京东到家农场
* 需要先手动进系统种一棵果树
* cron 10 8,11,17 * * * jd_jddj_fruit.js
* */
const $ = new Env('京东到家农场');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//环境变量，是否保存执行数据，（false：否，true：是）默认否
const saveRunFlag =  $.isNode() ? (process.env.SAVE_RUN_INFO ? process.env.SAVE_RUN_INFO : true):true;
let cookiesArr = [];
let inviteList = [];
let jddjCookie = {};
let allMessage = '';
$.jddjFruitHelpList = {};
$.modelId = 'M10007';
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    });
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
    cookiesArr = [
        $.getdata("CookieJD"),
        $.getdata("CookieJD2"),
        ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
    let nowTime = getCurrDate();
    let jddjFruitTime = $.getdata('jddjFruitTime');
    if (!jddjFruitTime || nowTime !== jddjFruitTime) {
        $.setdata(nowTime, 'jddjFruitTime');
        $.setdata({}, 'jddjFruitHelpList');
    }
    $.jddjFruitHelpList = saveRunFlag ? $.getdata('jddjFruitHelpList') || {} : {};
    $.jddjFruitHelpList =  $.getdata('jddjFruitHelpList') || {} ;
    jddjCookie = $.getdata('jddjCklist') || {};
    for (let i = 0; i < cookiesArr.length; i++) {
        $.index = i + 1;
        $.cookie = cookiesArr[i];
        $.isLogin = true;
        $.nickName = '';
        $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        if(!jddjCookie[$.UserName]){
            continue;
        }
        console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
        if (!$.isLogin) {
            $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
            if ($.isNode()) {
                await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
            }
            continue;
        }
        await main();
    }
    if(allMessage){
        notify.sendNotify('京东到家水果', allMessage);
    }
    if(inviteList.length === 0){return ;}
    cookiesArr = getRandomArrayElements(cookiesArr,cookiesArr.length);
    console.log(`\n============开始账号内互助================\n`);
    for (let i = 0; i < cookiesArr.length; i++) {
        $.index = i + 1;
        $.cookie = cookiesArr[i];
        $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        if(!jddjCookie[$.UserName]){
            continue;
        }
        if($.jddjFruitHelpList[$.UserName]){
            console.log(`${$.UserName},无助力次数`);continue;
        }
        $.jddjCookie = jddjCookie[$.UserName].ck;
        $.token = $.jddjCookie.match(/deviceid_pdj_jd=([^; ]+)(?=;?)/)[1];
        $.ua = `jdapp;iPhone;10.1.0;14.6;${$.token};network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214221593;appBuild/167774;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/25E168;supportJDSHWK/1`;
        $.canHelp = true;
        for (let j = 0; j < inviteList.length &&  $.canHelp; j++) {
            $.oneInvite = inviteList[j];
            if($.UserName === $.oneInvite.usr || $.oneInvite['needTime'] === 0){continue;}
            console.log(`${$.UserName}去助力${$.oneInvite.usr},助力码：${JSON.stringify($.oneInvite)}`);
            await takeGetRequest('help');
            await $.wait(3000);
        }
    }
})().catch((e) => {$.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')}).finally(() => {$.done();});

async function main() {
    $.oneInvite = {'usr': $.UserName};
    $.lat = '30.' + Math.round(Math.random() * (99999 - 10000) + 10000);
    $.lng = '114.' + Math.round(Math.random() * (99999 - 10000) + 10000);
    $.cityId = 2;
    $.o2o_m_h5_sid = '';
    $.deviceid_pdj_jd = '';
    $.jddjCookie = '';
    $.jddjCookie = jddjCookie[$.UserName].ck;
    $.token = $.jddjCookie.match(/deviceid_pdj_jd=([^; ]+)(?=;?)/)[1];
    $.ua = `jdapp;iPhone;10.1.0;14.6;${$.token};network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214221593;appBuild/167774;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/25E168;supportJDSHWK/1`;
    if ($.jddjCookie === '') {
        console.log(`获取京东到家CK失败`);
        return;
    }
    console.log('**************');
    console.log($.jddjCookie);
    console.log('**************');
    await $.wait(1000);
    $.treeInfo = {};
    await takePostRequest('initFruit');
    if (JSON.stringify($.treeInfo) === '{}') {
        console.log(`获取详情失败,可能还未种果树`);
        jddjCookie[$.UserName] = ``;
        return;
    } else {
        $.userPin = $.treeInfo.activityInfoResponse.userPin;
        $.waterBalance = $.treeInfo.userResponse.waterBalance;
        console.log(`获取果树详情成功，当前有${$.waterBalance}滴水`);
        $.oneInvite['userPin'] = $.userPin;
    }
    if (Number($.treeInfo.activityInfoResponse.curStageLeftProcess) === 0 && $.treeInfo.activityInfoResponse.stageName === '成熟') {
        let sendMessage = `账号 ${$.index} ${$.UserName},果树已经成熟\n\n`;
        allMessage += `京东账号 ${$.index} ${$.UserName},果树已经成熟\n\n`;
        //notify.sendNotify('京东到家水果', sendMessage);
        console.log(`已经成熟`);
        return;
    }
    $.waterWheelInfo = {};
    await takeGetRequest('getWaterWheelInfo');
    if (Number($.waterWheelInfo['waterStorage']) > 10) {
        console.log(`收集风车水滴，现有${$.waterWheelInfo['waterStorage']}滴`);
        await $.wait(1000);
        await takeGetRequest('collectWater');
    } else {
        console.log(`水车当前水滴为：${$.waterWheelInfo['waterStorage']},大于10时会收取`);
    }
    await $.wait(2000);
    $.waterRedPackInfo = {};
    await takeGetRequest('getWaterRedPackInfo');
    if ($.waterRedPackInfo.status === 2) {
        console.log(`可以开红包`);
        await $.wait(2000);
        await takeGetRequest('receiveWaterRedPack');
    }
    await $.wait(2000);
    $.waterBottleInfo = {};
    await takeGetRequest('getWaterBottleInfo');
    if ($.waterBottleInfo.receiveStatus === 0) {
        await $.wait(1000);
        console.log(`收水瓶中的水，当前有${$.waterBottleInfo.yesterdayAccumulate}滴水`);
        await takeGetRequest('receiveWaterBottle');
    } else if ($.waterBottleInfo.receiveStatus === 1) {
        console.log(`水瓶水滴已收过`)
    } else if ($.waterBottleInfo.receiveStatus === -2) {
        console.log(`未到收取水瓶水滴时间`)
    } else if ($.waterBottleInfo.receiveStatus === -1) {
        console.log(`水瓶中没有水可以领取`)
    }
    await $.wait(2000);
    $.taskInfoList = [];
    await takeGetRequest('list');//任务列表
    //console.log(JSON.stringify($.taskInfoList ));
    await doTask();
    await $.wait(2000);
    await takePostRequest('initFruit');
    $.waterBalance = $.treeInfo.userResponse.waterBalance;
    $.waterTime = Math.floor($.waterBalance / 10);
    console.log(`现有${$.waterBalance}滴水`);
    if (Number($.waterTime) > 0) {
        console.log(`开始浇${$.waterTime * 10}滴水`);
        await takePostRequest('watering');
        await $.wait(2000);
    }
    await takeGetRequest('getWaterRedPackInfo');
    if ($.waterRedPackInfo.status === 2) {
        console.log(`可以开红包`);
        await $.wait(2000);
        await takeGetRequest('receiveWaterRedPack');
    } else {
        console.log(`没有红包可以开`);
    }
    if (Number($.oneInvite['needTime']) === 0 || $.oneInvite['needTime'] === undefined) {
        console.log(`助力已满`);
    } else {
        inviteList.push($.oneInvite);
        console.log(`助力码:${JSON.stringify($.oneInvite)}`);
    }
}
async function doTask() {
    for (let i = 0; i < $.taskInfoList.length; i++) {
        $.oneTask = $.taskInfoList[i];
        if ($.oneTask.status === 3) {
            console.log(`任务：${$.oneTask.taskTitle},已完成`);
            continue;
        }
        switch ($.oneTask.taskType) {
            case 1201:
                $.oneInvite['uniqueId'] = $.oneTask.uniqueId;
                $.oneInvite['needTime'] = Number($.oneTask.totalNum) - Number($.oneTask.finishNum);
                break;
            case 502:
                if (new Date().getHours() < 10) {
                    console.log(`执行任务：${$.oneTask.taskTitle}`);
                    await takeGetRequest('userSigninNew');
                    await $.wait(2000);
                } else {
                    console.log(`任务：${$.oneTask.taskTitle}，不执行（10点之前执行）`);
                }
                break;
            case 1102:
                if ($.oneTask.ifCanFinishTask === 1) {
                    console.log(`完成任务：${$.oneTask.taskTitle}`);
                    await takeGetRequest('finished');
                    await $.wait(2000);
                } else {
                    console.log(`任务：${$.oneTask.taskTitle},未到领取时间`);
                }
                break;
            case 1103:
            case 1101:
                if ($.oneTask.ifCanFinishTask === 1 && $.oneTask.todayFinishNum === 0) {
                    console.log(`完成任务：${$.oneTask.taskTitle}`);
                    await takeGetRequest('finished');
                    await $.wait(2000);
                } else {
                    console.log(`任务：${$.oneTask.taskTitle},已完成`);
                }
                break;
            case 0:
                if ($.oneTask.status === 2) {
                    console.log(`领取奖励：${$.oneTask.taskTitle}`);
                    await takeGetRequest('sendPrize');
                    await $.wait(2000);
                } else if ($.oneTask.status === 0) {
                    console.log(`领取任务：${$.oneTask.taskTitle}`);
                    await takeGetRequest('received');
                    await $.wait(2000);
                } else {
                    console.log(`任务：${$.oneTask.taskTitle}，未完成`);
                }
                break;
            case 307:
            case 901:
                switch ($.oneTask.status) {
                    case 0:
                        console.log(`领取任务：${$.oneTask.taskTitle}`);
                        await takeGetRequest('received');
                        if (Number($.oneTask.browseTime) > 0) {
                            console.log(`等待${$.oneTask.browseTime}秒`);
                            await $.wait(Number(1000 * $.oneTask.browseTime))
                        } else {
                            console.log(`等待：3秒`);
                            await $.wait(Number(3000));
                        }
                    case 1:
                        console.log(`完成任务：${$.oneTask.taskTitle}`);
                        await takeGetRequest('finished');
                        await $.wait(Number(500));
                    case 2:
                        console.log(`领取奖励：${$.oneTask.taskTitle}`);
                        await takeGetRequest('sendPrize');
                        await $.wait(2000);
                        break;
                    default:
                        console.log(JSON.stringify($.oneTask.status));
                }
                break;
            default:
                console.log(`任务：${$.oneTask.taskTitle},不执行`);
        }
    }
}
function dealReturn(type, data) {
    try {
        data = JSON.parse(data);
    } catch (e) {
        console.log(data);
    }
    switch (type) {
        case 'initFruit':
            if (data.code === '0') {
                $.treeInfo = data.result;
            }
            break;
        case 'getWaterWheelInfo':
            if (data['code'] === '0' && data['result']) {
                $.waterWheelInfo = data['result'];
                console.log('获取水车信息成功')
            }
            break;
        case 'getWaterBottleInfo':
            if (data['code'] === '0' && data['result']) {
                $.waterBottleInfo = data['result'];
                console.log('获取水瓶信息成功')
            }
            break;
        case 'getWaterRedPackInfo':
            if (data['code'] === '0' && data['result']) {
                $.waterRedPackInfo = data['result'];
            }
            break;
        case 'receiveWaterRedPack':
            if (data['code'] === '0' && data['result']) {
                console.log(`打开成功，获得${data['result']['reward']}滴水`);
            }
            break;
        case 'collectWater':
            if (data.code === '0') {
                console.log('收取水车水滴成功')
            } else {
                console.log('收取水车水滴失败')
            }
            break;
        case 'receiveWaterBottle':
            if (data.code === '0') {
                console.log('收取水瓶水滴成功')
            } else {
                console.log('收取水瓶水滴失败')
            }
        case 'list':
            if (data['code'] === '0' && data['result'] && data['result']['taskInfoList']) {
                $.taskInfoList = data['result']['taskInfoList'];
            } else {
                console.log(JSON.stringify(data));
            }
            break;
        case 'userSigninNew':
            if (data['code'] === '0') {
                console.log('签到成功');
            } else {
                console.log(JSON.stringify(data));
                console.log('签到失败');
            }
            break;
        case 'received':
            //console.log(JSON.stringify(data));
            break;
        case 'finished':
            if (data && data.code === '0' && data.result && data.result.realRewardValue) {
                console.log(`获得${data.result.realRewardValue}滴水`);
            } else {
                //console.log(JSON.stringify(data));
            }
            break;
        case 'sendPrize':
            if (data && data.code === '0' && data.result && data.result.awardValue) {
                console.log(`获得${data.result.awardValue}滴水`);
            } else {
                console.log(JSON.stringify(data));
            }
            break;
        case 'watering':
            if (data.code === '-5') {
                let sendMessage = `【第${$.index}个账号】，${$.UserName},果树已经成熟`;
                notify.sendNotify('京东到家水果', sendMessage);
            }
            console.log(JSON.stringify(data));
            break;
        case 'help':
            if (data.code === '0') {
                console.log(`助力成功`);
                $.oneInvite['needTime']--;
                $.canHelp = false;
                $.jddjFruitHelpList[$.UserName] = true;
                if (saveRunFlag) $.setdata($.jddjFruitHelpList, 'jddjFruitHelpList');
            } else if (data.code === '-1') {
                console.log(`助力失败`);
                $.canHelp = false;
                $.jddjFruitHelpList[$.UserName] = true;
                if (saveRunFlag) $.setdata($.jddjFruitHelpList, 'jddjFruitHelpList');
                console.log(JSON.stringify(data));
            } else {
                console.log(`\n`);
                console.log(JSON.stringify(data));
            }

            break;
        default:
            console.log(JSON.stringify(data));
    }
}
async function takeGetRequest(type) {
    let time = Date.now();
    let body = `{}`;
    let functionId = `fruit/${type}`;
    let myRequest = ``;
    switch (type) {
        case 'getWaterWheelInfo':
        case 'collectWater':
        case 'getWaterRedPackInfo':
        case 'receiveWaterRedPack':
        case 'getWaterBottleInfo':
        case 'receiveWaterBottle':
            body = `{}`;
            functionId = `fruit/${type}`;
            break;
        case 'list':
            body = `{"modelId":"${$.modelId}","plateCode":4}`;
            functionId = `task/${type}`;
            break;
        case 'userSigninNew':
            body = `{"channel":"daojiaguoyuan","cityId":"${$.cityId}","longitude":${$.lng},"latitude":${$.lat},"ifCic":0}`
            functionId = `signin/${type}`;
            break;
        case 'finished':
        case 'received':
        case 'sendPrize':
            body = `{"modelId":"${$.modelId}","taskId":"${$.oneTask.taskId}","taskType":${$.oneTask.taskType},"plateCode":1,"subNode":null}`;
            functionId = `task/${type}`;
            break;
        case 'help':
            body = `{"modelId":"${$.modelId}","taskType":1201,"taskId":"23eee1c043c01bc","plateCode":5,"assistTargetPin":"${$.oneInvite['userPin']}","uniqueId":"${$.oneInvite['uniqueId']}"}`;
            functionId = `task/finished`;
            break;
        default:
            console.log(`错误${type}`);
    }
    let bodyInfo = {
        'functionId':functionId,
        'isNeedDealError':'true',
        'body':body,
        'lat':$.lat,
        'lng':$.lng,
        'lat_pos':$.lat,
        'lng_pos':$.lng,
        'city_id':$.cityId,
        'channel':'rn',
        'platform':'6.6.0',
        'platCode':'h5',
        'appVersion':'6.6.0',
        'appName':'paidaojia',
        'deviceModel':'appmodel',
        'traceId':`${$.token}${time}`,
        'deviceToken':$.token,
        'deviceId':$.token,
        '_jdrandom':time,
        '_funid_':functionId
    }
    body = getbody(bodyInfo);
    myRequest =  await getMyRequestGet(body,functionId,time);
    return new Promise(async resolve => {
        $.get(myRequest, (err, resp, data) => {
            try {
                dealReturn(type, data);
            } catch (e) {console.log(data);$.logErr(e, resp)} finally {resolve();}
        });
    })
}
async function takePostRequest(type) {
    let time = Date.now();
    let url = ``;
    let myRequest = ``;
    let body = ``;
    switch (type) {
        case 'initFruit':
            body = `{"cityId":"${$.cityId}","longitude":${$.lng},"latitude":${$.lat}}`;
            break;
        case 'watering':
            body = `{"waterTime":${$.waterTime}}`
            break;
        default:
            console.log(`错误${type}`);
    }
    let bodyInfo = {
        'functionId':`fruit/${type}`,
        'isNeedDealError':'true',
        'method':'POST',
        'body':body,
        'lat':$.lat,
        'lng':$.lng,
        'lat_pos':$.lat,
        'lng_pos':$.lng,
        'city_id':$.cityId,
        'channel':'rn',
        'platform':'6.6.0',
        'platCode':'h5',
        'appVersion':'6.6.0',
        'appName':'paidaojia',
        'deviceModel':'appmodel',
        'traceId':`${$.token}${time}`,
        'deviceToken':$.token,
        'deviceId':$.token,
        '_jdrandom':time,
        '_funid_':`fruit/${type}`
    }
    body = getbody(bodyInfo);
    url = `https://daojia.jd.com/client?_jdrandom=${time}&_funid_=fruit/${type}`;
    myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dealReturn(type, data);
            } catch (e) {console.log(data);$.logErr(e, resp)} finally {resolve();}
        });
    })
}
function getbody(bodyInfo) {
    let body = objectToQueryString(bodyInfo);
    let arr = decodeURIComponent(body).split('&');
    let json = {}, keys = [], sortVlaues = [];
    for (const o of arr) {
        let c = o.split('=');
        if (!!c[1] && c[0] != 'functionId' && c[0] != 'signKeyV1') {
            json[c[0]] = c[1];
            keys.push(c[0])
        }
    }
    keys = keys.sort();
    keys.forEach(element => {
        sortVlaues.push(json[element])
    });
    const secret = "923047ae3f8d11d8b19aeb9f3d1bc200";
    let cryptoContent = hex_hmac_sha256(secret, sortVlaues.join('&'));
    return body + '&signKeyV1=' + cryptoContent;
}
function objectToQueryString(obj) {
    return Object.keys(obj).map(function (key) {
        return "".concat(encodeURIComponent(key), "=").concat(encodeURIComponent(obj[key]));
    }).join('&');
}
function getPostRequest(url, body){
    let headers= {
        'Host': 'daojia.jd.com',
        'Content-Type': 'application/x-www-form-urlencoded;',
        'Origin': 'https://daojia.jd.com',
        'Cookie': $.jddjCookie,
        'Connection': 'keep-alive',
        'Accept': '*/*',
        "User-Agent": $.ua,
        'Accept-Language': 'zh-cn'
    };
    return {url: url,  headers: headers,body:body};
}
async function getMyRequestGet(body,functionId,time){
    let url = `https://daojia.jd.com/client?_jdrandom=${time}&_funid_=${functionId}&${body}`
    const headers = {
        'Host': 'daojia.jd.com',
        'Content-Type': 'application/x-www-form-urlencoded;',
        'Origin': 'https://daojia.jd.com',
        'Cookie': $.jddjCookie,
        'Connection': 'keep-alive',
        'Accept': '*/*',
        'User-Agent': $.ua,
        'Accept-Language': 'zh-cn'
    };
    return  {url: url,headers: headers} ;
}
function getRandomArrayElements(arr, count) {
    var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {index = Math.floor((i + 1) * Math.random());temp = shuffled[index];shuffled[index] = shuffled[i];shuffled[i] = temp;}
    return shuffled.slice(min);
}
function getCurrDate() {
    let date = new Date();
    let sep = "-";
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month <= 9) {
        month = "0" + month;
    }
    if (day <= 9) {
        day = "0" + day;
    }
    return year + sep + month + sep + day;
}
// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="boxJddj.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
/*********************************** SHA256 *************************************/
var hexcase=0;var b64pad="";function hex_sha256(s){return rstr2hex(rstr_sha256(str2rstr_utf8(s)))}function b64_sha256(s){return rstr2b64(rstr_sha256(str2rstr_utf8(s)))}function any_sha256(s,e){return rstr2any(rstr_sha256(str2rstr_utf8(s)),e)}function hex_hmac_sha256(k,d){return rstr2hex(rstr_hmac_sha256(str2rstr_utf8(k),str2rstr_utf8(d)))}function b64_hmac_sha256(k,d){return rstr2b64(rstr_hmac_sha256(str2rstr_utf8(k),str2rstr_utf8(d)))}function any_hmac_sha256(k,d,e){return rstr2any(rstr_hmac_sha256(str2rstr_utf8(k),str2rstr_utf8(d)),e)}function sha256_vm_test(){return hex_sha256("abc").toLowerCase()=="ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"}function rstr_sha256(s){return binb2rstr(binb_sha256(rstr2binb(s),s.length*8))}function rstr_hmac_sha256(key,data){var bkey=rstr2binb(key);if(bkey.length>16)bkey=binb_sha256(bkey,key.length*8);var ipad=Array(16),opad=Array(16);for(var i=0;i<16;i++){ipad[i]=bkey[i]^0x36363636;opad[i]=bkey[i]^0x5C5C5C5C}var hash=binb_sha256(ipad.concat(rstr2binb(data)),512+data.length*8);return binb2rstr(binb_sha256(opad.concat(hash),512+256))}function rstr2hex(input){try{hexcase}catch(e){hexcase=0}var hex_tab=hexcase?"0123456789ABCDEF":"0123456789abcdef";var output="";var x;for(var i=0;i<input.length;i++){x=input.charCodeAt(i);output+=hex_tab.charAt((x>>>4)&0x0F)+hex_tab.charAt(x&0x0F)}return output}function rstr2b64(input){try{b64pad}catch(e){b64pad=''}var tab="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var output="";var len=input.length;for(var i=0;i<len;i+=3){var triplet=(input.charCodeAt(i)<<16)|(i+1<len?input.charCodeAt(i+1)<<8:0)|(i+2<len?input.charCodeAt(i+2):0);for(var j=0;j<4;j++){if(i*8+j*6>input.length*8)output+=b64pad;else output+=tab.charAt((triplet>>>6*(3-j))&0x3F)}}return output}function rstr2any(input,encoding){var divisor=encoding.length;var remainders=Array();var i,q,x,quotient;var dividend=Array(Math.ceil(input.length/2));for(i=0;i<dividend.length;i++){dividend[i]=(input.charCodeAt(i*2)<<8)|input.charCodeAt(i*2+1)}while(dividend.length>0){quotient=Array();x=0;for(i=0;i<dividend.length;i++){x=(x<<16)+dividend[i];q=Math.floor(x/divisor);x-=q*divisor;if(quotient.length>0||q>0)quotient[quotient.length]=q}remainders[remainders.length]=x;dividend=quotient}var output="";for(i=remainders.length-1;i>=0;i--)output+=encoding.charAt(remainders[i]);var full_length=Math.ceil(input.length*8/(Math.log(encoding.length)/Math.log(2)));for(i=output.length;i<full_length;i++)output=encoding[0]+output;return output}function str2rstr_utf8(input){var output="";var i=-1;var x,y;while(++i<input.length){x=input.charCodeAt(i);y=i+1<input.length?input.charCodeAt(i+1):0;if(0xD800<=x&&x<=0xDBFF&&0xDC00<=y&&y<=0xDFFF){x=0x10000+((x&0x03FF)<<10)+(y&0x03FF);i++}if(x<=0x7F)output+=String.fromCharCode(x);else if(x<=0x7FF)output+=String.fromCharCode(0xC0|((x>>>6)&0x1F),0x80|(x&0x3F));else if(x<=0xFFFF)output+=String.fromCharCode(0xE0|((x>>>12)&0x0F),0x80|((x>>>6)&0x3F),0x80|(x&0x3F));else if(x<=0x1FFFFF)output+=String.fromCharCode(0xF0|((x>>>18)&0x07),0x80|((x>>>12)&0x3F),0x80|((x>>>6)&0x3F),0x80|(x&0x3F))}return output}function str2rstr_utf16le(input){var output="";for(var i=0;i<input.length;i++)output+=String.fromCharCode(input.charCodeAt(i)&0xFF,(input.charCodeAt(i)>>>8)&0xFF);return output}function str2rstr_utf16be(input){var output="";for(var i=0;i<input.length;i++)output+=String.fromCharCode((input.charCodeAt(i)>>>8)&0xFF,input.charCodeAt(i)&0xFF);return output}function rstr2binb(input){var output=Array(input.length>>2);for(var i=0;i<output.length;i++)output[i]=0;for(var i=0;i<input.length*8;i+=8)output[i>>5]|=(input.charCodeAt(i/8)&0xFF)<<(24-i%32);return output}function binb2rstr(input){var output="";for(var i=0;i<input.length*32;i+=8)output+=String.fromCharCode((input[i>>5]>>>(24-i%32))&0xFF);return output}function sha256_S(X,n){return(X>>>n)|(X<<(32-n))}function sha256_R(X,n){return(X>>>n)}function sha256_Ch(x,y,z){return((x&y)^((~x)&z))}function sha256_Maj(x,y,z){return((x&y)^(x&z)^(y&z))}function sha256_Sigma0256(x){return(sha256_S(x,2)^sha256_S(x,13)^sha256_S(x,22))}function sha256_Sigma1256(x){return(sha256_S(x,6)^sha256_S(x,11)^sha256_S(x,25))}function sha256_Gamma0256(x){return(sha256_S(x,7)^sha256_S(x,18)^sha256_R(x,3))}function sha256_Gamma1256(x){return(sha256_S(x,17)^sha256_S(x,19)^sha256_R(x,10))}function sha256_Sigma0512(x){return(sha256_S(x,28)^sha256_S(x,34)^sha256_S(x,39))}function sha256_Sigma1512(x){return(sha256_S(x,14)^sha256_S(x,18)^sha256_S(x,41))}function sha256_Gamma0512(x){return(sha256_S(x,1)^sha256_S(x,8)^sha256_R(x,7))}function sha256_Gamma1512(x){return(sha256_S(x,19)^sha256_S(x,61)^sha256_R(x,6))}var sha256_K=new Array(1116352408,1899447441,-1245643825,-373957723,961987163,1508970993,-1841331548,-1424204075,-670586216,310598401,607225278,1426881987,1925078388,-2132889090,-1680079193,-1046744716,-459576895,-272742522,264347078,604807628,770255983,1249150122,1555081692,1996064986,-1740746414,-1473132947,-1341970488,-1084653625,-958395405,-710438585,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,-2117940946,-1838011259,-1564481375,-1474664885,-1035236496,-949202525,-778901479,-694614492,-200395387,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,-2067236844,-1933114872,-1866530822,-1538233109,-1090935817,-965641998);function binb_sha256(m,l){var HASH=new Array(1779033703,-1150833019,1013904242,-1521486534,1359893119,-1694144372,528734635,1541459225);var W=new Array(64);var a,b,c,d,e,f,g,h;var i,j,T1,T2;m[l>>5]|=0x80<<(24-l%32);m[((l+64>>9)<<4)+15]=l;for(i=0;i<m.length;i+=16){a=HASH[0];b=HASH[1];c=HASH[2];d=HASH[3];e=HASH[4];f=HASH[5];g=HASH[6];h=HASH[7];for(j=0;j<64;j++){if(j<16)W[j]=m[j+i];else W[j]=safe_add(safe_add(safe_add(sha256_Gamma1256(W[j-2]),W[j-7]),sha256_Gamma0256(W[j-15])),W[j-16]);T1=safe_add(safe_add(safe_add(safe_add(h,sha256_Sigma1256(e)),sha256_Ch(e,f,g)),sha256_K[j]),W[j]);T2=safe_add(sha256_Sigma0256(a),sha256_Maj(a,b,c));h=g;g=f;f=e;e=safe_add(d,T1);d=c;c=b;b=a;a=safe_add(T1,T2)}HASH[0]=safe_add(a,HASH[0]);HASH[1]=safe_add(b,HASH[1]);HASH[2]=safe_add(c,HASH[2]);HASH[3]=safe_add(d,HASH[3]);HASH[4]=safe_add(e,HASH[4]);HASH[5]=safe_add(f,HASH[5]);HASH[6]=safe_add(g,HASH[6]);HASH[7]=safe_add(h,HASH[7])}return HASH}function safe_add(x,y){var lsw=(x&0xFFFF)+(y&0xFFFF);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xFFFF)}
/*********************************** SHA256 *************************************/
