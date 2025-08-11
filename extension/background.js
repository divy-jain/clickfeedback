// ClickFeedback background service worker (MV3)
const MENU_ID = 'clickfeedback-give-feedback';

chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: '💬 Give Feedback on This Element',
      contexts: ['all'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
  } catch (e) {
    console.error('Context menu creation failed', e);
  }
});

function captureVisible(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(windowId, { format: 'png', quality: 90 }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        reject(chrome.runtime.lastError || new Error('Screenshot failed'));
      } else {
        resolve(dataUrl);
      }
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab || tab.id == null) return;
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const screenshot = await captureVisible(activeTab.windowId);
    await chrome.tabs.sendMessage(tab.id, { type: 'CF_OPEN_MODAL', screenshot });
  } catch (e) {
    console.error('Error opening ClickFeedback modal:', e);
  }
});