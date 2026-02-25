import { useCallback, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
// Import from the injectable-only entry point to avoid pulling in DOM-dependent
// code (formFiller.ts etc.) that references HTMLInputElement at the top level.
import {
  formDetectorScript,
  cartDetectorScript,
  valueCaptureScript,
  buildFillScript,
} from '@snapfill/core/injectable';

import { DEFAULT_SNAPFILL_OPTIONS } from './constants';
import { parseSnapfillMessage } from './parseMessage';
import type { SnapfillCallbacks, SnapfillHandle, SnapfillOptions, WebViewLike } from './types';

/**
 * React Native hook that wires up @snapfill/core scripts to a WebView ref.
 *
 * Returns a stable `onMessage` handler and `injectedJavaScript` string to pass
 * to the WebView, plus `fillForm` and `reinject` methods.
 *
 * The ref accepts any object with an `injectJavaScript` method — this avoids
 * tight coupling to a specific react-native-webview version.
 */
export function useSnapfill(
  webViewRef: RefObject<WebViewLike | null>,
  callbacks?: SnapfillCallbacks,
  options?: SnapfillOptions,
): SnapfillHandle {
  const opts = { ...DEFAULT_SNAPFILL_OPTIONS, ...options };

  // Store callbacks in a ref so onMessage is stable and doesn't cause WebView re-renders
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const injectedJavaScript = useMemo(() => {
    const scripts: string[] = [];
    if (opts.detectForms) scripts.push(formDetectorScript);
    if (opts.detectCart) scripts.push(cartDetectorScript);
    if (opts.captureValues) scripts.push(valueCaptureScript);
    // Android react-native-webview requires injected JS to end with `true;`
    return scripts.join('\n') + '\ntrue;';
  }, [opts.detectForms, opts.detectCart, opts.captureValues]);

  const injectJavaScript = useCallback(
    (script: string) => {
      webViewRef.current?.injectJavaScript(script);
    },
    [webViewRef],
  );

  const onMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      const raw = event.nativeEvent.data;
      const result = parseSnapfillMessage(raw);
      const cb = callbacksRef.current;

      if (!result.ok) {
        cb?.onOtherMessage?.(result.data);
        return;
      }

      const msg = result.message;
      switch (msg.type) {
        case 'formDetected':
          cb?.onFormDetected?.(msg.fields);
          break;
        case 'cartDetected':
          cb?.onCartDetected?.(msg.cart);
          break;
        case 'valuesCaptured':
          cb?.onValuesCaptured?.(msg.mappings);
          break;
        case 'formFillComplete':
          cb?.onFormFillComplete?.(msg.result);
          break;
      }
    },
    [],
  );

  const fillForm = useCallback(
    (mappings: Parameters<typeof buildFillScript>[0]) => {
      const script = buildFillScript(mappings) + '\ntrue;';
      webViewRef.current?.injectJavaScript(script);
    },
    [webViewRef],
  );

  const reinject = useCallback(() => {
    webViewRef.current?.injectJavaScript(injectedJavaScript);
  }, [webViewRef, injectedJavaScript]);

  return { onMessage, injectedJavaScript, fillForm, reinject, injectJavaScript };
}
