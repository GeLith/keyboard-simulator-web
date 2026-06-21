chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'typingComplete') {
    // 转发消息到popup
    chrome.runtime.sendMessage({
      action: 'typingComplete',
      tabId: sender.tab.id
    });
  }
  sendResponse({ success: true });
});
