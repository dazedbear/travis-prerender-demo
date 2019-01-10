const fs = require('fs')
const { URL } = require('url');
const { join, dirname } = require('path');
const fetch = require('node-fetch');
const pathToRegexp = require('path-to-regexp');

const config = {
  api: 'https://ijv5uugzad.execute-api.ap-northeast-1.amazonaws.com/dev/prerender',
  server: 'http://localhost:3000/render',
  website: 'https://profile.104.com.tw',
  buildDir: 'build',
  routes: [
    '/profile/:pid',
    '/search?q=a'
  ]
}

/**
 * 相對路徑轉絕對路徑
 * @param {*} relativePath 
 */
const toAbsolutePath = relativePath => join(process.cwd(), relativePath);

/**
 * prerender a route
 * @param {*} host 
 * @param {*} route 
 * @param {*} params 
 */
const prerenderRoute = async (host = '', path = '') => {
  try {
    if (typeof path !== 'string')
      throw Error(`Invalid path.\nExpect string with at least length > 0 but found ${path}`);

    // 爬取網頁 html
    const url = new URL(`${host}${path}`).toString();
    const htmlString = await fetch(`${config.server}/${url}`)
      .then(response => response.text())
      .catch(e => {
        console.error(e)
        return null;
      })

    if (!htmlString || ['Not Found', 'Forbidden'].includes(htmlString))
      throw Error(`Invalid serialize content ${htmlString}`);

   
    // 建立路徑中包含的資料夾
    const buildPath = join(config.buildDir, `${path.replace(/\?.*/, '')}.html`);
    dirname(buildPath)
      .split(/[/\/]+/)
      .filter(dir => dir)
      .reduce((prevPath, dir) => {
        const current = join(prevPath, dir);
        let absCurrent = toAbsolutePath(join(prevPath, dir));
        if (!fs.existsSync(absCurrent)) {
          fs.mkdirSync(absCurrent);
          console.log(`[prerender] mkdir ${absCurrent}`);
        }
        return current;
      }, "");

    // 非同步寫入檔案
    const absPath = toAbsolutePath(buildPath);
    const content = new Uint8Array(Buffer.from(htmlString));
    fs.writeFile(absPath, content, err => {
      if (err) throw err;
      console.log(`[prerender] success: ${absPath}`);
    })

  } catch (e) {
    console.error(`[prerender] error: ${e}`);
  }
}

/**
 * 取得最近更新發布資料的 pid 列表
 */
const getRecentUpdateUser = () => {
  return fetch(config.api)
    .then(res => res.json())
    .then(({ response }) => response)
    .catch(e => {
      console.error(e)
      return [];
    });
}

/**
 * 將參數帶入所有 route 中並取得不重複 route 的 prerender 任務
 * @param {*} param
 */
const getTasks = ({ users }) => {
  const { website, routes } = config;
  const paths = routes.reduce((pathMap, route) => {
    for (let pid of users) {
      const path = pathToRegexp.compile(route)({ pid });
      pathMap[path] = path;
    }
    return pathMap;
  }, {})

  return Object.values(paths).map(path => prerenderRoute(website, path));
}

/**
 * Main
 */
getRecentUpdateUser()
  .then(users => Promise.all(getTasks({ users })))
  .catch(e => console.error(`[prerender] error: ${e}`));
