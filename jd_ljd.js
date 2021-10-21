/*
京东APP--领京豆--做任务
50 4,21 * * * jd_ljd.js
*/
const $ = new Env('领京豆');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let cookiesArr = [];
let uuid = ``;
let ua = ``, allMessage = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
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
    try {
      await main();
    } catch (e) {
      $.logErr(e)
    }
    await $.wait(500);
  }
  if (allMessage) $.msg($.name, '', allMessage);
})().catch((e) => {$.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')}).finally(() => {$.done();})

async function main() {
  $.score = 0;
  $.nextLevelBeanNum = 0;
  uuid = randomWord(false, 40, 40);
  ua = `jdapp;iPhone;10.0.8;14.6;${uuid};network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214222493;appBuild/168841;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23E148;supportJDSHWK/1`
  $.taskInfo = {};
  await takeGetRequest('beanTaskList')
  if (JSON.stringify($.taskInfo) === '{}') {
    console.log(`获取任务列表失败`);
    return;
  }
  console.log(`获取任务列表成功`);
  if ($.taskInfo.viewAppHome && !$.taskInfo.viewAppHome.doneTask) {
    console.log(`任务：${$.taskInfo.viewAppHome.mainTitle}  ${$.taskInfo.viewAppHome.subTitle} ,执行任务`);
    $.flag = 0;
    await takeGetRequest('beanHomeIconDoTask');
    await $.wait(2000);
    $.flag = 1;
    await takeGetRequest('beanHomeIconDoTask');
    await $.wait(1000);
  }

  let runTime = 0;
  $.runFlag = false;
  do {
    if ($.runFlag) {
      await takeGetRequest('beanTaskList');
      await $.wait(3000);
    }
    $.runFlag = false;
    $.taskList = $.taskInfo.taskInfos;
    for (let i = 0; i < $.taskList.length; i++) {
      $.oneTask = $.taskList[i];
      console.log(`任务：【${$.oneTask['taskName']}】，进度：${$.oneTask.times}/${$.oneTask.maxTimes}`);
      if ($.oneTask.status === 2 || $.oneTask.times === $.oneTask.maxTimes) {
        //console.log(`任务：${$.oneTask.taskName},已完成`);
      } else if ($.oneTask.status === 1) {
        $.taskDetaillist = $.oneTask.subTaskVOS;
        let needRunTime = Number($.oneTask.maxTimes) - Number($.oneTask.times);
        for (let j = 0; j < $.taskDetaillist.length && needRunTime > 0; j++) {
          if ($.taskDetaillist[j].status !== 1) {
            continue;
          }
          console.log(`任务：${$.taskDetaillist[j].title || ''}  ${$.taskDetaillist[j].subtitle || ''},执行任务`);
          $.taskToken = $.taskDetaillist[j].taskToken
          if ($.oneTask.taskType === 9) {
            $.actionType = 1;
            await takeGetRequest('beanDoTask');
            await $.wait(5000);
            $.actionType = 0;
            await takeGetRequest('beanDoTask');
            await $.wait(3000);
          } else if ($.oneTask.taskType === 8) {
            $.actionType = 1;
            await takeGetRequest('beanDoTask');
            await $.wait(1000 * $.oneTask['waitDuration']);
            $.actionType = 0;
            await takeGetRequest('beanDoTask');
            await $.wait(3000);
          } else {
            $.actionType = 0;
            await takeGetRequest('beanDoTask');
            await $.wait(3000);
          }
          needRunTime--;
        }
      } else {
        //console.log(`任务：${$.oneTask.taskName},不执行`);
      }
    }
    runTime++;
  } while (runTime < 5 && $.runFlag);
  await findBeanScene();
}
function findBeanScene() {
  return new Promise(resolve => {
    const options = {
      "url": "https://api.m.jd.com/client.action?functionId=findBeanScene",
      "body": "area=18_1501_1504_57336&body=%7B%22rnClient%22%3A%222%22%2C%22viewChannel%22%3A%22AppHome%22%2C%22source%22%3A%22AppHome%22%2C%22rnVersion%22%3A%224.7%22%7D&build=167802&client=apple&clientVersion=10.1.2&d_brand=apple&d_model=iPhone11%2C8&eid=eidIf12a8121eas2urxgGc%2BzS5%2BUYGu1Nbed7bq8YY%2BgPd0Q0t%2BiviZdQsxnK/HTA7AxZzZBrtu1ulwEviYSV3QUuw2XHHC%2BPFHdNYx1A/3Zt8xYR%2Bd3&isBackground=N&joycious=126&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=88732f840b77821b345bf07fd71f609e6ff12f43&osVersion=14.7.1&partner=apple&rfs=0000&scope=11&screen=828%2A1792&sign=942e05c96e7fbd944b695fdf27f3d69a&st=1631583596623&sv=120&uemps=0-0&uts=0f31TVRjBSt6U6blB/IaCTHXfJdTG4zeMVQa4V9LFDmEFuBkph78Snx8BQ1FcmitzeQIQWwBlVj%2BTL6J6WAuFLHZ4jXYF%2BT2yba4qJ/kVXp93djRgcdyVnXv8OCnEOON4CZwYXIqz5fvr2PGIKV5nSsKhQ7qeL8lJtRbEIaRnOEi839%2BjQFzUqqCnXa0GqLzaPekWwPRnbm4IBfZ27o4lA%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=f7754c40c09909dc5fccf03e8d7e39d4",
      "headers": {
        "Cookie": $.cookie,
        "Host": "api.m.jd.com",
        "Accept": "*/*",
        "Connection": "keep-alive",
        "User-Agent": ua,
        "Accept-Language": "zh-Hans-CN;q=1,en-CN;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = $.toObj(data);
          if (data) {
            if (data['code'] === '0') {
              if (data['data'] && data.data.curScene) {
                $.curScene = data.data.curScene;
                const {growth, level, sceneLevelConfig} = $.curScene;
                $.msg($.name, '', `京东账号 ${$.index} ${$.nickName || $.UserName}\n当前等级：${level}，成长值：${growth}，升级还需：${sceneLevelConfig.growthEnd - growth}\n再升一级可额外得：${$.nextLevelBeanNum}京豆`)
                if ($.score) allMessage += `京东账号 ${$.index} ${$.nickName || $.UserName}\n当前等级：${level}，成长值：${growth}，升级还需：${sceneLevelConfig.growthEnd - growth}\n再升一级可额外得：${$.nextLevelBeanNum}京豆\n本次运行获得${$.score}成长值${$.index !== cookiesArr.length ? '\n\n' : ''}`;
              }
            } else {
              console.log(`findBeanScene异常：${$.toStr(data)}\n`)
            }
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
async function takeGetRequest(type) {
  let url = ``;
  let myRequest = ``;
  let random = Math.floor(1000 + 90000 * Math.random());
  switch (type) {
    case 'beanTaskList':
      url = `https://api.m.jd.com/client.action?functionId=beanTaskList&body=%7B%22viewChannel%22%3A%22AppHome%22%7D&appid=ld&client=m&clientVersion=10.0.8&networkType=wifi&osVersion=14.6&uuid=${uuid}&openudid=${uuid}&jsonp=jsonp_${Date.now()}_${random}`;
      break;
    case 'beanDoTask':
      url = `https://api.m.jd.com/client.action?functionId=beanDoTask&body=%7B%22actionType%22%3A${$.actionType}%2C%22taskToken%22%3A%22${$.taskToken}%22%7D&appid=ld&client=apple&clientVersion=10.0.8&networkType=wifi&osVersion=14.6&uuid=${uuid}&openudid=${uuid}&jsonp=jsonp_${Date.now()}_${random}`;
      break;
    case 'beanHomeIconDoTask':
      url = `https://api.m.jd.com/client.action?functionId=beanHomeIconDoTask&body=%7B%22flag%22%3A%22${$.flag}%22%2C%22viewChannel%22%3A%22AppHome%22%7D&appid=ld&client=apple&clientVersion=10.0.8&networkType=wifi&osVersion=14.6&uuid=${uuid}&openudid=${uuid}&jsonp=jsonp_${Date.now()}_${random}`;
      break;
    default:
      console.log(`错误${type}`);
  }
  myRequest = getGetRequest(url);
  return new Promise(async resolve => {
    $.get(myRequest, (err, resp, data) => {
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
  try {
    data = data.match(new RegExp(/jsonp.*\((.*)\);/))[1]
    data = JSON.parse(data);
  } catch (e) {
    console.log(`解析异常` + type);
    console.log(data);
  }
  switch (type) {
    case 'beanTaskList':
      if (data.code === '0') {
        console.log(`\n获取任务列表`);
        if (data['data']) {
          $.taskInfo = data.data;
          $.nextLevelBeanNum = $.taskInfo['nextLevelBeanNum']
        } else {
          $.log(data['errorMessage'])
        }
      } else {
        console.log(`返回数据异常` + type);
      }
      break;
    case 'beanDoTask':
      if (data.code === '0') {
        if (data.data && data.data.bizMsg) {
          console.log(data.data.bizMsg || ' ');
          if ($.actionType === 0) {
            $.log(`任务完成进度:${data.data.times}/${data.data.maxTimes}\n`)
            $.score += parseInt(data.data.score)
          }
          $.runFlag = true;
        } else {
          console.log(`等待任务完成`);
        }
      } else {
        console.log(`返回数据异常` + type);
      }
      break;
    case 'beanHomeIconDoTask':
      if (data.code === '0' && data['data']) {
        console.log(data.data.remindMsg || ' ');
        if ($.flag === 1) {
          $.score += parseInt(data.data.growthResult.addedGrowth);
        }
      } else {
        console.log(`返回数据异常` + type, $.toStr(data));
      }
      break;
    default:
      console.log(JSON.stringify(data));
  }
}

function getGetRequest(url) {
  const method = `GET`;
  let headers = {
    'Origin': `api.m.jd.com`,
    'Cookie': $.cookie,
    'Accept': `*/*`,
    'Accept-Encoding': `gzip, deflate, br`,
    'User-Agent': ua,
    'Accept-Language': `zh-cn`,
    'Referer': `https://h5.m.jd.com/rn/42yjy8na6pFsq1cx9MJQ5aTgu3kX/index.html`,
    'Host': `api.m.jd.com`,
  };
  return {url: url, method: method, headers: headers};
}

function randomWord(randomFlag, min, max) {
  var str = "",
      range = min,
      arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

  // 随机产生
  if (randomFlag) {
    range = Math.round(Math.random() * (max - min)) + min;
  }
  for (var i = 0; i < range; i++) {
    pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str;
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
