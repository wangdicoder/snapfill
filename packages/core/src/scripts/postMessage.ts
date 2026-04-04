/** Post a snapfill message to the host environment (React Native WebView or parent frame). */
export function postSnapfillMessage(data: Record<string, unknown>): void {
  const msg = JSON.stringify(data);
  const rn = (window as any).ReactNativeWebView;
  if (rn && rn.postMessage) {
    rn.postMessage(msg);
  } else if (window.parent !== window) {
    window.parent.postMessage({ snapfill: true, ...data }, '*');
  }
}
