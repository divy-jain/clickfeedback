// ClickFeedback background service worker (MV3)
const MENU_ID = 'clickfeedback-give-feedback';

chrome.runtime.onInstalled.addListener(() => {
  console.log('ClickFeedback extension installed');
  
  try {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: '💬 Give Feedback on This Element',
      contexts: ['all'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
    console.log('Context menu created successfully');
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
  console.log('Context menu clicked', info, tab);
  
  if (info.menuItemId !== MENU_ID || !tab || tab.id == null) {
    console.log('Menu item not ours or no tab');
    return;
  }
  
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Active tab:', activeTab);
    
    const screenshot = await captureVisible(activeTab.windowId);
    console.log('Screenshot captured');
    
    await chrome.tabs.sendMessage(tab.id, { 
      type: 'CF_OPEN_MODAL', 
      screenshot: screenshot 
    });
    console.log('Message sent to content script');
    
  } catch (e) {
    console.error('Error opening ClickFeedback modal:', e);
  }
});