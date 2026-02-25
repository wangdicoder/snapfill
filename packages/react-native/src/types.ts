import type { WebViewProps } from 'react-native-webview';
import type {
  AutofillFieldType,
  AutofillMappings,
  AutofillCartInfo,
  AutofillMessage,
  FillResult,
} from '@snapfill/core';

/** Minimal interface for the WebView ref — avoids tight coupling to a specific react-native-webview version. */
export interface WebViewLike {
  injectJavaScript: (script: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
}

/** Options controlling which snapfill scripts are injected. */
export interface SnapfillOptions {
  /** Inject form detection script. Default: true */
  detectForms?: boolean;
  /** Inject cart detection script. Default: true */
  detectCart?: boolean;
  /** Inject value capture script. Default: true */
  captureValues?: boolean;
}

/** Callbacks invoked when snapfill messages arrive from the WebView. */
export interface SnapfillCallbacks {
  /** Called when form fields are detected on the page. */
  onFormDetected?: (fields: AutofillFieldType[]) => void;
  /** Called when shopping cart data is detected. */
  onCartDetected?: (cart: Omit<AutofillCartInfo, 'source'>) => void;
  /** Called when form field values are captured. */
  onValuesCaptured?: (mappings: Record<string, string>) => void;
  /** Called when a form fill operation completes. */
  onFormFillComplete?: (result: FillResult) => void;
  /** Called for any non-snapfill message from the WebView. */
  onOtherMessage?: (data: string) => void;
}

/** Handle returned by the useSnapfill hook. */
export interface SnapfillHandle {
  /** Stable onMessage handler — pass directly to WebView's onMessage prop. */
  onMessage: (event: { nativeEvent: { data: string } }) => void;
  /** Combined injection script string — pass to WebView's injectedJavaScript. */
  injectedJavaScript: string;
  /** Inject a fill script for the given field mappings. */
  fillForm: (mappings: AutofillMappings) => void;
  /** Re-inject detection scripts (useful after SPA navigation). */
  reinject: () => void;
  /** Proxy to the WebView ref's injectJavaScript. */
  injectJavaScript: (script: string) => void;
}

/** Ref handle exposed by the SnapfillWebView component. */
export interface SnapfillWebViewRef {
  fillForm: (mappings: AutofillMappings) => void;
  reinject: () => void;
  injectJavaScript: (script: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
}

/** Props for the SnapfillWebView component. */
export interface SnapfillWebViewProps extends WebViewProps {
  /** Snapfill-specific callbacks. */
  onFormDetected?: SnapfillCallbacks['onFormDetected'];
  onCartDetected?: SnapfillCallbacks['onCartDetected'];
  onValuesCaptured?: SnapfillCallbacks['onValuesCaptured'];
  onFormFillComplete?: SnapfillCallbacks['onFormFillComplete'];
  onOtherMessage?: SnapfillCallbacks['onOtherMessage'];
  /** Options controlling which scripts are injected. */
  snapfillOptions?: SnapfillOptions;
}

// Re-export core types consumers commonly need
export type {
  AutofillFieldType,
  AutofillMappings,
  AutofillCartInfo,
  AutofillMessage,
  FillResult,
};
