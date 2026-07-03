chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'typingComplete') {
    chrome.runtime.sendMessage({
      action: 'typingComplete',
      tabId: sender.tab.id
    });
    sendResponse({ success: true });
    return;
  }

  if (message.action === 'ueSetContent') {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id, frameIds: [sender.frameId] },
      world: 'MAIN',
      func: function(id, text) {
        if (!id) {
          id = document.body.getAttribute('data-ks-ue-id');
          text = document.body.getAttribute('data-ks-ue-text');
        }
        if (!id || !text) return { error: 'no data' };
        var editor = UE.getEditor(id);
        if (!editor) return { error: 'editor not found' };
        editor.focus(true);
        editor.setContent(text);
        return { success: true };
      },
      args: [message.editorId || '', message.text || '']
    }).then(function(results) {
      sendResponse({ result: results && results[0] ? results[0].result : null });
    }).catch(function(err) {
      sendResponse({ error: err.message });
    });
    return true;
  }

  if (message.action === 'executeInMainWorld') {
    var target = { tabId: sender.tab.id, frameIds: [sender.frameId] };
    var injectOpts = { target: target, world: 'MAIN' };
    if (message.func) {
      injectOpts.func = new Function('return ' + message.func)();
      if (message.args) injectOpts.args = message.args;
    } else {
      injectOpts.files = ['injected.js'];
    }
    chrome.scripting.executeScript(injectOpts).then(function(results) {
      sendResponse({ result: results && results[0] ? results[0].result : null });
    }).catch(function(err) {
      sendResponse({ error: err.message });
    });
    return true;
  }

  sendResponse({ success: true });
});