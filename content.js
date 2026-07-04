(function() {
  var isTyping = false;
  var shouldStop = false;
  var ball = null;
  var panel = null;

  var VERSION = '1.4';
  var isTopFrame = (window.top === window);

  if (isTopFrame) createBall();

  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action === 'startTyping') {
      if (isTopFrame) {
        createBall(); createPanel();
        panel.classList.add('ks-show');
        document.getElementById('ks-delay').value = msg.settings.startDelay / 1000;
        document.getElementById('ks-interval').value = msg.settings.charInterval / 1000;
        document.getElementById('ks-input').value = msg.settings.text;
        isTyping = true; shouldStop = false;
        document.getElementById('ks-start').disabled = true;
        document.getElementById('ks-stop').disabled = false;
        document.getElementById('ks-status').textContent = '准备输入...';
        startTyping(msg.settings);
      }
      sendResponse({ success: true });
    } else if (msg.action === 'stopTyping') {
      shouldStop = true;
      sendResponse({ success: true });
    } else {
      sendResponse({ success: true });
    }
  });

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
        '<a id="ks-souti" href="https://microsoftedge.microsoft.com/addons/detail/abkclgdmdkokpdkbpdkoiiemhcaafbkg" target="_blank" title="大学搜题酱插件 - Edge 扩展商店">一键安装大学搜题酱</a>',
        '<div id="ks-status">就绪 - 点击球图标可收起</div>',
      '</div>',
      '<div id="ks-panel-footer">v' + VERSION + ' | <a href="https://github.com/GeLith/keyboard-simulator-web" target="_blank">GitHub</a> | <a href="https://felixdd.top/donate.html" target="_blank">赞助</a></div>'
    ].join('');
    document.body.appendChild(panel);
    chrome.storage.local.get(['panelSettings'], function(r) { if (r.panelSettings) { if (r.panelSettings.delay !== undefined) document.getElementById('ks-delay').value = r.panelSettings.delay; if (r.panelSettings.interval !== undefined) document.getElementById('ks-interval').value = r.panelSettings.interval; } });
    function savePS() { chrome.storage.local.set({ panelSettings: { delay: document.getElementById('ks-delay').value, interval: document.getElementById('ks-interval').value } }); }
    document.getElementById('ks-delay').addEventListener('change', savePS);
    document.getElementById('ks-interval').addEventListener('change', savePS);
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
      console.log('[KS] start button clicked');
      var txt = document.getElementById('ks-input').value;
      if (!txt.trim()) { document.getElementById('ks-status').textContent = '请输入文字'; return; }
      isTyping = true; shouldStop = false;
      document.getElementById('ks-start').disabled = true;
      document.getElementById('ks-stop').disabled = false;
      document.getElementById('ks-status').textContent = '准备输入...';
      startTyping({ text: txt, startDelay: parseFloat(document.getElementById('ks-delay').value) * 1000, charInterval: parseFloat(document.getElementById('ks-interval').value) * 1000 });
    });
    document.getElementById('ks-stop').addEventListener('click', function() { shouldStop = true; document.getElementById('ks-status').textContent = '正在停止...'; });
    document.getElementById('ks-clear').addEventListener('click', function() { document.getElementById('ks-input').value = ''; document.getElementById('ks-input').focus(); });
  }

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
    logDebug('findActiveUEditor: found ' + saveBtns.length + ' save buttons');
    for (var i = 0; i < saveBtns.length; i++) {
      var vis = saveBtns[i].offsetWidth > 0 && saveBtns[i].offsetHeight > 0;
      var dataid = saveBtns[i].getAttribute('dataid');
      logDebug('  saveBtn[' + i + '] visible=' + vis + ' dataid=' + dataid);
      if (vis && dataid) {
        var textarea = document.getElementById('answer' + dataid);
        if (!textarea) { logDebug('  textarea answer' + dataid + ' not found'); continue; }
        var qParent = textarea.closest('.sub_que_div_parent, .stem_answer');
        if (!qParent) { logDebug('  no question parent for ' + textarea.id); continue; }
        var editor = qParent.querySelector('.edui-editor');
        if (!editor) { logDebug('  no edui-editor in question parent'); continue; }
        var iframe = editor.querySelector('iframe');
        if (iframe) { logDebug('  -> returning ' + textarea.id); return { iframe: iframe, editorId: textarea.id }; }
      }
    }
    logDebug('findActiveUEditor: no active editor found');
    return null;
  }

  function findUeditorId() {
    var ueFrame = findUeditorIframe();
    if (!ueFrame) return null;
    var ta = findTextareaByIframe(ueFrame);
    return ta ? ta.id : null;
  }

  function logDebug(msg) {
    try {
      chrome.storage.local.get(['ks_debug'], function(r) {
        var logs = r.ks_debug || [];
        logs.push(new Date().toISOString() + ' ' + msg);
        if (logs.length > 50) logs = logs.slice(-50);
        chrome.storage.local.set({ ks_debug: logs });
      });
    } catch(e) {}
    console.log('[KS] ' + msg);
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

  function startTyping(settings) {
    var editorFrame = null;
    var debug = '';

    logDebug('startTyping called, lastUEditorId=' + lastUEditorId);

    var activeSave = findActiveUEditor();
    if (activeSave) {
      editorFrame = activeSave.iframe;
      debug = 'via saveBtn=' + activeSave.editorId;
      logDebug('saveBtn method found: ' + activeSave.editorId);
    }

    if (!editorFrame) {
      var focused = findFocusedEditor();
      if (focused) {
        editorFrame = focused.iframe;
        debug = 'via findFocusedEditor=' + focused.editorId;
        logDebug('findFocusedEditor found: ' + focused.editorId);
      }
    }

    if (!editorFrame && lastUEditorId) {
      editorFrame = findEditorByTextareaId(lastUEditorId);
      if (editorFrame) debug = 'via lastUEditorId=' + lastUEditorId;
      logDebug('lastUEditorId method: ' + (editorFrame ? 'found ' + lastUEditorId : 'not found'));
    }

    if (!editorFrame) {
      var activeEl = document.activeElement;
      logDebug('activeElement=' + (activeEl ? activeEl.tagName + '#' + (activeEl.id || '') : 'null'));
      if (activeEl && activeEl.tagName === 'IFRAME') {
        var ta = findTextareaByIframe(activeEl);
        if (ta) {
          editorFrame = activeEl;
          debug = 'via activeElement=' + ta.id;
        }
      }
    }

    if (!editorFrame) {
      editorFrame = findUeditorIframe();
      debug = 'via iframe scan: ' + (editorFrame ? 'found' : 'null');
      logDebug('iframe scan: ' + (editorFrame ? 'found' : 'null'));
    }

    if (!editorFrame) {
      var allIframes = document.querySelectorAll('.edui-editor iframe');
      for (var i = allIframes.length - 1; i >= 0; i--) {
        try {
          var doc = allIframes[i].contentDocument;
          if (doc && doc.body && !doc.body.textContent.trim()) {
            editorFrame = allIframes[i];
            debug = 'via empty editor #' + i;
            logDebug('found empty editor at index ' + i);
            break;
          }
        } catch(e) {}
      }
    }

    var statusEl = document.getElementById('ks-status');
    if (statusEl) statusEl.textContent = debug;

    if (editorFrame || document.querySelector('.edui-editor')) {
      typeViaExecCommand(editorFrame, settings);
    } else {
      typeLocally(settings);
    }
  }

  function typeViaUeApi(editorId, settings) {
    var statusEl = document.getElementById('ks-status');
    async function run() {
      await sleep(settings.startDelay);
      if (shouldStop) { finish('已停止'); return; }
      if (statusEl) statusEl.textContent = '正在输入...';
      var html = settings.text.replace(/\n/g, '<br/>');
      document.body.setAttribute('data-ks-ue-id', editorId);
      document.body.setAttribute('data-ks-ue-text', html);
      chrome.runtime.sendMessage({ action: 'ueSetContent', editorId: editorId, text: html });
      await sleep(500);
      if (statusEl) statusEl.textContent = '输入完成';
      finish('输入完成');
    }
    function finish(msg) {
      if (statusEl) { statusEl.textContent = msg; document.getElementById('ks-start').disabled = false; document.getElementById('ks-stop').disabled = true; isTyping = false; }
      try { chrome.runtime.sendMessage({ action: 'typingComplete' }); } catch(e) {}
    }
    run();
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
        logDebug('typeViaExecCommand: no editor found after delay, fallback to typeLocally');
        typeLocally(settings);
        return;
      }

      var doc = iframe.contentDocument;
      var body = doc.body;
      var ta = findTextareaByIframe(iframe);
      var targetId = ta ? ta.id : 'unknown';
      logDebug('typeViaExecCommand: target=' + targetId);
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
      try { chrome.runtime.sendMessage({ action: 'typingComplete' }); } catch(e) {}
    }
    run();
  }

  function typeLocally(settings) {
    var statusEl = document.getElementById('ks-status');
    async function run() {
      await sleep(settings.startDelay);
      for (let i = 0; i < settings.text.length; i++) {
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
            document.body.setAttribute('data-ks-char', char);
            await executeInMainWorld();
          }
        } else {
          document.body.setAttribute('data-ks-char', char);
          await executeInMainWorld();
        }
        if (i < settings.text.length - 1) await sleep(settings.charInterval);
      }
      if (statusEl) { statusEl.textContent = '输入完成'; document.getElementById('ks-start').disabled = false; document.getElementById('ks-stop').disabled = true; isTyping = false; }
      try { chrome.runtime.sendMessage({ action: 'typingComplete' }); } catch(e) {}
    }
    run();
  }

  function executeInMainWorld() {
    return new Promise(function(resolve) {
      chrome.runtime.sendMessage({ action: 'executeInMainWorld' }, function(r) {
        if (chrome.runtime.lastError) { resolve({ error: chrome.runtime.lastError.message }); }
        else resolve(r || { error: 'no response' });
      });
    });
  }

  function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
})();