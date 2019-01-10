const { spawn, execSync } = require('child_process')

// 起 rendertron server
execSync('yarn run rendertron:start', { shell: true });
console.log(`[prerender] start rendertron server`);

// 執行 main.js
const main = spawn('node', ['main.js'], { shell: true });
console.log(`[prerender] start main process ${main.pid}`);

// 轉拋輸出訊息
main.stdout.on('data', data => console.log(data.toString()));
main.stderr.on('data', err => console.error(err.toString()));

// main 完成後關閉 rendertron server
main.on('exit', (code, signal) => {
  console.log(`[prerender] main process ${main.pid} exit with code ${code} and signal ${signal}`);
  execSync('yarn run rendertron:stop', { shell: true });
  console.log(`[prerender] shut down rendertron server`);
})