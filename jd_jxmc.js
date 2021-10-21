/**
 惊喜牧场
 cron 23 0-23/3 * * * https://raw.githubusercontent.com/star261/jd/main/scripts/jd_jxmc.js
 环境变量：JX_USER_AGENT, 惊喜APP的UA。领取助力任务奖励需要惊喜APP的UA,有能力的可以填上自己的UA,默认生成随机UA
 环境变量：BYTYPE,购买小鸡品种，默认不购买,(ps:暂时不知道买哪个好)
 BYTYPE="1",购买小黄鸡，BYTYPE="2",购买辣子鸡，BYTYPE="3",购买椰子鸡,BYTYPE="4",购买猪肚鸡,BYTYPE="999",能买哪只买哪只,BYTYPE="888",不购买小鸡
 脚本9点-10点才会执行内部助力
 */
const $ = new Env('惊喜牧场');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const JXUserAgent =  $.isNode() ? (process.env.JX_USER_AGENT ? process.env.JX_USER_AGENT : ``):``;
const ByType = $.isNode() ? (process.env.BYTYPE ? process.env.BYTYPE : `888`):`888`;
let cookiesArr = [],token = {},ua = '';
$.appId = 10028;
let activeid = 'null';
$.inviteCodeList = [];
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
    };
} else {
    cookiesArr = [
        $.getdata("CookieJD"),
        $.getdata("CookieJD2"),
        ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
    $.CryptoJS = require('crypto-js');
    await requestAlgo();
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
        return;
    }
    $.fingerprint = '';$.token = '';
    for (let i = 0; i < cookiesArr.length; i++) {
        $.index = i + 1;
        $.cookie = cookiesArr[i];
        $.isLogin = true;
        $.nickName = '';
        $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        await TotalBean();
        console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
        if (!$.isLogin) {
            $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
            if ($.isNode()) {
                await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
            }
            continue
        }
        try {
            await main();
        } catch (e) {
            $.logErr(e)
        }
        await $.wait(2000);
    }
    if(new Date().getHours() !== 9 && new Date().getHours() !== 10){
        console.log('\n脚本早上9点到10点直接执行，才会执行账号内互助');
        return ;
    }
    console.log('\n##################开始账号内互助#################\n');
    for (let j = 0; j < cookiesArr.length; j++) {
        $.cookie = cookiesArr[j];
        $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1]);
        token = await getJxToken();
        $.canHelp = true;
        for (let k = 0; k < $.inviteCodeList.length; k++) {
            $.oneCodeInfo = $.inviteCodeList[k];
            activeid = $.oneCodeInfo.activeid;
            if($.oneCodeInfo.use === $.UserName) continue;
            if (!$.canHelp) break;
            console.log(`\n${$.UserName}去助力${$.oneCodeInfo.use},助力码：${$.oneCodeInfo.code}\n`);
            let helpInfo = await takeRequest(`jxmc`,`operservice/EnrollFriend`,`&sharekey=${$.oneCodeInfo.code}`,`activeid%2Cactivekey%2Cchannel%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Csharekey%2Ctimestamp`,true);
            if ( helpInfo && helpInfo.result === 0 ) {
                console.log(`助力成功`);
            }else if (helpInfo && helpInfo.result === 4){
                console.log(`助力次数已用完`);
                $.canHelp = false;
            }else if(helpInfo && helpInfo.result === 5){
                console.log(`已助力过`);
                //$.oneCodeInfo.max = true;
            }else{
                console.log(`助力失败，可能此账号不能助力别人`);
                //console.log(JSON.stringify(data))
                $.canHelp = false;
            }
            await $.wait(2000);
        }
    }
})().catch((e) => {$.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')}).finally(() => {$.done();})

async function main() {
    ua = '';
    if(JXUserAgent){
        ua = JXUserAgent;
    }else{
        ua = `jdpingou;iPhone;4.9.4;14.6;${randomWord(false,40,40)};network/wifi;model/iPhone9,2;appBuild/100579;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/936;pap/JA2019_3111800;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E200`;
    }
    token = await getJxToken();
    activeid = 'null';
    let configInfo = await takeRequest(`jxmc`,`queryservice/GetConfigInfo`,``,undefined,true);
    let homePageInfo = await takeRequest(`jxmc`,`queryservice/GetHomePageInfo`,`&isgift=1&isquerypicksite=1&isqueryinviteicon=1`,`activeid%2Cactivekey%2Cchannel%2Cisgift%2Cisqueryinviteicon%2Cisquerypicksite%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp`,true);
    activeid = homePageInfo.activeid;
    let cardInfo = await takeRequest(`jxmc`,`queryservice/GetCardInfo`,``,undefined,true);
    let signInfo = await takeRequest(`jxmc`,`queryservice/GetSignInfo`,``,undefined,true);
    let visitBackInfo = await takeRequest(`jxmc`,`queryservice/GetVisitBackInfo`,``,undefined,true);
    if(JSON.stringify(configInfo) === '{}' || JSON.stringify(homePageInfo) === '{}'){
        console.log(`初始化失败,可能是牧场黑号`);
        return ;
    }
    if(homePageInfo.maintaskId !== 'pause'){
        let runTime = 0;
        let doMainTaskInfo = {};
        do {
            await $.wait(2000);
            console.log(`\n执行初始化任务：${homePageInfo.maintaskId}`);
            doMainTaskInfo = await takeRequest(`jxmc`,`operservice/DoMainTask`,`&step=${homePageInfo.maintaskId}`,`activeid%2Cactivekey%2Cchannel%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Cstep%2Ctimestamp`,true);
            console.log(`执行结果：\n${JSON.stringify(doMainTaskInfo)}`);
            await $.wait(2000);
            homePageInfo = await takeRequest(`jxmc`,`queryservice/GetHomePageInfo`,`&isgift=1&isquerypicksite=1&isqueryinviteicon=1`,`activeid%2Cactivekey%2Cchannel%2Cisgift%2Cisqueryinviteicon%2Cisquerypicksite%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp`,true);
            runTime++;
        }while (homePageInfo.maintaskId !== 'pause' && runTime<30 && JSON.stringify(doMainTaskInfo) !== '{}');
    }
    let petidList = [];
    for (let i = 0; i < homePageInfo.petinfo.length; i++) {
        let onepetInfo = homePageInfo.petinfo[i];
        petidList.push(onepetInfo.petid);
        if (onepetInfo.cangetborn === 1) {
            console.log(`开始收鸡蛋`);
            let getEggInfo = await takeRequest(`jxmc`,`operservice/GetSelfResult`,`&type=11&itemid=${onepetInfo.petid}`,`activeid%2Cactivekey%2Cchannel%2Citemid%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp%2Ctype`,true);
            console.log(`成功收取${getEggInfo.addnum || null}个蛋,现有鸡蛋${getEggInfo.newnum || null}个`);
            await $.wait(1000);
        }
    }
    if (!homePageInfo.petinfo) {
        console.log(`\n温馨提示：${$.UserName} 请先手动完成【新手指导任务】再运行脚本再运行脚本\n`);
        return;
    }
    console.log(`获取获得详情成功,总共有小鸡：${petidList.length}只,鸡蛋:${homePageInfo.eggcnt}个,金币:${homePageInfo.coins},互助码：${homePageInfo.sharekey}`);
    $.inviteCodeList.push({'use':$.UserName,'code':homePageInfo.sharekey,'max':false,'activeid':activeid});
    if(JSON.stringify(visitBackInfo) !== '{}'){
        if(visitBackInfo.iscandraw === 1){
            console.log(`\n收取每日白菜`);
            await $.wait(1000);
            let getVisitBackCabbageInfo = await takeRequest(`jxmc`,`operservice/GetVisitBackCabbage`,``,undefined,true);
            console.log(`收取白菜成功，获得${getVisitBackCabbageInfo.drawnum}`);
        }else{
            console.log(`明日可收取白菜：${visitBackInfo.candrawnum}颗`);
        }
    }
    if(JSON.stringify(signInfo) !== '{}'){
        if(signInfo.signlist){
            let signList = signInfo.signlist;
            let signFlag = true;
            for (let j = 0; j < signList.length; j++) {
                if(signList[j].fortoday && !signList[j].hasdone){
                    await $.wait(1000);
                    console.log(`\n去签到`);
                    await takeRequest(`jxmc`,`operservice/GetSignReward`,`&currdate=${signInfo.currdate}`,`activeid%2Cactivekey%2Cchannel%2Ccurrdate%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp`,true);
                    console.log(`签到成功`);
                    signFlag = false;
                }
            }
            if(signFlag){
                console.log(`已完成每日签到`);
            }
        }
    }
    if (homePageInfo.cow) {
        let cowToken = ''
        if(homePageInfo.cow.lastgettime){
            cowToken = $.CryptoJS.MD5(homePageInfo.cow.lastgettime.toString()).toString();
        }else{
            cowToken = $.CryptoJS.MD5(Date.now().toString());
        }
        console.log('\n收奶牛金币');
        let cowInfo = await takeRequest(`jxmc`,`operservice/GetCoin`,`&token=${cowToken}`,`activeid%2Cactivekey%2Cchannel%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp%2Ctoken`,true);
        console.log(`获得金币：${cowInfo.addcoin || 0}`);
        await $.wait(1000);
    }
    if(JSON.stringify(cardInfo) !== '{}'){
        console.log(`\n可以扭蛋次数：${cardInfo.times}`);
        for (let j = 0; j < cardInfo.times; j++) {
            await $.wait(2000);
            console.log(`执行一次扭蛋`);
            let drawCardInfo = await takeRequest(`jxmc`,`operservice/DrawCard`,``,undefined,true);
            if(drawCardInfo.prizetype === 3){
                console.log(`获得金币：${drawCardInfo.addcoins || 0 }`);
            }else if(drawCardInfo.prizetype === 2){
                console.log(`获得红包`);
            }else{
                console.log(`获得其他`);
                console.log(JSON.stringify(drawCardInfo));
            }
        }
    }
    //购买小鸡
    await buyChick(configInfo,homePageInfo,cardInfo);
    await doTask();
    await $.wait(2000);
    await doMotion(petidList);
    await buyCabbage(homePageInfo);
    await feed();
}

async function buyChick(configInfo,homePageInfo,cardInfo){
    console.log(`现共有小鸡：${homePageInfo.petinfo.length}只,小鸡上限：6只`);
    if(homePageInfo.petinfo.length === 6){
        return;
    }
    if(ByType === '888'){
        console.log(`不购买小鸡，若需要购买小鸡，则设置环境变量【BYTYPE】`);
        return;
    }
    if(ByType === '4' || ByType === '999'){
        if(Number(homePageInfo.coins) >= configInfo.operation.zhuduji_buy_need_coin){
            console.log(`购买猪肚鸡`);
            let newbuyInfo = await takeRequest(`jxmc`,`operservice/BuyNew`,`&type=4`,`activeid%2Cactivekey%2Cchannel%2Csceneid%2Ctype`,true);
            console.log(`购买猪肚鸡成功，消耗金币：${newbuyInfo.costcoin || null}，当前小鸡数量：${newbuyInfo.currnum || null}`);
            homePageInfo.coins = Number(homePageInfo.coins) - Number(configInfo.operation.zhuduji_buy_need_coin);
        }else{
            console.log(`购买猪肚鸡金币不足，当前金币：${homePageInfo.coins},需要金币：${configInfo.operation.zhuduji_buy_need_coin}`);
        }
    }
    if(ByType === '3' || ByType === '999'){
        if(Number(homePageInfo.coins) >= configInfo.operation.yeziji_buy_need_coin){
            console.log(`购买椰子鸡`);
            let newbuyInfo = await takeRequest(`jxmc`,`operservice/BuyNew`,`&type=3`,`activeid%2Cactivekey%2Cchannel%2Csceneid%2Ctype`,true);
            console.log(`购买椰子鸡成功，消耗金币：${newbuyInfo.costcoin || null}，当前小鸡数量：${newbuyInfo.currnum || null}`);
            homePageInfo.coins = Number(homePageInfo.coins) - Number(configInfo.operation.yeziji_buy_need_coin);
        }else{
            console.log(`购买椰子鸡金币不足，当前金币：${homePageInfo.coins},需要金币：${configInfo.operation.yeziji_buy_need_coin}`);
        }
    }
    if(ByType === '2' || ByType === '999'){
        if(Number(homePageInfo.coins) >= configInfo.operation.laziji_buy_need_coin){
            console.log(`购买辣子鸡`);
            let newbuyInfo = await takeRequest(`jxmc`,`operservice/BuyNew`,`&type=2`,`activeid%2Cactivekey%2Cchannel%2Csceneid%2Ctype`,true);
            console.log(`购买辣子鸡成功，消耗金币：${newbuyInfo.costcoin || null}，当前小鸡数量：${newbuyInfo.currnum || null}`);
            homePageInfo.coins = Number(homePageInfo.coins) - Number(configInfo.operation.laziji_buy_need_coin);
        }else{
            console.log(`购买辣子鸡金币不足，当前金币：${homePageInfo.coins},需要金币：${configInfo.operation.laziji_buy_need_coin}`);
        }
    }
    if(ByType === '1' || ByType === '999'){
        if(Number(homePageInfo.coins) >= configInfo.operation.huangji_buy_need_coin){
            console.log(`购买小黄鸡`);
            let newbuyInfo = await takeRequest(`jxmc`,`operservice/BuyNew`,`&type=1`,`activeid%2Cactivekey%2Cchannel%2Csceneid%2Ctype`,true);
            console.log(`购买小黄鸡成功，消耗金币：${newbuyInfo.costcoin || null}，当前小鸡数量：${newbuyInfo.currnum || null}`);
            homePageInfo.coins = Number(homePageInfo.coins) - Number(configInfo.operation.huangji_buy_need_coin);
        }else{
            console.log(`购买小黄鸡金币不足，当前金币：${homePageInfo.coins},需要金币：${configInfo.operation.huangji_buy_need_coin}`);
        }
    }
}
async function feed(){
    let homePageInfo = await takeRequest(`jxmc`,`queryservice/GetHomePageInfo`,`&isgift=1&isquerypicksite=1&isqueryinviteicon=1`,`activeid%2Cactivekey%2Cchannel%2Cisgift%2Cisqueryinviteicon%2Cisquerypicksite%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp`,true);
    let materialinfoList = homePageInfo.materialinfo;
    for (let j = 0; j < materialinfoList.length; j++) {
        if (materialinfoList[j].type !== 1) {
            continue;
        }
        let pause = false;
        if (Number(materialinfoList[j].value) > 10) {
            let canFeedTimes = Math.floor(Number(materialinfoList[j].value) / 10);
            console.log(`\n共有白菜${materialinfoList[j].value}颗，每次喂10颗，可以喂${canFeedTimes}次,每次执行脚本最多会喂40次`);
            let runFeed = true;
            for (let k = 0; k < canFeedTimes && runFeed && k < 40; k++) {
                pause = false;
                console.log(`开始第${k + 1}次喂白菜`);
                let feedInfo = await takeRequest(`jxmc`,`operservice/Feed`,``,undefined,true);
                if (feedInfo.ret === 0) {
                    console.log(`投喂成功`);
                } else if (feedInfo.ret === 2020) {
                    console.log(`投喂失败，需要先收取鸡蛋`);
                    pause = true;
                } else {
                    console.log(`投喂失败，${feedInfo.message}`);
                    runFeed = false;
                }
                await $.wait(4000);
                if (pause) {
                    homePageInfo = await takeRequest(`jxmc`,`queryservice/GetHomePageInfo`,`&isgift=1&isquerypicksite=1&isqueryinviteicon=1`,`activeid%2Cactivekey%2Cchannel%2Cisgift%2Cisqueryinviteicon%2Cisquerypicksite%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp`,true);
                    await $.wait(1000);
                    for (let n = 0; n < homePageInfo.petinfo.length; n++) {
                        let onepetInfo = homePageInfo.petinfo[n];
                        if (onepetInfo.cangetborn === 1) {
                            console.log(`开始收鸡蛋`);
                            let getEggInfo = await takeRequest(`jxmc`,`operservice/GetSelfResult`,`&type=11&itemid=${onepetInfo.petid}`,`activeid%2Cactivekey%2Cchannel%2Citemid%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp%2Ctype`,true);
                            console.log(`成功收取${getEggInfo.addnum || null}个蛋,现有鸡蛋${getEggInfo.newnum || null}个`);
                            await $.wait(1000);
                        }
                    }
                }
            }
        }
    }
}

async function buyCabbage(homePageInfo){
    let materialNumber = 0;
    let materialinfoList = homePageInfo.materialinfo;
    for (let j = 0; j < materialinfoList.length; j++) {
        if (materialinfoList[j].type !== 1) {
            continue;
        }
        materialNumber = Number(materialinfoList[j].value);//白菜数量
    }
    console.log(`\n共有金币${homePageInfo.coins}`);
    if (Number(homePageInfo.coins) > 5000) {
        let canBuyTimes = Math.floor(Number(homePageInfo.coins) / 5000);
        if(Number(materialNumber) < 400){
            for (let j = 0; j < canBuyTimes && j < 4; j++) {
                console.log(`第${j + 1}次购买白菜`);
                let buyInfo = await takeRequest(`jxmc`,`operservice/Buy`,`&type=1`,`activeid%2Cactivekey%2Cchannel%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp%2Ctype`,true);
                console.log(`购买成功，当前有白菜：${buyInfo.newnum}颗`);
                await $.wait(2000);
            }
            await $.wait(2000);
        }else{
            console.log(`现有白菜${materialNumber},大于400颗,不进行购买`);
        }
    }
}

async function doMotion(petidList){
    //割草
    console.log(`\n开始进行割草`);
    let runFlag = true;
    for (let i = 0; i < 20 && runFlag; i++) {
        $.mowingInfo = {};
        console.log(`开始第${i + 1}次割草`);
        let mowingInfo = await takeRequest(`jxmc`,`operservice/Action`,`&type=2`,'activeid%2Cactivekey%2Cchannel%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp%2Ctype',true);
        console.log(`获得金币：${mowingInfo.addcoins || 0}`);
        await $.wait(1000);
        if(Number(mowingInfo.addcoins) >0 ){
            runFlag = true;
        }else{
            runFlag = false;
            console.log(`未获得金币暂停割草`);
        }
        if (mowingInfo.surprise === true) {
            //除草礼盒
            console.log(`领取除草礼盒`);
            let GetSelfResult = await takeRequest(`jxmc`,`operservice/GetSelfResult`,`&type=14&itemid=undefined`,`activeid%2Cactivekey%2Cchannel%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp%2Ctype`,true);
            console.log(`打开除草礼盒成功`);
            console.log(JSON.stringify(GetSelfResult));
            await $.wait(3000);
        }
    }
    //横扫鸡腿
    runFlag = true;
    console.log(`\n开始进行横扫鸡腿`);
    for (let i = 0; i < 20 && runFlag; i++) {
        console.log(`开始第${i + 1}次横扫鸡腿`);
        let sar = Math.floor((Math.random() * petidList.length));
        let jumoInfo = await takeRequest(`jxmc`,`operservice/Action`,`&type=1&petid=${petidList[sar]}`,'activeid%2Cactivekey%2Cchannel%2Cjxmc_jstoken%2Cpetid%2Cphoneid%2Csceneid%2Ctimestamp%2Ctype',true);
        console.log(`获得金币：${jumoInfo.addcoins || 0}`);
        if(Number(jumoInfo.addcoins) >0 ){
            runFlag = true;
        }else{
            runFlag = false;
            console.log(`未获得金币暂停割鸡腿`);
        }
        await $.wait(1000);
    }
}
async function doTask(){
    console.log(`\n开始执行日常任务`);
    let taskLiskInfo = await takeRequest(`newtasksys`,`newtasksys_front/GetUserTaskStatusList`,`&source=jxmc&bizCode=jxmc&dateType=&showAreaTaskFlag=0&jxpp_wxapp_type=7`,`bizCode%2CdateType%2Cjxpp_wxapp_type%2CshowAreaTaskFlag%2Csource`,false);
    let taskLisk = taskLiskInfo.userTaskStatusList;
    let awardInfo = {};
    for (let i = 0; i < taskLisk.length; i++) {
        let oneTask = taskLisk[i];
        if (oneTask.dateType === 1) {//成就任务
            if (oneTask.awardStatus === 2 && oneTask.completedTimes === oneTask.targetTimes) {
                console.log(`完成任务：${oneTask.taskName}`);
                awardInfo = await takeRequest(`newtasksys`,`newtasksys_front/Award`,`source=jxmc&taskId=${oneTask.taskId}&bizCode=jxmc`,`bizCode%2Csource%2CtaskId`,true);
                console.log(`领取金币成功，获得${JSON.parse(awardInfo.prizeInfo).prizeInfo}`);
                await $.wait(2000);
            }
        } else {//每日任务
            if(oneTask.awardStatus === 1){
                console.log(`任务：${oneTask.taskName},已完成`);
            }else if(oneTask.taskType === 4){
                if(oneTask.awardStatus === 2 && oneTask.completedTimes === oneTask.targetTimes){
                    console.log(`完成任务：${oneTask.taskName}`);
                    awardInfo = await takeRequest(`newtasksys`,`newtasksys_front/Award`,`source=jxmc&taskId=${oneTask.taskId}&bizCode=jxmc`,`bizCode%2Csource%2CtaskId`,true);
                    console.log(`领取金币成功，获得${JSON.parse(awardInfo.prizeInfo).prizeInfo}`);
                    await $.wait(2000);
                }else {
                    console.log(`任务：${oneTask.taskName},未完成`);
                }
            }else if (oneTask.awardStatus === 2 && oneTask.taskCaller === 1) {//浏览任务
                if (Number(oneTask.completedTimes) > 0 && oneTask.completedTimes === oneTask.targetTimes) {
                    console.log(`完成任务：${oneTask.taskName}`);
                    awardInfo = await takeRequest(`newtasksys`,`newtasksys_front/Award`,`source=jxmc&taskId=${oneTask.taskId}&bizCode=jxmc`,`bizCode%2Csource%2CtaskId`,true);
                    console.log(`领取金币成功，获得${JSON.parse(awardInfo.prizeInfo).prizeInfo}`);
                    await $.wait(2000);
                }
                for (let j = Number(oneTask.completedTimes); j < Number(oneTask.configTargetTimes); j++) {
                    console.log(`去做任务：${oneTask.description}，等待5S`);
                    awardInfo = await takeRequest(`newtasksys`,`newtasksys_front/DoTask`,`source=jxmc&taskId=${oneTask.taskId}&bizCode=jxmc&configExtra=`,`bizCode%2CconfigExtra%2Csource%2CtaskId`,false);
                    await $.wait(5500);
                    console.log(`完成任务：${oneTask.description}`);
                    awardInfo = await takeRequest(`newtasksys`,`newtasksys_front/Award`,`source=jxmc&taskId=${oneTask.taskId}&bizCode=jxmc`,`bizCode%2Csource%2CtaskId`,true);
                    console.log(`领取金币成功，获得${JSON.parse(awardInfo.prizeInfo).prizeInfo}`);
                }
            } else if (oneTask.awardStatus === 2 && oneTask.completedTimes === oneTask.targetTimes) {
                console.log(`完成任务：${oneTask.taskName}`);
                awardInfo = await takeRequest(`newtasksys`,`newtasksys_front/Award`,`source=jxmc&taskId=${oneTask.taskId}&bizCode=jxmc`,`bizCode%2Csource%2CtaskId`,true);
                console.log(`领取金币成功，获得${JSON.parse(awardInfo.prizeInfo).prizeInfo}`);
                await $.wait(2000);
            }
        }
    }

}
async function takeRequest(type,functionId,info,stk='activeid%2Cactivekey%2Cchannel%2Cjxmc_jstoken%2Cphoneid%2Csceneid%2Ctimestamp',jxTokenFlag){
    let url = '';
    if(type === 'jxmc'){
        url = `https://m.jingxi.com/${type}/${functionId}?channel=7&sceneid=1001&activeid=${activeid}&activekey=null${info}`;

    }else if(type === 'newtasksys'){
        url = `https://m.jingxi.com/${type}/${functionId}?${info}`;
    }
    if(jxTokenFlag){
        url += `&jxmc_jstoken=${token.farm_jstoken}&timestamp=${token.timestamp}&phoneid=${token.phoneid}`;
    }
    if(stk){
        url += `&_stk=${stk}`;
    }
    url += `&_ste=1&h5st=${decrypt(url)}&_=${Date.now()}&sceneval=2&g_login_type=1&g_ty=ls`;
    let myRequest = {
        url: url,
        headers: {
            'Origin': `https://st.jingxi.com`,
            'Cookie': $.cookie,
            'Connection': `keep-alive`,
            'Accept': `application/json`,
            'Referer': `https://st.jingxi.com/pingou/jxmc/index.html`,
            'Host': `m.jingxi.com`,
            'User-Agent':ua,
            'Accept-Encoding': `gzip, deflate, br`,
            'Accept-Language': `zh-cn`
        }
    };
    return new Promise(async resolve => {
        $.get(myRequest, (err, resp, data) => {
            try {
                if(err){
                    console.log(err);
                }else{
                    data = JSON.parse(data);
                }
            } catch (e) {
                console.log(data);
                $.logErr(e, resp)
            } finally {
                if(functionId === 'operservice/Feed'){
                    resolve(data || {});
                }else{
                    resolve(data.data || {});
                }
            }
        })
    })
}
function randomWord(randomFlag, min, max){
    var str = "",
        range = min,
        arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    // 随机产生
    if(randomFlag){
        range = Math.round(Math.random() * (max-min)) + min;
    }
    for(var i=0; i<range; i++){
        pos = Math.round(Math.random() * (arr.length-1));
        str += arr[pos];
    }
    return str;
}


function decrypt(url) {
    let stk = getUrlData(url, '_stk');
    let time = Date.now();
    const timestamp = new Date(time).Format("yyyyMMddhhmmssSSS");
    let hash1 = $.enCryptMethodJD($.token, $.fingerprint.toString(), timestamp.toString(), $.appId.toString(), $.CryptoJS).toString($.CryptoJS.enc.Hex);
    let st = '';
    stk.split(',').map((item, index) => {
        st += `${item}:${getUrlData(url, item)}${index === stk.split(',').length - 1 ? '' : '&'}`;
    })
    const hash2 = $.CryptoJS.HmacSHA256(st, hash1.toString()).toString($.CryptoJS.enc.Hex);
    return encodeURIComponent(["".concat(timestamp.toString()), "".concat($.fingerprint.toString()), "".concat($.appId.toString()), "".concat($.token), "".concat(hash2)].join(";"))
}
function getUrlData(url, name) {
    if (typeof URL !== "undefined") {
        let urls = new URL(url);
        let data = urls.searchParams.get(name);
        return data ? data : '';
    } else {
        const query = url.match(/\?.*/)[0].substring(1)
        const vars = query.split('&')
        for (let i = 0; i < vars.length; i++) {
            const pair = vars[i].split('=')
            if (pair[0] === name) {
                return vars[i].substr(vars[i].indexOf('=') + 1);
            }
        }
        return ''
    }
}
function getJxToken() {
    function uuid(count) {
        let _sym = 'abcdefghijklmnopqrstuvwxyz1234567890';let str = '';
        for(let i = 0; i < count; i++) {str += _sym[parseInt(Math.random() * (_sym.length))];}
        return str;
    }
    let uid = uuid(40);
    let timestamp = (+new Date()).toString();
    let pin = $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1];
    let farm_jstoken = $.CryptoJS.MD5(`${decodeURIComponent(pin)}${timestamp}${uid}tPOamqCuk9NLgVPAljUyIHcPRmKlVxDy`).toString();
    return {"timestamp":timestamp, "phoneid":uid, "farm_jstoken":farm_jstoken};
}
async function requestAlgo() {
    $.fingerprint = await generateFp();
    const options = {
        "url": `https://cactus.jd.com/request_algo?g_ty=ajax`,
        "headers": {
            'Authority': 'cactus.jd.com',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
            'Accept': 'application/json',
            'User-Agent':$.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
            'Content-Type': 'application/json',
            'Origin': 'https://st.jingxi.com',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://st.jingxi.com/',
            'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7'
        },
        'body': JSON.stringify({
            "version": "1.0",
            "fp": $.fingerprint,
            "appId": $.appId.toString(),
            "timestamp": Date.now(),
            "platform": "web",
            "expandParams": ""
        })
    }
    return new Promise(async resolve => {
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`request_algo 签名参数API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['status'] === 200) {
                            $.token = data.data.result.tk;
                            let enCryptMethodJDString = data.data.result.algo;
                            if (enCryptMethodJDString) $.enCryptMethodJD = new Function(`return ${enCryptMethodJDString}`)();
                            console.log(`获取签名参数成功！`)
                        } else {
                            console.log('request_algo 签名参数API请求失败:')
                        }
                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function generateFp() {
    let e = "0123456789";
    let a = 13;
    let i = '';
    for (; a--;)
        i += e[Math.random() * e.length | 0];
    return (i + Date.now()).slice(0, 16)
}
Date.prototype.Format = function (fmt) {
    var e,
        n = this, d = fmt, l = {
            "M+": n.getMonth() + 1,
            "d+": n.getDate(),
            "D+": n.getDate(),
            "h+": n.getHours(),
            "H+": n.getHours(),
            "m+": n.getMinutes(),
            "s+": n.getSeconds(),
            "w+": n.getDay(),
            "q+": Math.floor((n.getMonth() + 3) / 3),
            "S+": n.getMilliseconds()
        };
    /(y+)/i.test(d) && (d = d.replace(RegExp.$1, "".concat(n.getFullYear()).substr(4 - RegExp.$1.length)));
    for (var k in l) {
        if (new RegExp("(".concat(k, ")")).test(d)) {
            var t, a = "S+" === k ? "000" : "00";
            d = d.replace(RegExp.$1, 1 == RegExp.$1.length ? l[k] : ("".concat(a) + l[k]).substr("".concat(l[k]).length))
        }
    }
    return d;
}
function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": $.cookie,
                "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === 13) {
                            $.isLogin = false; //cookie过期
                            return
                        }
                        if (data['retcode'] === 0) {
                            $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
                        } else {
                            $.nickName = $.UserName
                        }
                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
