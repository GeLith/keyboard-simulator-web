chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'typingComplete') {
    chrome.runtime.sendMessage({
      action: 'typingComplete',
      tabId: sender.tab.id
    });
  }
  sendResponse({ success: true });
});
