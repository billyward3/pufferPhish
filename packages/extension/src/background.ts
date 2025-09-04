// Background service worker for Chrome extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('PufferPhish extension installed');
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    console.log('Page loaded:', details.url);
  }
});

export {};