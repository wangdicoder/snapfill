import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import WebView from 'react-native-webview';
import {
  useSnapfill,
  SnapfillWebView,
  type SnapfillWebViewRef,
  type SnapfillCallbacks,
  type AutofillFieldType,
  type AutofillMappings,
  type FillResult,
} from '@snap-fill/react-native';

import { CHECKOUT_HTML } from './assets/checkout';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SAMPLE_ADDRESS: AutofillMappings = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phoneNumber: '+1 555-867-5309',
  postalAddressLine1: '350 Fifth Avenue',
  postalAddressLine2: 'Suite 3400',
  postalSuburb: 'New York',
  postalState: 'NY',
  postalPostCode: '10118',
  postalCountry: 'US',
};

const SAMPLE_CARD: AutofillMappings = {
  ccNumber: '4111111111111111',
  ccName: 'JANE DOE',
  ccExpiryMonth: '06',
  ccExpiryYear: '2028',
  ccCCV: '737',
};

// ---------------------------------------------------------------------------
// Event log
// ---------------------------------------------------------------------------

type LogEntry = { id: number; type: string; summary: string; time: string };
let nextId = 0;

function timestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ---------------------------------------------------------------------------
// Hook Demo screen
// ---------------------------------------------------------------------------

function HookDemo() {
  const webViewRef = useRef<WebView>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  const addLog = useCallback((type: string, summary: string) => {
    setLog((prev) => [{ id: nextId++, type, summary, time: timestamp() }, ...prev].slice(0, 50));
  }, []);

  const callbacks: SnapfillCallbacks = {
    onFormDetected: (fields: AutofillFieldType[]) => addLog('formDetected', `${fields.length} fields: ${fields.join(', ')}`),
    onCartDetected: (cart) => addLog('cartDetected', `$${(cart.total / 100).toFixed(2)} ${cart.currency ?? ''} — ${cart.products.length} item(s)`),
    onValuesCaptured: (mappings) => addLog('valuesCaptured', `${Object.keys(mappings).length} values captured`),
    onFormFillComplete: (result: FillResult) => addLog('formFillComplete', `${result.filled}/${result.total} filled`),
    onOtherMessage: (data) => addLog('other', data.slice(0, 80)),
  };

  const { onMessage, injectedJavaScript, fillForm, reinject } = useSnapfill(webViewRef, callbacks);

  return (
    <View style={styles.flex}>
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: CHECKOUT_HTML }}
          injectedJavaScript={injectedJavaScript}
          onMessage={onMessage}
          style={styles.flex}
        />
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>useSnapfill Hook</Text>
        <View style={styles.buttonRow}>
          <Btn label="Fill Address" color="#34C759" onPress={() => fillForm(SAMPLE_ADDRESS)} />
          <Btn label="Fill Card" color="#007AFF" onPress={() => fillForm(SAMPLE_CARD)} />
          <Btn label="Fill All" color="#AF52DE" onPress={() => fillForm({ ...SAMPLE_ADDRESS, ...SAMPLE_CARD })} />
          <Btn label="Reinject" color="#FF9500" onPress={() => reinject()} />
        </View>
        <EventLog entries={log} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component Demo screen
// ---------------------------------------------------------------------------

function ComponentDemo() {
  const ref = useRef<SnapfillWebViewRef>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  const addLog = useCallback((type: string, summary: string) => {
    setLog((prev) => [{ id: nextId++, type, summary, time: timestamp() }, ...prev].slice(0, 50));
  }, []);

  return (
    <View style={styles.flex}>
      <View style={styles.webviewContainer}>
        <SnapfillWebView
          ref={ref}
          source={{ html: CHECKOUT_HTML }}
          onFormDetected={(fields) => addLog('formDetected', `${fields.length} fields: ${fields.join(', ')}`)}
          onCartDetected={(cart) => addLog('cartDetected', `$${(cart.total / 100).toFixed(2)} ${cart.currency ?? ''} — ${cart.products.length} item(s)`)}
          onValuesCaptured={(mappings) => addLog('valuesCaptured', `${Object.keys(mappings).length} values captured`)}
          onFormFillComplete={(result) => addLog('formFillComplete', `${result.filled}/${result.total} filled`)}
          onOtherMessage={(data) => addLog('other', data.slice(0, 80))}
          style={styles.flex}
        />
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>SnapfillWebView Component</Text>
        <View style={styles.buttonRow}>
          <Btn label="Fill Address" color="#34C759" onPress={() => ref.current?.fillForm(SAMPLE_ADDRESS)} />
          <Btn label="Fill Card" color="#007AFF" onPress={() => ref.current?.fillForm(SAMPLE_CARD)} />
          <Btn label="Fill All" color="#AF52DE" onPress={() => ref.current?.fillForm({ ...SAMPLE_ADDRESS, ...SAMPLE_CARD })} />
          <Btn label="Reinject" color="#FF9500" onPress={() => ref.current?.reinject()} />
        </View>
        <EventLog entries={log} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function Btn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.btn, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const TYPE_COLORS: Record<string, string> = {
  formDetected: '#007AFF',
  cartDetected: '#34C759',
  valuesCaptured: '#FF9500',
  formFillComplete: '#AF52DE',
  other: '#8E8E93',
};

function EventLog({ entries }: { entries: LogEntry[] }) {
  return (
    <ScrollView style={styles.logScroll} contentContainerStyle={styles.logContent}>
      {entries.length === 0 && <Text style={styles.logEmpty}>Waiting for events...</Text>}
      {entries.map((e) => (
        <View key={e.id} style={[styles.logEntry, { borderLeftColor: TYPE_COLORS[e.type] ?? '#8E8E93' }]}>
          <View style={styles.logHeader}>
            <Text style={[styles.logType, { color: TYPE_COLORS[e.type] ?? '#8E8E93' }]}>{e.type}</Text>
            <Text style={styles.logTime}>{e.time}</Text>
          </View>
          <Text style={styles.logSummary} numberOfLines={2}>{e.summary}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Root App with tabs
// ---------------------------------------------------------------------------

export default function App() {
  const [tab, setTab] = useState<'hook' | 'component'>('hook');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.tabBar}>
        <Pressable style={[styles.tab, tab === 'hook' && styles.tabActive]} onPress={() => setTab('hook')}>
          <Text style={[styles.tabText, tab === 'hook' && styles.tabTextActive]}>useSnapfill</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'component' && styles.tabActive]} onPress={() => setTab('component')}>
          <Text style={[styles.tabText, tab === 'component' && styles.tabTextActive]}>SnapfillWebView</Text>
        </Pressable>
      </View>
      {tab === 'hook' ? <HookDemo /> : <ComponentDemo />}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  flex: { flex: 1 },

  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },
  tabTextActive: { color: '#007AFF', fontWeight: '600' },

  // WebView
  webviewContainer: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },

  // Bottom panel
  panel: { height: 260, backgroundColor: '#1C1C1E', paddingHorizontal: 12, paddingTop: 10 },
  panelTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 8 },

  // Buttons
  buttonRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  btn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Event log
  logScroll: { flex: 1 },
  logContent: { paddingBottom: 8 },
  logEmpty: { color: '#636366', fontSize: 12, fontStyle: 'italic' },
  logEntry: { backgroundColor: '#2C2C2E', borderRadius: 6, padding: 8, marginBottom: 6, borderLeftWidth: 3 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  logType: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  logTime: { fontSize: 10, color: '#636366' },
  logSummary: { fontSize: 11, color: '#AEAEB2', lineHeight: 16 },
});
