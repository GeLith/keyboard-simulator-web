// ==UserScript==
// @name         学习通键盘输入器
// @namespace    https://github.com/GeLith/keyboard-simulator-web
// @version      1.4.2
// @description  模拟键盘输入，解决网页不支持粘贴的问题。支持学习通 UEditor 多编辑器精准检测。
// @author       GeLith
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @icon         https://felixdd.top/img/1.ico
// @homepage     https://felixdd.top/keyboard.html
// @supportURL   https://github.com/GeLith/keyboard-simulator-web/issues
// ==/UserScript==

(function() {
  'use strict';

  var isTyping = false;
  var shouldStop = false;
  var ball = null;
  var panel = null;
  var VERSION = '1.4.2';
  var isTopFrame = (window.top === window);

  if (!isTopFrame) return;

  var style = document.createElement('style');
  style.textContent = '#ks-ball{position:fixed;top:20px;right:20px;width:44px;height:44px;background:#fff;border-radius:50%;box-shadow:0 4px 15px rgba(0,0,0,0.2);z-index:9999999;cursor:pointer;display:flex;align-items:center;justify-content:center;user-select:none;transition:transform .2s ease,box-shadow .2s ease;border:2px solid rgba(0,0,0,0.08)}#ks-ball:hover{transform:scale(1.1);box-shadow:0 6px 25px rgba(0,0,0,0.3)}#ks-ball:active{transform:scale(0.95)}#ks-ball-icon{font-size:20px;color:#667eea;line-height:1;pointer-events:none}#keyboard-simulator-panel{position:fixed;top:80px;right:20px;width:320px;background:#fff;border-radius:10px;box-shadow:0 6px 30px rgba(0,0,0,0.3);z-index:9999998;font-family:"Microsoft YaHei","Segoe UI",sans-serif;font-size:13px;overflow:hidden;border:1px solid #ddd;display:none;animation:ks-fadeIn .2s ease}@keyframes ks-fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}#keyboard-simulator-panel.ks-show{display:block}#ks-panel-header{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#fff;color:#333;user-select:none;cursor:move}#ks-panel-header span:first-child{font-size:16px;color:#667eea}#ks-panel-title{flex:1;font-weight:bold}#ks-close{background:none;border:none;color:#999;font-size:18px;cursor:pointer;padding:0;line-height:1;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background .15s}#ks-close:hover{background:rgba(0,0,0,0.08)}#ks-panel-body{padding:14px}#ks-input{width:100%;height:80px;border:1px solid #ccc;border-radius:4px;padding:8px;font-size:13px;resize:vertical;margin-bottom:12px;font-family:inherit;box-sizing:border-box}#ks-input:focus{outline:none;border-color:#66afe9}.ks-settings{margin-bottom:12px}.ks-row{display:flex;align-items:center;margin-bottom:8px}.ks-row label{width:110px;font-size:12px;color:#555;flex-shrink:0}.ks-row input[type=number]{flex:1;padding:5px 8px;border:1px solid #ccc;border-radius:4px;font-size:13px;box-sizing:border-box}.ks-buttons{display:flex;gap:8px;margin-bottom:8px}.ks-buttons button{flex:1;padding:8px 12px;border:none;border-radius:4px;font-size:13px;cursor:pointer;font-weight:600;transition:background .15s,opacity .15s}#ks-start{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}#ks-start:hover{opacity:0.9}#ks-start:disabled{opacity:0.5;cursor:not-allowed}#ks-stop{background:#e74c3c;color:#fff}#ks-stop:hover{opacity:0.9}#ks-stop:disabled{opacity:0.5;cursor:not-allowed}.ks-btn-clear{width:100%;padding:6px;border:1px solid #ccc;border-radius:4px;background:#f9f9f9;cursor:pointer;font-size:12px;margin-bottom:8px;transition:background .15s}.ks-btn-clear:hover{background:#eee}#ks-souti{display:block;text-align:center;padding:8px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;margin-bottom:8px;transition:opacity .15s}#ks-souti:hover{opacity:0.9}#ks-status{font-size:12px;color:#888;text-align:center;padding:4px 0}#ks-panel-footer{padding:6px 14px;background:#f5f5f5;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee}#ks-panel-footer a{color:#667eea;text-decoration:none}';
  document.head.appendChild(style);

  createBall();

  var lastUEditorId = null;

  function setupEditorFocusTracking() {
    var editors = document.querySelectorAll('.edui-editor');
    for (var i = 0; i < editors.length; i++) {
      var ed = editors[i];
      if (ed._ksTracked) continue;
      ed._ksTracked = true;
      var ifr = ed.querySelector('iframe');
      if (!ifr) continue;
      try {
        var doc = ifr.contentDocument;
        if (!doc) continue;
        doc.addEventListener('focus', function() {
          var qParent = ed.closest('.sub_que_div_parent, .stem_answer');
          if (qParent) {
            var ta = qParent.querySelector('textarea[id^="answer"]');
            if (ta) lastUEditorId = ta.id;
          }
        }, true);
      } catch(e) {}
    }
  }

  var ksObserver = new MutationObserver(function() { setupEditorFocusTracking(); });
  ksObserver.observe(document.body, { childList: true, subtree: true });
  setupEditorFocusTracking();

  function findFocusedEditor() {
    var editors = document.querySelectorAll('.edui-editor');
    for (var i = 0; i < editors.length; i++) {
      var ifr = editors[i].querySelector('iframe');
      if (ifr) {
        try {
          var doc = ifr.contentDocument;
          if (doc && doc.hasFocus()) {
            var ta = findTextareaByIframe(ifr);
            return { iframe: ifr, editorId: ta ? ta.id : 'unknown' };
          }
        } catch(e) {}
      }
    }
    return null;
  }

  function createBall() {
    if (ball) return;
    ball = document.createElement('div');
    ball.id = 'ks-ball';
    ball.innerHTML = '<span id="ks-ball-icon">&#9000;</span>';
    document.body.appendChild(ball);
    ball.addEventListener('mousedown', function(e) {
      e.preventDefault();
      var sx = e.clientX, sy = e.clientY, st = ball.offsetTop, sl = ball.offsetLeft, mv = false;
      function mm(ev) { if (Math.abs(ev.clientX - sx) > 3 || Math.abs(ev.clientY - sy) > 3) mv = true; if (mv) { ball.style.transition = 'none'; ball.style.right = 'auto'; ball.style.top = (st + ev.clientY - sy) + 'px'; ball.style.left = (sl + ev.clientX - sx) + 'px'; } }
      function mu() { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); if (!mv) togglePanel(); }
      document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
    });
  }

  function togglePanel() { if (!panel) createPanel(); panel.classList.toggle('ks-show'); }

  function createPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'keyboard-simulator-panel';
    panel.innerHTML = [
      '<div id="ks-panel-header"><span>&#9000;</span><span id="ks-panel-title">学习通键盘输入器</span><button id="ks-close">&#10005;</button></div>',
      '<div id="ks-panel-body">',
        '<textarea id="ks-input" class="canEnterType" placeholder="输入要模拟输入的文字..."></textarea>',
        '<div class="ks-settings">',
          '<div class="ks-row"><label>开始延迟(秒):</label><input type="number" id="ks-delay" min="0" max="60" step="0.5" value="3"></div>',
          '<div class="ks-row"><label>字符间隔(秒):</label><input type="number" id="ks-interval" min="0.01" max="5" step="0.01" value="0.01"></div>',
        '</div>',
        '<div class="ks-buttons"><button id="ks-start">开始输入</button><button id="ks-stop" disabled>停止</button></div>',
        '<button id="ks-clear" class="ks-btn-clear">清空输入框</button>',
        '<a id="ks-souti" href="https://microsoftedge.microsoft.com/addons/detail/abkclgdmdkokpdkbpdkoiiemhcaafbkg" target="_blank">一键安装大学搜题酱</a>',
        '<div id="ks-status">就绪 - 点击球图标可收起</div>',
      '</div>',
      '<div id="ks-panel-footer">v' + VERSION + ' | <a href="https://github.com/GeLith/keyboard-simulator-web" target="_blank">GitHub</a> | <a href="https://felixdd.top/donate.html" target="_blank">赞助</a></div>'
    ].join('');
    document.body.appendChild(panel);
    var savedDelay = GM_getValue('ks-delay', '3');
    var savedInterval = GM_getValue('ks-interval', '0.01');
    document.getElementById('ks-delay').value = savedDelay;
    document.getElementById('ks-interval').value = savedInterval;
    document.getElementById('ks-delay').addEventListener('change', function() { GM_setValue('ks-delay', this.value); });
    document.getElementById('ks-interval').addEventListener('change', function() { GM_setValue('ks-interval', this.value); });
    document.getElementById('ks-close').addEventListener('click', function() { panel.classList.remove('ks-show'); });
    var hdr = document.getElementById('ks-panel-header');
    hdr.style.cursor = 'move';
    hdr.addEventListener('mousedown', function(e) {
      if (e.target.id === 'ks-close') return; e.preventDefault();
      var sx = e.clientX, sy = e.clientY, st = panel.offsetTop, sl = panel.offsetLeft, mv = false;
      function mv2(ev) { if (Math.abs(ev.clientX - sx) > 3 || Math.abs(ev.clientY - sy) > 3) mv = true; if (mv) { panel.style.transition = 'none'; panel.style.right = 'auto'; panel.style.top = (st + ev.clientY - sy) + 'px'; panel.style.left = (sl + ev.clientX - sx) + 'px'; } }
      function up() { document.removeEventListener('mousemove', mv2); document.removeEventListener('mouseup', up); }
      document.addEventListener('mousemove', mv2); document.addEventListener('mouseup', up);
    });
    document.getElementById('ks-start').addEventListener('click', function() {
      var txt = document.getElementById('ks-input').value;
      if (!txt.trim()) { document.getElementById('ks-status').textContent = '请输入文字'; return; }
      isTyping = true; shouldStop = false;
      document.getElementById('ks-start').disabled = true;
      document.getElementById('ks-stop').disabled = false;
      document.getElementById('ks-status').textContent = '准备输入...';
      if (document.activeElement && document.getElementById('keyboard-simulator-panel').contains(document.activeElement)) {
        document.activeElement.blur();
      }
      startTyping({ text: txt, startDelay: parseFloat(document.getElementById('ks-delay').value) * 1000, charInterval: parseFloat(document.getElementById('ks-interval').value) * 1000 });
    });
    document.getElementById('ks-stop').addEventListener('click', function() { shouldStop = true; document.getElementById('ks-status').textContent = '正在停止...'; });
    document.getElementById('ks-clear').addEventListener('click', function() { document.getElementById('ks-input').value = ''; document.getElementById('ks-input').focus(); });
  }

  function findEditorByTextareaId(taId) {
    var ta = document.getElementById(taId);
    if (!ta) return null;
    var qParent = ta.closest('.sub_que_div_parent, .stem_answer');
    if (qParent) {
      var editor = qParent.querySelector('.edui-editor');
      if (editor) {
        var ifr = editor.querySelector('iframe');
        if (ifr) return ifr;
      }
    }
    return null;
  }

  function findTextareaByIframe(iframe) {
    var editor = iframe.closest('.edui-editor');
    if (editor) {
      var qParent = editor.closest('.sub_que_div_parent, .stem_answer');
      if (qParent) {
        var ta = qParent.querySelector('textarea[id^="answer"]');
        if (ta) return ta;
      }
    }
    return null;
  }

  function findUeditorIframe() {
    var active = document.activeElement;
    if (active && active.tagName === 'IFRAME') {
      try {
        var doc = active.contentDocument;
        if (doc && doc.body && (doc.body.getAttribute('contenteditable') === 'true' || doc.querySelector('.edui-body-container'))) {
          return active;
        }
      } catch(e) {}
    }
    if (active && active.ownerDocument && active.ownerDocument !== document) {
      var iframes = document.querySelectorAll('iframe');
      for (var i = 0; i < iframes.length; i++) {
        try {
          if (iframes[i].contentDocument === active.ownerDocument) { return iframes[i]; }
        } catch(e) {}
      }
    }
    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
      try {
        var doc = iframes[i].contentDocument;
        if (!doc || !doc.body) continue;
        if (doc.body.getAttribute('contenteditable') === 'true' || doc.querySelector('.edui-body-container')) {
          return iframes[i];
        }
      } catch(e) {}
    }
    return null;
  }

  function findActiveUEditor() {
    var saveBtns = document.querySelectorAll('.saveButtonClass');
    for (var i = 0; i < saveBtns.length; i++) {
      if (saveBtns[i].offsetWidth > 0 && saveBtns[i].offsetHeight > 0) {
        var activeId = saveBtns[i].getAttribute('dataid');
        if (!activeId) continue;
        var textarea = document.getElementById('answer' + activeId);
        if (!textarea) continue;
        var qParent = textarea.closest('.sub_que_div_parent, .stem_answer');
        if (!qParent) continue;
        var editor = qParent.querySelector('.edui-editor');
        if (!editor) continue;
        var iframe = editor.querySelector('iframe');
        if (iframe) return { iframe: iframe, editorId: textarea.id };
      }
    }
    return null;
  }

  function startTyping(settings) {
    var editorFrame = null;

    var activeSave = findActiveUEditor();
    if (activeSave) {
      editorFrame = activeSave.iframe;
    }

    if (!editorFrame) {
      var focused = findFocusedEditor();
      if (focused) {
        editorFrame = focused.iframe;
      }
    }

    if (!editorFrame && lastUEditorId) {
      editorFrame = findEditorByTextareaId(lastUEditorId);
    }

    if (!editorFrame) {
      var activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'IFRAME') {
        var ta = findTextareaByIframe(activeEl);
        if (ta) {
          editorFrame = activeEl;
        }
      }
    }

    if (!editorFrame) {
      editorFrame = findUeditorIframe();
    }

    if (!editorFrame) {
      var allIframes = document.querySelectorAll('.edui-editor iframe');
      for (var i = allIframes.length - 1; i >= 0; i--) {
        try {
          var doc = allIframes[i].contentDocument;
          if (doc && doc.body && !doc.body.textContent.trim()) {
            editorFrame = allIframes[i];
            break;
          }
        } catch(e) {}
      }
    }

    if (editorFrame || document.querySelector('.edui-editor')) {
      typeViaExecCommand(editorFrame, settings);
    } else {
      typeLocally(settings);
    }
  }

  function typeViaExecCommand(initialIframe, settings) {
    var statusEl = document.getElementById('ks-status');
    async function run() {
      await sleep(settings.startDelay);
      if (shouldStop) { finish('已停止'); return; }

      var iframe = initialIframe;
      var focused = findFocusedEditor();
      if (focused) {
        iframe = focused.iframe;
      }

      if (!iframe) {
        typeLocally(settings);
        return;
      }

      var doc = iframe.contentDocument;
      var body = doc.body;
      var ta = findTextareaByIframe(iframe);
      var targetId = ta ? ta.id : 'unknown';
      if (statusEl) statusEl.textContent = '写入: ' + targetId;
      body.focus();
      var sel = doc.getSelection();
      sel.collapse(body, body.childNodes.length);
      for (var i = 0; i < settings.text.length; i++) {
        if (shouldStop) { finish('已停止'); return; }
        if (statusEl) statusEl.textContent = '正在输入 (' + (i + 1) + '/' + settings.text.length + ')...';
        var char = settings.text[i];
        sel.collapse(body, body.childNodes.length);
        if (char === '\n') { doc.execCommand('insertLineBreak'); } else { doc.execCommand('insertText', false, char); }
        if (i < settings.text.length - 1) await sleep(settings.charInterval);
      }
      finish('输入完成');
    }
    function finish(msg) {
      if (statusEl) { statusEl.textContent = msg; document.getElementById('ks-start').disabled = false; document.getElementById('ks-stop').disabled = true; isTyping = false; }
    }
    run();
  }

  function typeLocally(settings) {
    var statusEl = document.getElementById('ks-status');
    async function run() {
      await sleep(settings.startDelay);
      for (var i = 0; i < settings.text.length; i++) {
        if (shouldStop) { if (statusEl) { statusEl.textContent = '已停止'; document.getElementById('ks-start').disabled = false; document.getElementById('ks-stop').disabled = true; isTyping = false; } return; }
        if (statusEl) statusEl.textContent = '正在输入 (' + (i + 1) + '/' + settings.text.length + ')...';
        var char = settings.text[i];
        var active = document.activeElement;
        if (active) {
          var tag = active.tagName ? active.tagName.toLowerCase() : '';
          if (tag === 'input' || tag === 'textarea') {
            var start = active.selectionStart || active.value.length;
            active.value = active.value.substring(0, start) + char + active.value.substring(active.selectionEnd || start);
            active.selectionStart = active.selectionEnd = start + 1;
            active.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            try { if (char === '\n') { document.execCommand('insertLineBreak'); } else { document.execCommand('insertText', false, char); } } catch(e) {}
          }
        } else {
          try { if (char === '\n') { document.execCommand('insertLineBreak'); } else { document.execCommand('insertText', false, char); } } catch(e) {}
        }
        if (i < settings.text.length - 1) await sleep(settings.charInterval);
      }
      if (statusEl) { statusEl.textContent = '输入完成'; document.getElementById('ks-start').disabled = false; document.getElementById('ks-stop').disabled = true; isTyping = false; }
    }
    run();
  }

  function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
})();
