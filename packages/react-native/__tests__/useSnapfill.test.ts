import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock calls are hoisted — factory must not reference top-level variables.
vi.mock('@snap-fill/core/injectable', () => ({
  formDetectorScript: '/* formDetector */',
  cartDetectorScript: '/* cartDetector */',
  valueCaptureScript: '/* valueCapture */',
  buildFillScript: vi.fn((mappings: Record<string, string>) =>
    `(function(){fill(${JSON.stringify(mappings)})})();`,
  ),
}));

const mockCallbacksRef = { current: null as unknown };
vi.mock('react', () => ({
  useCallback: (fn: Function) => fn,
  useMemo: (fn: Function) => fn(),
  useRef: (init?: unknown) => (init !== undefined ? { current: init } : mockCallbacksRef),
}));

import { buildFillScript } from '@snap-fill/core/injectable';
import { useSnapfill } from '../src/useSnapfill';
import type { SnapfillCallbacks } from '../src/types';

function createMockWebViewRef() {
  return {
    current: {
      injectJavaScript: vi.fn(),
      goBack: vi.fn(),
      goForward: vi.fn(),
      reload: vi.fn(),
    },
  };
}

function createMessageEvent(data: string) {
  return { nativeEvent: { data } } as never;
}

describe('useSnapfill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('injectedJavaScript', () => {
    it('includes all scripts by default', () => {
      const ref = createMockWebViewRef();
      const { injectedJavaScript } = useSnapfill(ref as never);

      expect(injectedJavaScript).toContain('/* formDetector */');
      expect(injectedJavaScript).toContain('/* cartDetector */');
      expect(injectedJavaScript).toContain('/* valueCapture */');
      expect(injectedJavaScript.endsWith('\ntrue;')).toBe(true);
    });

    it('excludes cart script when detectCart is false', () => {
      const ref = createMockWebViewRef();
      const { injectedJavaScript } = useSnapfill(ref as never, undefined, { detectCart: false });

      expect(injectedJavaScript).toContain('/* formDetector */');
      expect(injectedJavaScript).not.toContain('/* cartDetector */');
      expect(injectedJavaScript).toContain('/* valueCapture */');
    });

    it('excludes form script when detectForms is false', () => {
      const ref = createMockWebViewRef();
      const { injectedJavaScript } = useSnapfill(ref as never, undefined, { detectForms: false });

      expect(injectedJavaScript).not.toContain('/* formDetector */');
      expect(injectedJavaScript).toContain('/* cartDetector */');
      expect(injectedJavaScript).toContain('/* valueCapture */');
    });

    it('excludes value capture script when captureValues is false', () => {
      const ref = createMockWebViewRef();
      const { injectedJavaScript } = useSnapfill(ref as never, undefined, {
        captureValues: false,
      });

      expect(injectedJavaScript).toContain('/* formDetector */');
      expect(injectedJavaScript).toContain('/* cartDetector */');
      expect(injectedJavaScript).not.toContain('/* valueCapture */');
    });

    it('ends with true; even when all scripts disabled', () => {
      const ref = createMockWebViewRef();
      const { injectedJavaScript } = useSnapfill(ref as never, undefined, {
        detectForms: false,
        detectCart: false,
        captureValues: false,
      });

      expect(injectedJavaScript).toBe('\ntrue;');
    });
  });

  describe('onMessage', () => {
    it('dispatches formDetected to callback', () => {
      const ref = createMockWebViewRef();
      const callbacks: SnapfillCallbacks = { onFormDetected: vi.fn() };
      mockCallbacksRef.current = callbacks;

      const { onMessage } = useSnapfill(ref as never, callbacks);

      const data = JSON.stringify({ type: 'formDetected', fields: ['email', 'firstName'] });
      onMessage(createMessageEvent(data));

      expect(callbacks.onFormDetected).toHaveBeenCalledWith(['email', 'firstName']);
    });

    it('dispatches cartDetected to callback', () => {
      const ref = createMockWebViewRef();
      const cart = { total: 1500, currency: 'AUD', products: [] };
      const callbacks: SnapfillCallbacks = { onCartDetected: vi.fn() };
      mockCallbacksRef.current = callbacks;

      const { onMessage } = useSnapfill(ref as never, callbacks);

      const data = JSON.stringify({ type: 'cartDetected', cart });
      onMessage(createMessageEvent(data));

      expect(callbacks.onCartDetected).toHaveBeenCalledWith(cart);
    });

    it('dispatches valuesCaptured to callback', () => {
      const ref = createMockWebViewRef();
      const mappings = { email: 'test@test.com' };
      const callbacks: SnapfillCallbacks = { onValuesCaptured: vi.fn() };
      mockCallbacksRef.current = callbacks;

      const { onMessage } = useSnapfill(ref as never, callbacks);

      const data = JSON.stringify({ type: 'valuesCaptured', mappings });
      onMessage(createMessageEvent(data));

      expect(callbacks.onValuesCaptured).toHaveBeenCalledWith(mappings);
    });

    it('dispatches formFillComplete to callback', () => {
      const ref = createMockWebViewRef();
      const result = { filled: 5, total: 5, failed: [] };
      const callbacks: SnapfillCallbacks = { onFormFillComplete: vi.fn() };
      mockCallbacksRef.current = callbacks;

      const { onMessage } = useSnapfill(ref as never, callbacks);

      const data = JSON.stringify({ type: 'formFillComplete', result });
      onMessage(createMessageEvent(data));

      expect(callbacks.onFormFillComplete).toHaveBeenCalledWith(result);
    });

    it('dispatches non-snapfill messages to onOtherMessage', () => {
      const ref = createMockWebViewRef();
      const callbacks: SnapfillCallbacks = { onOtherMessage: vi.fn() };
      mockCallbacksRef.current = callbacks;

      const { onMessage } = useSnapfill(ref as never, callbacks);

      onMessage(createMessageEvent('some random string'));

      expect(callbacks.onOtherMessage).toHaveBeenCalledWith('some random string');
    });

    it('handles missing callbacks gracefully', () => {
      const ref = createMockWebViewRef();
      mockCallbacksRef.current = undefined;

      const { onMessage } = useSnapfill(ref as never);

      const data = JSON.stringify({ type: 'formDetected', fields: ['email'] });
      expect(() => onMessage(createMessageEvent(data))).not.toThrow();
      expect(() => onMessage(createMessageEvent('not json'))).not.toThrow();
    });
  });

  describe('fillForm', () => {
    it('injects fill script via WebView ref', () => {
      const ref = createMockWebViewRef();
      const { fillForm } = useSnapfill(ref as never);

      const mappings = { firstName: 'Jane', lastName: 'Doe' };
      fillForm(mappings);

      expect(buildFillScript).toHaveBeenCalledWith(mappings);
      expect(ref.current.injectJavaScript).toHaveBeenCalledOnce();
      const injected = ref.current.injectJavaScript.mock.calls[0][0] as string;
      expect(injected).toContain('Jane');
      expect(injected).toContain('Doe');
      expect(injected.endsWith('\ntrue;')).toBe(true);
    });

    it('handles null ref gracefully', () => {
      const ref = { current: null };
      const { fillForm } = useSnapfill(ref as never);

      expect(() => fillForm({ firstName: 'Jane' })).not.toThrow();
    });
  });

  describe('reinject', () => {
    it('re-injects the detection scripts', () => {
      const ref = createMockWebViewRef();
      const { reinject, injectedJavaScript } = useSnapfill(ref as never);

      reinject();

      expect(ref.current.injectJavaScript).toHaveBeenCalledWith(injectedJavaScript);
    });

    it('handles null ref gracefully', () => {
      const ref = { current: null };
      const { reinject } = useSnapfill(ref as never);

      expect(() => reinject()).not.toThrow();
    });
  });

  describe('injectJavaScript', () => {
    it('proxies to WebView ref', () => {
      const ref = createMockWebViewRef();
      const { injectJavaScript } = useSnapfill(ref as never);

      injectJavaScript('alert("hello")');

      expect(ref.current.injectJavaScript).toHaveBeenCalledWith('alert("hello")');
    });

    it('handles null ref gracefully', () => {
      const ref = { current: null };
      const { injectJavaScript } = useSnapfill(ref as never);

      expect(() => injectJavaScript('alert("hello")')).not.toThrow();
    });
  });
});
