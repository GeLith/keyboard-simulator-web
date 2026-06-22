(function() {
  let isTyping = false;
  let shouldStop = false;
  let ball = null;
  let panel = null;

  const VERSION = '1.1.1';
  const isTopFrame = (window.top === window);

  if (isTopFrame) {
    createBall();
  }

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'startTyping') {
      if (isTopFrame) {
        createBall();
        createPanel();
        panel.classList.add('ks-show');
        const settings = message.settings;
        document.getElementById('ks-delay').value = settings.startDelay / 1000;
        document.getElementById('ks-interval').value = settings.charInterval / 1000;
        document.getElementById('ks-input').value = settings.text;
        startTypingUI(settings);
      }
      sendResponse({ success: true });
    } else if (message.action === 'stopTyping') {
      shouldStop = true;
      sendResponse({ success: true });
    } else if (message.action === 'typeInFrame') {
      if (!isTopFrame) {
        startTypingLocal(message.settings, false);
      }
      sendResponse({ success: true });
    }
    return true;
  });

  function executeInMainWorld(func, args) {
    return new Promise(function(resolve) {
      chrome.runtime.sendMessage({
        action: 'executeInMainWorld',
        func: func.toString(),
        args: args || []
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.warn('[KS] executeInMainWorld error:', chrome.runtime.lastError.message);
          resolve({ error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { error: 'no response' });
        }
      });
    });
  }

  function createBall() {
    if (ball) return;

    ball = document.createElement('div');
    ball.id = 'ks-ball';
    ball.innerHTML = '<span id="ks-ball-icon">⌨</span>';
    document.body.appendChild(ball);

    chrome.storage.local.get(['ballPos'], function(result) {
      if (result.ballPos) {
        ball.style.top = result.ballPos.top + 'px';
        ball.style.left = result.ballPos.left + 'px';
        ball.style.right = 'auto';
      }
    });

    ball.addEventListener('mousedown', function(e) {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startTop = ball.offsetTop;
      const startLeft = ball.offsetLeft;
      let moved = false;

      function onMouseMove(ev) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          moved = true;
        }
        if (moved) {
          ball.style.transition = 'none';
          ball.style.right = 'auto';
          ball.style.top = (startTop + dy) + 'px';
          ball.style.left = (startLeft + dx) + 'px';
        }
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (!moved) {
          togglePanel();
        } else {
          chrome.storage.local.set({
            ballPos: { top: ball.offsetTop, left: ball.offsetLeft }
          });
        }
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  function togglePanel() {
    if (!panel) {
      createPanel();
    }
    panel.classList.toggle('ks-show');
  }

  function createPanel() {
    if (panel) return;

    panel = document.createElement('div');
    panel.id = 'keyboard-simulator-panel';
    panel.innerHTML = `
      <div id="ks-panel-header">
        <span>⌨</span>
        <span id="ks-panel-title">键盘输入模拟器</span>
        <button id="ks-close">✕</button>
      </div>
      <div id="ks-panel-body">
        <textarea id="ks-input" placeholder="输入要模拟输入的文字..."></textarea>
        <div class="ks-settings">
          <div class="ks-row">
            <label>开始延迟(秒):</label>
            <input type="number" id="ks-delay" min="0" max="60" step="0.5" value="2">
          </div>
          <div class="ks-row">
            <label>字符间隔(秒):</label>
            <input type="number" id="ks-interval" min="0.01" max="5" step="0.01" value="0.05">
          </div>
        </div>
        <div class="ks-buttons">
          <button id="ks-start">开始输入</button>
          <button id="ks-stop" disabled>停止</button>
        </div>
        <div id="ks-status">就绪 - 点击球图标可收起</div>
      </div>
      <div id="ks-panel-footer">
        v${VERSION} | <a href="https://github.com/GeLith/keyboard-simulator-web" target="_blank">GitHub</a>
      </div>
    `;
    document.body.appendChild(panel);

    chrome.storage.local.get(['panelSettings'], function(result) {
      if (result.panelSettings) {
        const s = result.panelSettings;
        if (s.delay !== undefined) document.getElementById('ks-delay').value = s.delay;
        if (s.interval !== undefined) document.getElementById('ks-interval').value = s.interval;
      }
    });

    function savePanelSettings() {
      chrome.storage.local.set({
        panelSettings: {
          delay: document.getElementById('ks-delay').value,
          interval: document.getElementById('ks-interval').value
        }
      });
    }

    document.getElementById('ks-delay').addEventListener('change', savePanelSettings);
    document.getElementById('ks-interval').addEventListener('change', savePanelSettings);

    document.getElementById('ks-close').addEventListener('click', function() {
      panel.classList.remove('ks-show');
    });

    var panelHeader = document.getElementById('ks-panel-header');
    panelHeader.style.cursor = 'move';

    chrome.storage.local.get(['panelPos'], function(result) {
      if (result.panelPos) {
        panel.style.top = result.panelPos.top + 'px';
        panel.style.left = result.panelPos.left + 'px';
        panel.style.right = 'auto';
      }
    });

    panelHeader.addEventListener('mousedown', function(e) {
      if (e.target.id === 'ks-close') return;
      e.preventDefault();
      var startX = e.clientX;
      var startY = e.clientY;
      var startTop = panel.offsetTop;
      var startLeft = panel.offsetLeft;
      var moved = false;

      function onMove(ev) {
        var dx = ev.clientX - startX;
        var dy = ev.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        if (moved) {
          panel.style.transition = 'none';
          panel.style.right = 'auto';
          panel.style.top = (startTop + dy) + 'px';
          panel.style.left = (startLeft + dx) + 'px';
        }
      }

      function onEnd() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        if (moved) {
          chrome.storage.local.set({
            panelPos: { top: panel.offsetTop, left: panel.offsetLeft }
          });
        }
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
    });

    document.getElementById('ks-start').addEventListener('click', function() {
      console.log('[KS] start button clicked');
      const text = document.getElementById('ks-input').value;
      if (!text.trim()) {
        document.getElementById('ks-status').textContent = '请输入文字';
        return;
      }

      isTyping = true;
      shouldStop = false;
      document.getElementById('ks-start').disabled = true;
      document.getElementById('ks-stop').disabled = false;
      document.getElementById('ks-status').textContent = '准备输入...';

      const settings = {
        text: text,
        startDelay: parseFloat(document.getElementById('ks-delay').value) * 1000,
        charInterval: parseFloat(document.getElementById('ks-interval').value) * 1000,
        repeatCount: 1
      };

      startTypingUI(settings);
    });

    document.getElementById('ks-stop').addEventListener('click', function() {
      shouldStop = true;
      document.getElementById('ks-status').textContent = '正在停止...';
    });
  }

  function startTypingUI(settings) {
    var el = document.activeElement;
    console.log('[KS] activeElement:', el ? el.tagName + ' ' + (el.id || '') : 'null');

    var isIframeInput = el && el.tagName === 'IFRAME';

    if (!isIframeInput) {
      startTypingLocal(settings, true);
      return;
    }

    try {
      el.postMessage({ action: 'typeInFrame', settings: settings }, '*');
      trackTypingUI(settings);
    } catch(e) {
      console.warn('[KS] postMessage failed:', e);
      startTypingLocal(settings, true);
    }
  }

  function findActiveInputElement() {
    var el = document.activeElement;
    if (!el) return window;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) {
      return window;
    }
    if (el.tagName === 'IFRAME') {
      return el;
    }
    return window;
  }

  window.addEventListener('message', function(ev) {
    if (ev.data && ev.data.action === 'typeInFrame') {
      console.log('[KS] iframe received typeInFrame');
      startTypingLocal(ev.data.settings, false);
    }
  });

  function startTypingLocal(settings, showUI) {
    var statusEl = showUI ? document.getElementById('ks-status') : null;

    async function run() {
      await sleep(settings.startDelay);

      for (let i = 0; i < settings.text.length; i++) {
        if (shouldStop) {
          if (statusEl) {
            statusEl.textContent = '已停止';
            document.getElementById('ks-start').disabled = false;
            document.getElementById('ks-stop').disabled = true;
            isTyping = false;
          }
          return;
        }

        if (statusEl) {
          statusEl.textContent = `正在输入 (${i + 1}/${settings.text.length})...`;
        }

        var char = settings.text[i];

        var result = await executeInMainWorld(function(c) {
          if (typeof UE !== 'undefined' && UE.instants) {
            var keys = Object.keys(UE.instants);
            for (var i = 0; i < keys.length; i++) {
              var editor = UE.instants[keys[i]];
              if (editor && editor.body && editor.body.contentEditable === 'true') {
                editor.focus();
                editor.execCommand('insertText', c);
                return 'ueditor';
              }
            }
          }
          var el = document.activeElement;
          if (el) {
            var tag = el.tagName ? el.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea') {
              var start = el.selectionStart || el.value.length;
              var end = el.selectionEnd || el.value.length;
              el.value = el.value.substring(0, start) + c + el.value.substring(end);
              el.selectionStart = el.selectionEnd = start + 1;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              return 'input';
            } else if (el.isContentEditable || (el.getAttribute && el.getAttribute('contenteditable') === 'true')) {
              el.focus();
              document.execCommand('insertText', false, c);
              return 'contenteditable';
            }
          }
          return 'none';
        }, [char]);

        console.log('[KS] result:', JSON.stringify(result));

        if (i < settings.text.length - 1) {
          await sleep(settings.charInterval);
        }
      }

      if (statusEl) {
        statusEl.textContent = '输入完成';
        document.getElementById('ks-start').disabled = false;
        document.getElementById('ks-stop').disabled = true;
        isTyping = false;
      }

      try { chrome.runtime.sendMessage({ action: 'typingComplete' }); } catch(e) {}
    }

    run();
  }

  function trackTypingUI(settings) {
    var statusEl = document.getElementById('ks-status');

    async function run() {
      await sleep(settings.startDelay);

      for (let i = 0; i < settings.text.length; i++) {
        if (shouldStop) {
          statusEl.textContent = '已停止';
          document.getElementById('ks-start').disabled = false;
          document.getElementById('ks-stop').disabled = true;
          isTyping = false;
          return;
        }

        statusEl.textContent = `正在输入 (${i + 1}/${settings.text.length})...`;
        if (i < settings.text.length - 1) {
          await sleep(settings.charInterval);
        }
      }

      statusEl.textContent = '输入完成';
      document.getElementById('ks-start').disabled = false;
      document.getElementById('ks-stop').disabled = true;
      isTyping = false;
    }

    run();
  }

  function simulateKeyInput(char) {
    var activeElement = document.activeElement;
    if (!activeElement) return false;

    var tagName = activeElement.tagName.toLowerCase();
    var isInput = tagName === 'input' || tagName === 'textarea' || activeElement.isContentEditable;

    if (!isInput) return false;

    var keyDownEvent = new KeyboardEvent('keydown', {
      key: char, code: 'Key' + char.toUpperCase(),
      charCode: char.charCodeAt(0), keyCode: char.charCodeAt(0), which: char.charCodeAt(0),
      bubbles: true, cancelable: true
    });
    var keyPressEvent = new KeyboardEvent('keypress', {
      key: char, code: 'Key' + char.toUpperCase(),
      charCode: char.charCodeAt(0), keyCode: char.charCodeAt(0), which: char.charCodeAt(0),
      bubbles: true, cancelable: true
    });
    var keyUpEvent = new KeyboardEvent('keyup', {
      key: char, code: 'Key' + char.toUpperCase(),
      charCode: char.charCodeAt(0), keyCode: char.charCodeAt(0), which: char.charCodeAt(0),
      bubbles: true, cancelable: true
    });

    activeElement.dispatchEvent(keyDownEvent);
    activeElement.dispatchEvent(keyPressEvent);

    if (tagName === 'input' || tagName === 'textarea') {
      var currentValue = activeElement.value || '';
      var selectionStart = activeElement.selectionStart || currentValue.length;
      var selectionEnd = activeElement.selectionEnd || currentValue.length;
      var newValue = currentValue.substring(0, selectionStart) + char + currentValue.substring(selectionEnd);
      activeElement.value = newValue;
      activeElement.selectionStart = activeElement.selectionEnd = selectionStart + 1;
    } else if (activeElement.isContentEditable) {
      var selection = window.getSelection();
      if (selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(char));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
    activeElement.dispatchEvent(keyUpEvent);

    return true;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})();
