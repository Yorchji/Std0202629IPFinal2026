import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const money = (amount) => `฿${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export default function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [clusters, setClusters] = useState(null);
  const [page, setPage] = useState('dashboard');
  const { width } = useWindowDimensions();
  const wideLayout = Platform.OS === 'web' && width >= 900;

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
    return body;
  }, [token]);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try { setEmployees(await request('/employees')); }
    catch (error) { Alert.alert('Could not load employees', error.message); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { if (token) loadEmployees(); }, [token, loadEmployees]);

  async function login() {
    if (!username.trim() || !password) return Alert.alert('Missing information', 'Enter your username and password.');
    setLoading(true);
    try {
      const result = await request('/login', { method: 'POST', body: JSON.stringify({ username: username.trim(), password }) });
      setToken(result.token);
    } catch (error) { Alert.alert('Login failed', error.message); }
    finally { setLoading(false); }
  }

  async function addEmployee() {
    if (!name.trim() || !position.trim() || !salary.trim()) return Alert.alert('Missing information', 'Complete all fields before adding an employee.');
    if (!Number.isFinite(Number(salary)) || Number(salary) < 0) return Alert.alert('Invalid salary', 'Enter a non-negative number.');
    try {
      await request('/employees', { method: 'POST', body: JSON.stringify({ name, position, salary: Number(salary) }) });
      setName(''); setPosition(''); setSalary(''); setClusters(null); await loadEmployees();
    } catch (error) { Alert.alert('Could not add employee', error.message); }
  }

  async function toggleStatus(id) {
    try { await request(`/employees/${id}/status`, { method: 'PUT' }); setClusters(null); await loadEmployees(); }
    catch (error) { Alert.alert('Could not update status', error.message); }
  }

  function confirmDelete(employee) {
    const deleteEmployee = async () => {
      try {
        await request(`/employees/${employee.id}`, { method: 'DELETE' });
        setClusters(null);
        await loadEmployees();
      } catch (error) {
        if (Platform.OS === 'web') globalThis.alert(`Could not delete employee: ${error.message}`);
        else Alert.alert('Could not delete employee', error.message);
      }
    };

    // React Native's Alert.alert is not supported in Expo web. Use the browser's
    // native confirmation dialog there, while keeping the native dialog on mobile.
    if (Platform.OS === 'web') {
      if (globalThis.confirm(`Are you sure?\nDelete ${employee.name}?`)) deleteEmployee();
      return;
    }

    Alert.alert('Are you sure?', `Delete ${employee.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deleteEmployee },
    ]);
  }

  async function analyze() {
    setAnalyzing(true);
    try { setClusters((await request('/employees/salary-clusters')).clusters); }
    catch (error) { Alert.alert('Analysis failed', error.message); }
    finally { setAnalyzing(false); }
  }

  if (!token) return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.loginCard}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>N</Text></View>
          <Text style={styles.eyebrow}>NORTHSTAR  /  PEOPLE</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to manage your team.</Text>
          <Text style={styles.label}>Username</Text>
          <TextInput accessibilityLabel="Username" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Enter username" />
          <Text style={styles.label}>Password</Text>
          <TextInput accessibilityLabel="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Enter password" />
          <Button title="Sign in" onPress={login} disabled={loading} />
          {loading && <ActivityIndicator style={styles.spinner} color="#4f46e5" />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.safe, wideLayout && styles.safeWide]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.appShell, wideLayout && styles.appShellWide]}>
        {wideLayout && <View style={styles.sidebar}>
          <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandMarkText}>N</Text></View><View><Text style={styles.brandName}>Northstar</Text><Text style={styles.brandCaption}>PEOPLE PLATFORM</Text></View></View>
          <Text style={styles.navCaption}>WORKSPACE</Text>
          <NavButton dark label="⌂   Overview" active={page === 'dashboard'} onPress={() => setPage('dashboard')} />
          <NavButton dark label="▤   Employees" active={page === 'employees'} onPress={() => setPage('employees')} />
          <NavButton dark label="＋   Manage team" active={page === 'manage'} onPress={() => setPage('manage')} />
          <View style={styles.sidebarFooter}><View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>AD</Text></View><View style={styles.profileCopy}><Text style={styles.profileName}>Administrator</Text><Text style={styles.profileRole}>HR manager</Text></View><TouchableOpacity onPress={() => { setToken(null); setClusters(null); }}><Text style={styles.signOutIcon}>↪</Text></TouchableOpacity></View>
        </View>}
        <View style={[styles.mainContent, wideLayout && styles.mainContentWide]}>
        <ScrollView contentContainerStyle={[styles.page, wideLayout && styles.pageWide]} keyboardShouldPersistTaps="handled">
        {!wideLayout && <View style={styles.mobileBrand}><View style={styles.brandMarkSmall}><Text style={styles.brandMarkText}>N</Text></View><Text style={styles.brandName}>Northstar</Text><TouchableOpacity style={styles.mobileSignOut} onPress={() => { setToken(null); setClusters(null); }}><Text style={styles.logout}>Sign out</Text></TouchableOpacity></View>}
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>{page === 'dashboard' ? 'WORKSPACE  /  OVERVIEW' : page === 'employees' ? 'WORKSPACE  /  DIRECTORY' : 'WORKSPACE  /  TEAM MANAGEMENT'}</Text><Text style={styles.title}>{page === 'dashboard' ? 'Good morning, Admin' : page === 'employees' ? 'Employee directory' : 'Manage your team'}</Text><Text style={styles.pageDescription}>{page === 'dashboard' ? 'Here’s what’s happening across your organization.' : page === 'employees' ? 'View team profiles, compensation and availability.' : 'Add team members or remove employee records.'}</Text></View>
          {wideLayout && <View style={styles.datePill}><Text style={styles.datePillDot}>●</Text><Text style={styles.datePillText}>People operations</Text></View>}
        </View>
        {!wideLayout && <View style={styles.navBar}>
          <NavButton label="Overview" active={page === 'dashboard'} onPress={() => setPage('dashboard')} />
          <NavButton label="Employees" active={page === 'employees'} onPress={() => setPage('employees')} />
          <NavButton label="Manage" active={page === 'manage'} onPress={() => setPage('manage')} />
        </View>}

        {page === 'dashboard' && <>
          <View style={[styles.statCard, wideLayout && styles.statCardWide]}><View><Text style={styles.statLabel}>YOUR TEAM AT A GLANCE</Text><Text style={styles.statValue}>{employees.length}<Text style={styles.statUnit}> team members</Text></Text><Text style={styles.statNote}>Employee records across your organization</Text></View><View style={styles.heroDecoration}><Text style={styles.heroDecorationText}>✳</Text></View></View>
          <View style={styles.metricRow}>
            <View style={styles.metricCard}><View style={styles.metricTop}><View style={[styles.metricIcon, styles.metricIconGreen]}><Text style={styles.metricIconText}>✓</Text></View><Text style={styles.metricTrend}>TEAM STATUS</Text></View><Text style={styles.metricValue}>{employees.filter((employee) => employee.status === 'Active').length}</Text><Text style={styles.metricLabel}>Active employees</Text></View>
            <View style={styles.metricCard}><View style={styles.metricTop}><View style={[styles.metricIcon, styles.metricIconAmber]}><Text style={styles.metricIconText}>◷</Text></View><Text style={styles.metricTrend}>TEAM STATUS</Text></View><Text style={styles.metricValue}>{employees.filter((employee) => employee.status === 'On Leave').length}</Text><Text style={styles.metricLabel}>Currently on leave</Text></View>
          </View>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Salary insights</Text><Text style={styles.analysisSubtitle}>Understand how compensation is distributed across your team.</Text></View><TouchableOpacity onPress={() => setPage('employees')}><Text style={styles.refresh}>Employee directory  →</Text></TouchableOpacity></View>
          <View style={[styles.analyticsPanel, wideLayout && styles.analyticsPanelWide]}><View style={styles.analyticsIntro}><View style={styles.analyticsIcon}><Text style={styles.analyticsIconText}>↗</Text></View><View style={{ flex: 1 }}><Text style={styles.analyticsTitle}>Compensation overview</Text><Text style={styles.analyticsText}>Cluster employee salaries into three pay tiers.</Text></View><View style={styles.analyticsAction}><Button title={analyzing ? 'Analyzing…' : 'Run analysis'} onPress={analyze} disabled={analyzing} /></View></View>
          {analyzing && <ActivityIndicator style={styles.spinner} color="#4f46e5" />}
          {clusters && <View style={styles.clusterList}>{clusters.length === 0 ? <Text style={styles.empty}>Add employees to analyze salary tiers.</Text> : clusters.map((cluster) => (
            <View key={cluster.group} style={styles.clusterCard}><View style={styles.clusterIcon}><Text style={styles.clusterIconText}>{cluster.group.replace('Tier ', '')}</Text></View><View style={styles.clusterInfo}><Text style={styles.clusterName}>{cluster.group}</Text><Text style={styles.clusterCount}>{cluster.count} {cluster.count === 1 ? 'employee' : 'employees'}</Text></View><View style={styles.clusterSalary}><Text style={styles.clusterAverage}>{money(cluster.centroid)}</Text><Text style={styles.clusterCaption}>average / month</Text></View></View>
          ))}</View>}</View>
        </>}

        {page === 'employees' && <>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Employee information</Text><TouchableOpacity onPress={loadEmployees}><Text style={styles.refresh}>Refresh</Text></TouchableOpacity></View>
          {loading ? <ActivityIndicator style={styles.spinner} color="#4f46e5" /> : <EmployeeList employees={employees} onToggle={toggleStatus} />}
        </>}

        {page === 'manage' && <>
          <Text style={styles.sectionTitle}>Add an employee</Text>
          <Text style={styles.analysisSubtitle}>Create a profile for a new member of your organization.</Text>
          <View style={styles.card}>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" />
            <TextInput style={styles.input} value={position} onChangeText={setPosition} placeholder="Position" />
            <TextInput style={styles.input} value={salary} onChangeText={setSalary} placeholder="Monthly base salary" keyboardType="decimal-pad" />
            <Button title="Add employee" onPress={addEmployee} />
          </View>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Remove an employee</Text><Text style={styles.countLabel}>{employees.length} total</Text></View>
          {loading ? <ActivityIndicator style={styles.spinner} color="#4f46e5" /> : <EmployeeList employees={employees} onDelete={confirmDelete} />}
        </>}
      </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function NavButton({ label, active, onPress, dark = false }) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[styles.navButton, dark && styles.sideNavButton, active && (dark ? styles.sideNavButtonActive : styles.navButtonActive)]}><Text style={[styles.navButtonText, dark && styles.sideNavButtonText, active && (dark ? styles.sideNavButtonTextActive : styles.navButtonTextActive)]}>{label}</Text></TouchableOpacity>;
}

