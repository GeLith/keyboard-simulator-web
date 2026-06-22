chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'typingComplete') {
    chrome.runtime.sendMessage({
      action: 'typingComplete',
      tabId: sender.tab.id
    });
    sendResponse({ success: true });
    return;
  }

  if (message.action === 'executeInMainWorld') {
    var target = { tabId: sender.tab.id, frameIds: [sender.frameId] };
    chrome.scripting.executeScript({
      target: target,
      world: 'MAIN',
      files: ['injected.js']
    }).then(function(results) {
      sendResponse({ result: results && results[0] ? results[0].result : null });
    }).catch(function(err) {
      console.error('[KS-BG] executeScript error:', err);
      sendResponse({ error: err.message });
    });
    return true;
  }

  sendResponse({ success: true });
});