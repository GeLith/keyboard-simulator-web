document.addEventListener('DOMContentLoaded', function() {
  const inputContent = document.getElementById('inputContent');
  const startDelay = document.getElementById('startDelay');
  const startDelayValue = document.getElementById('startDelayValue');
  const charInterval = document.getElementById('charInterval');
  const charIntervalValue = document.getElementById('charIntervalValue');
  const repeatCount = document.getElementById('repeatCount');
  const alwaysTop = document.getElementById('alwaysTop');
  const clearAfterExec = document.getElementById('clearAfterExec');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const saveBtn = document.getElementById('saveBtn');
  const outputLog = document.getElementById('outputLog');

  let isRunning = false;

  // 更新滑块显示值
  startDelay.addEventListener('input', function() {
    startDelayValue.textContent = parseFloat(this.value).toFixed(2) + ' 秒';
  });

  charInterval.addEventListener('input', function() {
    charIntervalValue.textContent = parseFloat(this.value).toFixed(2) + ' 秒';
  });

  // 加载保存的设置
  chrome.storage.local.get(['settings'], function(result) {
    if (result.settings) {
      const s = result.settings;
      if (s.startDelay !== undefined) {
        startDelay.value = s.startDelay;
        startDelayValue.textContent = parseFloat(s.startDelay).toFixed(2) + ' 秒';
      }
      if (s.charInterval !== undefined) {
        charInterval.value = s.charInterval;
        charIntervalValue.textContent = parseFloat(s.charInterval).toFixed(2) + ' 秒';
      }
      if (s.repeatCount !== undefined) repeatCount.value = s.repeatCount;
      if (s.alwaysTop !== undefined) alwaysTop.checked = s.alwaysTop;
      if (s.clearAfterExec !== undefined) clearAfterExec.checked = s.clearAfterExec;
      if (s.inputContent !== undefined) inputContent.value = s.inputContent;
    }
  });

  // 保存设置
  function saveSettings() {
    chrome.storage.local.set({
      settings: {
        startDelay: startDelay.value,
        charInterval: charInterval.value,
        repeatCount: repeatCount.value,
        alwaysTop: alwaysTop.checked,
        clearAfterExec: clearAfterExec.checked,
        inputContent: inputContent.value
      }
    });
  }

  // 添加日志
  function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    outputLog.value += `[${timestamp}] ${message}\n`;
    outputLog.scrollTop = outputLog.scrollHeight;
  }

  // 开始输入
  startBtn.addEventListener('click', function() {
    const text = inputContent.value.trim();
    if (!text) {
      alert('请输入要模拟输入的内容');
      return;
    }

    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    addLog('开始输入任务...');

    const settings = {
      text: text,
      startDelay: parseFloat(startDelay.value) * 1000,
      charInterval: parseFloat(charInterval.value) * 1000,
      repeatCount: parseInt(repeatCount.value)
    };

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'startTyping',
        settings: settings
      }, function(response) {
        if (response && response.success) {
          addLog('指令已发送，等待执行...');
        } else {
          addLog('发送指令失败，请刷新页面后重试');
          isRunning = false;
          startBtn.disabled = false;
          stopBtn.disabled = true;
        }
      });
    });

    saveSettings();
  });

  // 停止输出
  stopBtn.addEventListener('click', function() {
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    addLog('正在停止输入...');

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'stopTyping'}, function(response) {
        if (response && response.success) {
          addLog('输入已停止');
        }
      });
    });
  });

  // 保存记录
  saveBtn.addEventListener('click', function() {
    const logContent = outputLog.value;
    if (!logContent.trim()) {
      alert('没有可保存的记录');
      return;
    }

    const blob = new Blob([logContent], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `输入记录_${new Date().toLocaleDateString()}_${new Date().toLocaleTimeString().replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('记录已保存');
  });

  // 监听来自content script的消息
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'log') {
      addLog(message.text);
    } else if (message.action === 'typingComplete') {
      isRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      addLog('输入任务完成');
      if (clearAfterExec.checked) {
        inputContent.value = '';
      }
    } else if (message.action === 'typingStopped') {
      isRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      addLog('输入已停止');
    }
  });

  // 窗口置顶功能
  alwaysTop.addEventListener('change', function() {
    saveSettings();
  });

  // 保存其他设置的变化
  [startDelay, charInterval, repeatCount, clearAfterExec].forEach(el => {
    el.addEventListener('change', saveSettings);
  });
});