function EmployeeList({ employees, onToggle, onDelete }) {
  if (employees.length === 0) return <Text style={styles.empty}>No employees yet. Add an employee from the Add / Delete page.</Text>;
  return <FlatList data={employees} keyExtractor={(item) => item.id} scrollEnabled={false} renderItem={({ item }) => (
    <View style={styles.employeeCard}>
      <View style={styles.employeeTop}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</Text></View><View style={styles.employeeInfo}><Text style={styles.employeeName}>{item.name}</Text><Text style={styles.employeePosition}>{item.position}</Text></View><View style={[styles.badge, item.status === 'Active' ? styles.activeBadge : styles.leaveBadge]}><Text style={[styles.badgeText, item.status === 'Active' ? styles.activeText : styles.leaveText]}>{item.status}</Text></View></View>
      <View style={styles.employeeBottom}><Text style={styles.salary}>{money(item.salary)} <Text style={styles.perMonth}>/ month</Text></Text><View style={styles.actions}>{onToggle && <TouchableOpacity style={styles.smallButton} onPress={() => onToggle(item.id)}><Text style={styles.smallButtonText}>Toggle status</Text></TouchableOpacity>}{onDelete && <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>}</View></View>
    </View>
  )} />;
}

function Button({ title, onPress, disabled }) {
  return <TouchableOpacity accessibilityRole="button" style={[styles.primaryButton, disabled && styles.disabledButton]} onPress={onPress} disabled={disabled}><Text style={styles.primaryButtonText}>{title}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f7fb' }, safeWide: { backgroundColor: '#f6f7fb' }, appShell: { flex: 1 }, appShellWide: { flexDirection: 'row' }, sidebar: { width: 248, backgroundColor: '#101d35', paddingHorizontal: 18, paddingTop: 28, paddingBottom: 16 }, mainContent: { flex: 1 }, mainContentWide: { minWidth: 0 }, page: { padding: 20, paddingBottom: 48 }, pageWide: { paddingHorizontal: 48, paddingTop: 38, paddingBottom: 60, maxWidth: 1500, width: '100%', alignSelf: 'center' }, center: { flex: 1, justifyContent: 'center', padding: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 4, marginBottom: 48 }, brandMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#665bea', alignItems: 'center', justifyContent: 'center' }, brandMarkSmall: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#665bea', alignItems: 'center', justifyContent: 'center' }, brandMarkText: { color: '#fff', fontWeight: '900', fontSize: 20 }, brandName: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 }, brandCaption: { color: '#8b98b1', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 2 }, navCaption: { color: '#7c8aa5', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginHorizontal: 10, marginBottom: 12 }, sidebarFooter: { marginTop: 'auto', borderTopColor: '#2b3952', borderTopWidth: 1, paddingTop: 18, flexDirection: 'row', alignItems: 'center' }, profileAvatar: { height: 36, width: 36, borderRadius: 12, backgroundColor: '#293958', justifyContent: 'center', alignItems: 'center' }, profileAvatarText: { color: '#d9ddff', fontSize: 11, fontWeight: '800' }, profileCopy: { flex: 1, marginLeft: 10 }, profileName: { color: '#f4f6fa', fontSize: 12, fontWeight: '700' }, profileRole: { color: '#8997af', fontSize: 10, marginTop: 3 }, signOutIcon: { color: '#9aa7bb', fontSize: 20, paddingHorizontal: 5 }, mobileBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 9 }, mobileSignOut: { marginLeft: 'auto' },
  loginCard: { backgroundColor: '#fff', borderRadius: 22, padding: 28, width: '100%', maxWidth: 430, alignSelf: 'center', shadowColor: '#172554', shadowOpacity: 0.08, shadowRadius: 22, elevation: 3 },
  eyebrow: { color: '#756be5', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 }, title: { color: '#172238', fontSize: 30, fontWeight: '800', letterSpacing: -0.7 }, pageDescription: { color: '#858da0', fontSize: 14, marginTop: 8, lineHeight: 21 }, subtitle: { color: '#7b8497', fontSize: 14, marginTop: 7, marginBottom: 25 },
  label: { color: '#354057', fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 10 }, input: { backgroundColor: '#fff', borderColor: '#e2e6ef', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, color: '#172238', fontSize: 14, marginBottom: 11 },
  primaryButton: { backgroundColor: '#5146dc', borderRadius: 10, minHeight: 45, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 }, primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' }, disabledButton: { opacity: 0.6 }, spinner: { marginVertical: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 27 }, logout: { color: '#635ad4', fontWeight: '700', padding: 8 }, datePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#eceef3' }, datePillDot: { color: '#37a872', fontSize: 9 }, datePillText: { color: '#5f6879', fontSize: 12, fontWeight: '700' },
  navBar: { flexDirection: 'row', backgroundColor: '#e9ebf2', borderRadius: 12, padding: 4, marginBottom: 23, gap: 4 }, navButton: { flex: 1, borderRadius: 9, paddingVertical: 12, paddingHorizontal: 10, marginBottom: 5, alignItems: 'center' }, navButtonActive: { backgroundColor: '#fff', shadowColor: '#101d35', shadowOpacity: 0.09, shadowRadius: 5, elevation: 2 }, navButtonText: { color: '#717b8f', fontSize: 12, fontWeight: '700' }, navButtonTextActive: { color: '#5146dc' }, sideNavButton: { alignItems: 'flex-start', paddingHorizontal: 12 }, sideNavButtonActive: { backgroundColor: '#263551' }, sideNavButtonText: { color: '#aab4c6', fontSize: 13 }, sideNavButtonTextActive: { color: '#fff' },
  statCard: { borderRadius: 17, padding: 24, backgroundColor: '#5146dc', marginBottom: 22, overflow: 'hidden', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, statCardWide: { padding: 29, minHeight: 170 }, statLabel: { color: '#d9d6ff', fontWeight: '800', fontSize: 10, letterSpacing: 1.4 }, statValue: { color: '#fff', fontWeight: '800', fontSize: 38, marginTop: 8 }, statUnit: { color: '#e1dfff', fontSize: 15, fontWeight: '600' }, statNote: { color: '#e4e2ff', fontSize: 13, marginTop: 5 }, heroDecoration: { height: 102, width: 102, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-12deg' }] }, heroDecorationText: { color: 'rgba(255,255,255,0.75)', fontSize: 63 },
  metricRow: { flexDirection: 'row', gap: 14, marginBottom: 30 }, metricCard: { flex: 1, backgroundColor: '#fff', padding: 18, borderRadius: 14, borderColor: '#eaedf3', borderWidth: 1 }, metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }, metricIcon: { height: 34, width: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, metricIconGreen: { backgroundColor: '#e8f6ef' }, metricIconAmber: { backgroundColor: '#fff4df' }, metricIconText: { color: '#3f9871', fontSize: 16, fontWeight: '800' }, metricTrend: { color: '#a0a8b6', fontSize: 9, letterSpacing: 1, fontWeight: '800' }, metricLabel: { color: '#8991a2', fontSize: 12, fontWeight: '600', marginTop: 2 }, metricValue: { color: '#202a3c', fontWeight: '800', fontSize: 27 }, countLabel: { color: '#858da0', fontSize: 12, marginBottom: 12 },
  sectionTitle: { color: '#202a3c', fontSize: 18, fontWeight: '800', marginBottom: 7 }, card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 25, borderWidth: 1, borderColor: '#eaedf3' }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }, refresh: { color: '#5146dc', fontWeight: '700', fontSize: 12, marginBottom: 12 }, empty: { color: '#7b8497', textAlign: 'center', marginVertical: 20, lineHeight: 20 },
  employeeCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#eaedf3', padding: 17, marginBottom: 11, shadowColor: '#172554', shadowOpacity: 0.025, shadowRadius: 5, elevation: 1 }, employeeTop: { flexDirection: 'row', alignItems: 'center' }, avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#f0efff', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#5146dc', fontWeight: '800', fontSize: 13 }, employeeInfo: { flex: 1, marginLeft: 11 }, employeeName: { color: '#202a3c', fontSize: 14, fontWeight: '800' }, employeePosition: { color: '#858da0', fontSize: 12, marginTop: 3 }, badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }, activeBadge: { backgroundColor: '#e8f6ee' }, leaveBadge: { backgroundColor: '#fff5e4' }, badgeText: { fontSize: 10, fontWeight: '800' }, activeText: { color: '#238354' }, leaveText: { color: '#a76a00' },
  employeeBottom: { borderTopColor: '#f0f1f5', borderTopWidth: 1, marginTop: 14, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }, salary: { color: '#28334a', fontSize: 14, fontWeight: '800' }, perMonth: { color: '#98a0b1', fontWeight: '500', fontSize: 11 }, actions: { flexDirection: 'row', gap: 7 }, smallButton: { backgroundColor: '#f0efff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }, smallButtonText: { color: '#5146dc', fontSize: 10, fontWeight: '800' }, deleteButton: { backgroundColor: '#fff0f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }, deleteText: { color: '#c84444', fontSize: 10, fontWeight: '800' },
  analysisSubtitle: { color: '#858da0', fontSize: 12, marginTop: 1, marginBottom: 15, lineHeight: 18 }, analyticsPanel: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eaedf3', borderRadius: 15, padding: 18 }, analyticsPanelWide: { padding: 22 }, analyticsIntro: { flexDirection: 'row', alignItems: 'center', gap: 12 }, analyticsIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0efff', alignItems: 'center', justifyContent: 'center' }, analyticsIconText: { color: '#5146dc', fontWeight: '900', fontSize: 20 }, analyticsTitle: { color: '#202a3c', fontWeight: '800', fontSize: 14 }, analyticsText: { color: '#8a92a2', fontSize: 11, marginTop: 4 }, analyticsAction: { minWidth: 120 }, clusterList: { marginTop: 15 }, clusterCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafbfe', borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: '#f0f1f5' }, clusterIcon: { backgroundColor: '#eeedff', width: 39, height: 39, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }, clusterIconText: { color: '#5146dc', fontWeight: '800', fontSize: 15 }, clusterInfo: { flex: 1, marginLeft: 11 }, clusterName: { color: '#202a3c', fontWeight: '800', fontSize: 14 }, clusterCount: { color: '#8b93a4', fontSize: 11, marginTop: 3 }, clusterSalary: { alignItems: 'flex-end' }, clusterAverage: { color: '#26334c', fontWeight: '800', fontSize: 14 }, clusterCaption: { color: '#9aa2b1', fontSize: 10, marginTop: 3 },
});
