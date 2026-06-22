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
    var fn = new Function('return ' + message.func)();
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id, frameIds: [sender.frameId] },
      world: 'MAIN',
      func: fn,
      args: message.args || []
    }).then(function(results) {
      sendResponse({ result: results && results[0] ? results[0].result : null });
    }).catch(function(err) {
      sendResponse({ error: err.message });
    });
    return true;
  }

  sendResponse({ success: true });
});
