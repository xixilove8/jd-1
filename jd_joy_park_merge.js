/*
*汪汪乐园合成
* cron  13 0-23/3 * * * jd_joy_park_merge.js
* 请先手动执行初始任务，升到2级后再执行此脚本
* */
const $ = new Env('汪汪乐园合成');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let cookiesArr = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [
    $.getdata("CookieJD"),
    $.getdata("CookieJD2"),
    ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = '';
    await TotalBean();
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
    if (!$.isLogin) {
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
      if ($.isNode()) {
        await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
      }
      continue
    }
    await main();
    await $.wait(2000);
  }

})().catch((e) => {$.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')}).finally(() => {$.done();})

async function main() {
  $.mainInfo = {};
  await takeRequest('joyBaseInfo');
  if(JSON.stringify($.mainInfo) === '{}'){
    console.log(`获取活动详情失败`);
    return ;
  }
  console.log(`当前等级：${$.mainInfo.level}级，拥有金币：${$.joyCoin},当前可购买等级：${$.fastBuyLevel}级，获得离线金币：${$.mainInfo.leaveJoyCoin || 0}`);
  console.log(`助力码：${$.mainInfo.invitePin}`);
  if(Number($.mainInfo.level) === 1){
    console.log(`请先手动执行初始任务，升到2级后再执行此脚本`);
    return;
  }
  await $.wait(2000);
  //await takeRequest('getStaticResource');
  //await takeRequest('treasureShortUrl');
  await takeRequest('gameHeartbeat');
  await $.wait(3000);
  $.joyMergeFlag = false;
  $.joyListFlag = true;
  $.joyListInfo = {};
  let runTime = 0;
  do{
    await dealJoyOne();
    runTime++;
  }while ($.joyMergeFlag && runTime < 10)
  await $.wait(2000);
  $.joyMergeFlag = false;
  runTime = 0;
  do{
    await dealJoyTwo();
    runTime++;
  }while ($.joyMergeFlag && runTime < 10)
  await $.wait(2000);
  runTime = 0;
  if(Number($.joyCoin) > Number($.mainInfo.fastBuyCoin)){
    do{
      await buyJoy();
      await $.wait(2000);
      await dealJoyOne();
      await $.wait(2000);
      await dealJoyTwo();
      await $.wait(2000);
      await takeRequest('joyBaseInfo');
      runTime++;
    }while (Number($.joyCoin) > Number($.mainInfo.fastBuyCoin) && runTime < 30)
  }
  await $.wait(2000);
  await removeJoy();
  //$.taskList = [];
  //await takeRequest('apTaskList');
  //
}

async function removeJoy(){
  if($.joyListFlag) await takeRequest('joyList');
  await $.wait(2000);
  $.joyList = [...$.joyListInfo.activityJoyList];
  $.joyList = $.joyList.sort(function (a, b) {
    return (b.level - a.level);
  })
  for (let i = 0; i < $.joyList.length; i++) {
    for (let j = 0; j < $.joyListInfo.workJoyInfoList.length; j++) {
      if($.joyListInfo.workJoyInfoList[j].unlock && $.joyListInfo.workJoyInfoList[j].joyDTO === null){
        $.joyListInfo.workJoyInfoList[j].joyDTO = '999';
        $.location = $.joyListInfo.workJoyInfoList[j].location;
        $.joyId = $.joyList[i].id;
        console.log(`开始把汪汪【ID：${$.joyId}】移入坑位【${$.location}】`);
        await takeRequest('joyMove');
        await $.wait(2000);
        break;
      }
    }
  }
}
async function dealJoyOne(){
  //await takeRequest('gameHeartbeat');
  //await $.wait(500);
  if($.joyListFlag) await takeRequest('joyList');
  await $.wait(2000);
  //console.log(JSON.stringify($.joyListInfo));
  $.joyList = [...$.joyListInfo.activityJoyList];
  $.joyList = $.joyList.sort(function (a, b) {
    return (a.level - b.level);
  })
  for (let i = 0; i < $.joyList.length - 1; i++) {
    if($.joyList[i].level === $.joyList[i+1].level){
      await joyMerge($.joyList[i],$.joyList[i+1]);
      $.joyListFlag = true;
      i++;
    }
  }
}
async function dealJoyTwo(){
  //await takeRequest('gameHeartbeat');
  //await $.wait(500);
  if($.joyListFlag) await takeRequest('joyList');
  await $.wait(2000);
  //console.log(JSON.stringify($.joyListInfo));
  $.joyList = [...$.joyListInfo.activityJoyList];
  for (let i = 0; i < $.joyListInfo.workJoyInfoList.length; i++) {
    let oneJoy =  $.joyListInfo.workJoyInfoList[i];
    if(oneJoy.unlock && oneJoy.joyDTO ){
      let joyDTO = oneJoy.joyDTO;
      joyDTO['location'] = oneJoy.location;
      $.joyList.push(joyDTO);
    }
  }
  $.joyList = $.joyList.sort(function (a, b) {
    return (a.level - b.level);
  })
  if($.joyList.length>1 && Number($.joyList[0].level)< Number($.fastBuyLevel) && Number($.joyList[0].level) !== Number($.joyList[1].level)){
    let max = $.fastBuyLevel;
    $.fastBuyLevel = $.joyList[0].level;
    console.log(`存在一只低等级汪汪，购买一只相同等级的汪汪进行合成，购买等级为：${$.fastBuyLevel}的汪汪`);
    await buyJoy();
    await $.wait(2000);
    $.fastBuyLevel = max;
  }
  //console.log(`已有汪汪信息\n`+JSON.stringify($.joyList));
  for (let i = 0; i < $.joyList.length - 1; i++) {
    if($.joyList[i].level === $.joyList[i+1].level){
      await joyMerge($.joyList[i],$.joyList[i+1]);
      $.joyListFlag = true;
      i++;
    }
  }
}
async function buyJoy(){
  if($.joyListFlag) await takeRequest('joyList');
  await $.wait(2000);
  $.buyFlag = true;
  for (let i = $.joyListInfo.activityJoyList.length; i <7 && $.buyFlag; i++) {
    console.log(`购买${$.fastBuyLevel}级汪汪`)
    await takeRequest('joyBuy');
    await $.wait(1000);
    break;
  }
}

async function joyMerge(joyOneInfo,joyTwoInfo){
  //console.log(JSON.stringify(joyOneInfo)+'\n');
  //console.log(JSON.stringify(joyTwoInfo));
  if(joyOneInfo.location){
    console.log(`开始移出坑位【${joyOneInfo.location}】上的汪汪`);
    $.joyId = joyOneInfo.id;
    $.location = 0;
    await takeRequest('joyMove');
    await $.wait(2000);
  }
  if(joyTwoInfo.location){
    console.log(`开始移出坑位【${joyTwoInfo.location}】上的汪汪`);
    $.joyId = joyTwoInfo.id;
    $.location = 0;
    await takeRequest('joyMove');
    await $.wait(2000);
  }
  $.joyOneId = joyOneInfo.id;
  $.joyTwoId = joyTwoInfo.id;
  $.runFlag = true;
  let joyMergeTime = 0;
  do{
    await takeRequest('joyMerge');
    joyMergeTime++;
  }while($.runFlag && joyMergeTime < 6);
}

async function takeRequest(type) {
  let url = ``;
  let body = ``;
  let myRequest = ``;
  switch (type) {
    case 'joyBaseInfo':
      url = `https://api.m.jd.com/`;
      body = `functionId=${type}&body={"taskId":"","inviteType":"","inviterPin":"","linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=${Date.now()}&appid=activities_platform`;
      break;
    case 'apTaskList':
      url = `https://api.m.jd.com/`;
      body = `functionId=${type}&body={"linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=${Date.now()}&appid=activities_platform`;
      break;
    case 'joyMove':
      url = `https://api.m.jd.com/`;
      body = `functionId=${type}&body={"joyId":${$.joyId},"location":${$.location},"linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=${Date.now()}&appid=activities_platform`;
      break;
    case 'joyMerge':
      console.log(`准备合成汪汪`)
      await $.wait(2000);
      url = `https://api.m.jd.com/?functionId=joyMergeGet&body={%22joyOneId%22:${$.joyOneId},%22joyTwoId%22:${$.joyTwoId},%22linkId%22:%22LsQNxL7iWDlXUs6cFl-AAg%22}&_t=${Date.now()}&appid=activities_platform`
      break;
    case 'joyBuy':
      url = `https://api.m.jd.com/`;
      body = `functionId=${type}&body={"level":${$.fastBuyLevel},"linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=${Date.now()}&appid=activities_platform`;
      break;
    case 'joyList':
      url = `https://api.m.jd.com/?functionId=joyList&body={%22linkId%22:%22LsQNxL7iWDlXUs6cFl-AAg%22}&_t=${Date.now()}&appid=activities_platform`;
      break;
    case 'getStaticResource':
      url = `https://api.m.jd.com/?functionId=getStaticResource&body={%22linkId%22:%22LsQNxL7iWDlXUs6cFl-AAg%22}&_t=${Date.now()}&appid=activities_platform`;
      break;
    case 'treasureShortUrl':
      url = `https://api.m.jd.com/?functionId=treasureShortUrl&body=%7B%22url%22:%22https:%2F%2Fblack.jd.com%2Fxsagoq%2Fbhsb%3FjumpPath%3Dhttps%253A%252F%252Fjoypark.jd.com%253FactivityId%253DLsQNxL7iWDlXUs6cFl-AAg%2526inviterId%253Dundefined%2526inviteType%253D0%2526enter%253Ddefaultshare%26dlChannel%3Dsuperjd-mjsb-wwly%26autoOpen%3D1%26video%3Dwwly%22,%22shortUrlDomain%22:%22bwwxoe.com%22%7D&appid=megatron&t=${Date.now()}`;
      break;
    case 'gameHeartbeat':
      url =`https://api.m.jd.com/?functionId=gameHeartbeat&body={%22businessCode%22:1,%22linkId%22:%22LsQNxL7iWDlXUs6cFl-AAg%22}&_t=${Date.now()}&appid=activities_platform`;
      break;
    default:
      console.log(`错误${type}`);
  }
  if(type === 'joyList' || type === 'getStaticResource' || type === 'treasureShortUrl' || type === 'gameHeartbeat' || type === 'joyMerge'){
    myRequest = getGetRequest(url);
    return new Promise(async resolve => {
      $.get(myRequest, (err, resp, data) => {
        try {
          dealReturn(type, data);
        } catch (e) {
          console.log(data);
        } finally {
          resolve();
        }
      })
    })
  }else{
    myRequest = getPostRequest(url,body);
    return new Promise(async resolve => {
      $.post(myRequest, (err, resp, data) => {
        try {
          dealReturn(type, data);
        } catch (e) {
          console.log(data);
        } finally {
          resolve();
        }
      })
    })
  }
}

function dealReturn(type, data) {
  data = JSON.parse(data);
  switch (type) {
    case 'joyBaseInfo':
      if (data.success && data.code === 0) {
        $.mainInfo = data.data;
        $.fastBuyLevel = $.mainInfo.fastBuyLevel;
        $.fastBuyCoin = $.mainInfo.fastBuyCoin;
        $.joyCoin = $.mainInfo.joyCoin;
      } else {
        console.log(`joyBaseInfo异常：${JSON.stringify(data)}\n`);
      }
      break;
    case 'apTaskList':
      if (data.success && data.code === 0) {
        $.taskList = data.data;
      } else {
        console.log(`apTaskList异常：${JSON.stringify(data)}\n`);
      }
      break;
    case 'joyList':
      if (data.success && data.code === 0) {
        $.joyListInfo = data.data;
        $.joyListFlag = false;
        console.log(`获取汪汪列表`);
      } else {
        console.log(`joyList异常：${JSON.stringify(data)}\n`);
      }
      break;
    case 'joyMove':
      if (data.success && data.code === 0) {
        console.log(`移动成功`);
      } else {
        console.log(`joyMove异常：${JSON.stringify(data)}\n`);
      }
      break;
    case 'joyMerge':
      if (data.success && data.code === 0) {
        console.log(`合成成功，获得${data.data.joyVO.level}级汪汪`);
        $.joyMergeFlag = true;
        $.runFlag = false;
      } else {
        $.runFlag = true;
        console.log(`joyMerge异常：${JSON.stringify(data)}\n`);
      }
      break;
    case 'joyBuy':
      if (data.success && data.code === 0) {
        console.log(`购买成功，获得${data.data.level}级汪汪`);
        $.joyListFlag = true;
      } else {
        $.buyFlag = false;
        console.log(`joyBuy异常：${JSON.stringify(data)}\n`);
      }
      break;
    case 'getStaticResource':
    case 'treasureShortUrl':
    case 'gameHeartbeat':
      break;
    default:
      console.log(JSON.stringify(data));
  }
}
function getGetRequest(url) {
  const method = `GET`;
  let headers = {
    'Host': 'api.m.jd.com',
    'Cookie': $.cookie,
    'Origin': 'https://joypark.jd.com',
    'Accept-Language': 'zh-cn',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':`jdltapp;iPhone;3.5.6;14.6;76573d7106b97af59f89391bda784c000508c52c;network/wifi;ADID/71FB085F-DC45-47F3-81F3-5316AFCCC408;hasUPPay/0;pushNoticeIsOpen/0;lang/zh_CN;model/iPhone9,2;addressid/2214111493;hasOCPay/0;appBuild/1070;supportBestPay/0;pv/145.8;apprpd/;ref/JDLTSubMainPageViewController;psq/7;ads/;psn/76573d7106b97af59f89391bda784c000508c52c|302;jdv/0|kong|t_2011648980_|jingfen|b9c8b96699e340f58566f5a6e0e2d61f|1625486930200|1625486942;adk/;app_device/IOS;pap/JA2020_3112531|3.5.6|IOS 14.6;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
    //'User-Agent':`jdltapp;android;10.0.5;10;${randPhoneId()};network/wifi;model/VOG-AL00;addressid/137878570;aid/ae3f1e405513f69c;oaid/58e681c7-25cd-4756-b0b5-0a01afac5c73;osVer/29;appBuild/1446;psn/YpzKtOANGRiQ8DSf43yI9iwHJuw20rjt|107;psq/37;adk/;ads/;pap/JA2020_3112531|3.2.0|ANDROID 10;osv/10;pv/35.212;jdv/0|iosapp|t_335139774|liteshare|Qqfriends|1612799035830|1612799104;ref/com.jingdong.common.reactnative.view.JDReactMainActivity;partner/android;apprpd/;eufv/1;Mozilla/5.0 (Linux; Android 10; VOG-AL00 Build/HUAWEIVOG-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.106 Mobile Safari/537.36`,
    'Accept': 'application/json, text/plain, */*',
    'Referer': `https://joypark.jd.com/`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  return {url: url, method: method, headers: headers};
}

function getPostRequest(url, body) {
  const method = `POST`;
  let headers = {
    'Host': 'api.m.jd.com',
    'Cookie': $.cookie,
    'Origin': 'https://joypark.jd.com',
    'Accept-Language': 'zh-cn',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':`jdltapp;iPhone;3.5.6;14.6;76573d7106b97af59f89391bda784c000508c52c;network/wifi;ADID/71FB085F-DC45-47F3-81F3-5316AFCCC408;hasUPPay/0;pushNoticeIsOpen/0;lang/zh_CN;model/iPhone9,2;addressid/2214111493;hasOCPay/0;appBuild/1070;supportBestPay/0;pv/145.8;apprpd/;ref/JDLTSubMainPageViewController;psq/7;ads/;psn/76573d7106b97af59f89391bda784c000508c52c|302;jdv/0|kong|t_2011648980_|jingfen|b9c8b96699e340f58566f5a6e0e2d61f|1625486930200|1625486942;adk/;app_device/IOS;pap/JA2020_3112531|3.5.6|IOS 14.6;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
    //'User-Agent':`jdltapp;android;10.0.5;10;${randPhoneId()};network/wifi;model/VOG-AL00;addressid/137878570;aid/ae3f1e405513f69c;oaid/58e681c7-25cd-4756-b0b5-0a01afac5c73;osVer/29;appBuild/1446;psn/YpzKtOANGRiQ8DSf43yI9iwHJuw20rjt|107;psq/37;adk/;ads/;pap/JA2020_3112531|3.2.0|ANDROID 10;osv/10;pv/35.212;jdv/0|iosapp|t_335139774|liteshare|Qqfriends|1612799035830|1612799104;ref/com.jingdong.common.reactnative.view.JDReactMainActivity;partner/android;apprpd/;eufv/1;Mozilla/5.0 (Linux; Android 10; VOG-AL00 Build/HUAWEIVOG-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.106 Mobile Safari/537.36`,
    'Accept': 'application/json, text/plain, */*',
    'Referer': `https://joypark.jd.com/`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  return {url: url, method: method, headers: headers,body:body};
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
      headers: {
        Host: "me-api.jd.com",
        Accept: "*/*",
        Connection: "keep-alive",
        Cookie: $.cookie,
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
        "Accept-Language": "zh-cn",
        "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
        "Accept-Encoding": "gzip, deflate, br"
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === "1001") {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            $.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e)
      } finally {
        resolve();
      }
    })
  })
}
// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
