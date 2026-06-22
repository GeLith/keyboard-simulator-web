const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('file:///' + path.resolve(__dirname, 'test-mock.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  console.log('页面已加载');

  // 检测 UE 是否可用
  const ueAvailable = await page.evaluate(() => typeof UE !== 'undefined' && UE.instants && Object.keys(UE.instants).length > 0);
  console.log('UE 可用:', ueAvailable);

  // 点击编辑器
  await page.click('#editor');
  await new Promise(r => setTimeout(r, 300));

  // 测试注入脚本
  const result = await page.evaluate(() => {
    return new Promise((resolve) => {
      var script = document.createElement('script');
      script.textContent = `
        (function() {
          var result = false;
          var error = null;
          try {
            var editors = UE.instants;
            var keys = Object.keys(editors);
            for (var i = 0; i < keys.length; i++) {
              var editor = editors[keys[i]];
              if (editor && editor.body && editor.body.contentEditable === 'true') {
                editor.focus();
                editor.execCommand('insertText', 'Hello World!');
                result = true;
                break;
              }
            }
          } catch(e) {
            error = e.message;
          }
          window.__testResult = { result: result, error: error };
        })();
      `;
      document.head.appendChild(script);
      script.remove();
      setTimeout(() => resolve(window.__testResult), 500);
    });
  });
  console.log('注入测试结果:', JSON.stringify(result));

  // 获取内容
  const content = await page.evaluate(() => document.getElementById('editor').textContent);
  console.log('编辑器内容:', content);

  await browser.close();
  console.log('测试完成');
})().catch(e => {
  console.error('测试失败:', e.message);
  process.exit(1);
});
