(function() {
  let isTyping = false;
  let shouldStop = false;
  let ball = null;
  let panel = null;
  let isDragging = false;
  let dragOffset = {x: 0, y: 0};
  let panelInitialized = false;

  function createBall() {
    if (ball) return;

    ball = document.createElement('div');
    ball.id = 'ks-ball';
    ball.innerHTML = '<span id="ks-ball-icon">⌨</span>';
    document.body.appendChild(ball);

    ball.addEventListener('mousedown', function(e) {
      isDragging = false;
      dragOffset.x = e.clientX - ball.offsetLeft;
      dragOffset.y = e.clientY - ball.offsetTop;
      const startX = e.clientX;
      const startY = e.clientY;

      function onMouseMove(ev) {
        const dx = Math.abs(ev.clientX - startX);
        const dy = Math.abs(ev.clientY - startY);
        if (dx > 5 || dy > 5) {
          isDragging = true;
        }
        if (isDragging) {
          ball.style.transition = 'none';
          ball.style.right = 'auto';
          ball.style.left = (ev.clientX - dragOffset.x) + 'px';
          ball.style.top = (ev.clientY - dragOffset.y) + 'px';
        }
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (!isDragging) {
          togglePanel();
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
        v1.0.0 | <a href="https://github.com/gelith/keyboard-simulator" target="_blank">GitHub</a>
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('ks-close').addEventListener('click', function() {
      panel.classList.remove('ks-show');
    });

    document.getElementById('ks-start').addEventListener('click', function() {
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

      startTyping(settings);
    });

    document.getElementById('ks-stop').addEventListener('click', function() {
      shouldStop = true;
      document.getElementById('ks-status').textContent = '正在停止...';
    });

    panelInitialized = true;
  }

  function simulateKeyInput(char) {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea' || activeElement.isContentEditable;

    if (!isInput) return false;

    const keyDownEvent = new KeyboardEvent('keydown', {
      key: char, code: 'Key' + char.toUpperCase(),
      charCode: char.charCodeAt(0), keyCode: char.charCodeAt(0), which: char.charCodeAt(0),
      bubbles: true, cancelable: true
    });
    const keyPressEvent = new KeyboardEvent('keypress', {
      key: char, code: 'Key' + char.toUpperCase(),
      charCode: char.charCodeAt(0), keyCode: char.charCodeAt(0), which: char.charCodeAt(0),
      bubbles: true, cancelable: true
    });
    const keyUpEvent = new KeyboardEvent('keyup', {
      key: char, code: 'Key' + char.toUpperCase(),
      charCode: char.charCodeAt(0), keyCode: char.charCodeAt(0), which: char.charCodeAt(0),
      bubbles: true, cancelable: true
    });

    activeElement.dispatchEvent(keyDownEvent);
    activeElement.dispatchEvent(keyPressEvent);

    if (tagName === 'input' || tagName === 'textarea') {
      const currentValue = activeElement.value || '';
      const selectionStart = activeElement.selectionStart || currentValue.length;
      const selectionEnd = activeElement.selectionEnd || currentValue.length;
      const newValue = currentValue.substring(0, selectionStart) + char + currentValue.substring(selectionEnd);
      activeElement.value = newValue;
      activeElement.selectionStart = activeElement.selectionEnd = selectionStart + 1;
    } else if (activeElement.isContentEditable) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
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

  async function startTyping(settings) {
    const { text, startDelay, charInterval } = settings;
    const statusEl = document.getElementById('ks-status');

    await sleep(startDelay);

    for (let i = 0; i < text.length; i++) {
      if (shouldStop) {
        statusEl.textContent = '已停止';
        document.getElementById('ks-start').disabled = false;
        document.getElementById('ks-stop').disabled = true;
        isTyping = false;
        return;
      }

      statusEl.textContent = `正在输入 (${i + 1}/${text.length})...`;
      simulateKeyInput(text[i]);

      if (i < text.length - 1) {
        await sleep(charInterval);
      }
    }

    statusEl.textContent = '输入完成';
    document.getElementById('ks-start').disabled = false;
    document.getElementById('ks-stop').disabled = true;
    isTyping = false;

    chrome.runtime.sendMessage({ action: 'typingComplete' });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'startTyping') {
      createBall();
      createPanel();
      panel.classList.add('ks-show');
      const settings = message.settings;
      document.getElementById('ks-delay').value = settings.startDelay / 1000;
      document.getElementById('ks-interval').value = settings.charInterval / 1000;
      document.getElementById('ks-input').value = settings.text;
      startTyping(settings);
      sendResponse({ success: true });
    } else if (message.action === 'stopTyping') {
      shouldStop = true;
      sendResponse({ success: true });
    }
    return true;
  });

  createBall();
})();
