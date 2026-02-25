import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import { useSnapfill } from './useSnapfill';
import type { SnapfillWebViewProps, SnapfillWebViewRef } from './types';

/**
 * Drop-in WebView component with snapfill autofill support.
 *
 * Composes user-provided `onMessage` and `injectedJavaScript` with snapfill's.
 * Exposes `fillForm`, `reinject`, `injectJavaScript`, `goBack`, `goForward`, `reload` via ref.
 */
const SnapfillWebView = forwardRef<SnapfillWebViewRef, SnapfillWebViewProps>(
  (
    {
      onFormDetected,
      onCartDetected,
      onValuesCaptured,
      onFormFillComplete,
      onOtherMessage,
      snapfillOptions,
      onMessage: userOnMessage,
      injectedJavaScript: userInjectedJS,
      ...webViewProps
    },
    ref,
  ) => {
    const webViewRef = useRef<WebView>(null);

    const { onMessage, injectedJavaScript, fillForm, reinject, injectJavaScript } = useSnapfill(
      webViewRef,
      { onFormDetected, onCartDetected, onValuesCaptured, onFormFillComplete, onOtherMessage },
      snapfillOptions,
    );

    useImperativeHandle(ref, () => ({
      fillForm,
      reinject,
      injectJavaScript,
      goBack: () => webViewRef.current?.goBack(),
      goForward: () => webViewRef.current?.goForward(),
      reload: () => webViewRef.current?.reload(),
    }));

    const composedOnMessage = (event: WebViewMessageEvent) => {
      onMessage(event);
      userOnMessage?.(event);
    };

    const composedInjectedJS = userInjectedJS
      ? `${injectedJavaScript}\n${userInjectedJS}`
      : injectedJavaScript;

    return (
      <WebView
        ref={webViewRef}
        {...webViewProps}
        injectedJavaScript={composedInjectedJS}
        onMessage={composedOnMessage}
      />
    );
  },
);

SnapfillWebView.displayName = 'SnapfillWebView';

export { SnapfillWebView };
