import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, RefreshCw, Info } from 'lucide-react-native';
import { auth, db } from '../utils/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountSettingsScreen({ navigation }) {

    const handleDeleteAccount = () => {
        Alert.alert(
            '⚠️ Delete Account',
            'This will permanently delete your account and all associated data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            const user = auth.currentUser;
                            // Delete Firestore data
                            await db.collection('users').doc(user.uid).delete();
                            // Delete Firebase Auth account
                            await user.delete();
                            await AsyncStorage.clear();
                        } catch (error) {
                            if (error.code === 'auth/requires-recent-login') {
                                Alert.alert('Re-login Required', 'For security, please log out and log back in before deleting your account.');
                            } else {
                                Alert.alert('Error', error.message);
                            }
                        }
                    }
                }
            ]
        );
    };

    const handleClearCache = async () => {
        try {
            // Clear only app-specific cache, not auth tokens
            const jwt = await AsyncStorage.getItem('app_jwt');
            const notifPrefs = await AsyncStorage.getItem('notification_prefs');
            await AsyncStorage.clear();
            if (jwt) await AsyncStorage.setItem('app_jwt', jwt);
            if (notifPrefs) await AsyncStorage.setItem('notification_prefs', notifPrefs);
            Alert.alert('Success', 'App cache cleared successfully.');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#1A1A1A" size={22} />
                </TouchableOpacity>
                <Text style={styles.header}>Account Settings</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={styles.card}>
                <TouchableOpacity style={styles.row} onPress={handleClearCache}>
                    <View style={[styles.iconBg, { backgroundColor: '#EEF2FF' }]}>
                        <RefreshCw color="#0F52BA" size={18} />
                    </View>
                    <View style={styles.textBlock}>
                        <Text style={styles.label}>Clear Cache</Text>
                        <Text style={styles.desc}>Free up storage by clearing cached data</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.row}>
                    <View style={[styles.iconBg, { backgroundColor: '#F0FDF4' }]}>
                        <Info color="#16A34A" size={18} />
                    </View>
                    <View style={styles.textBlock}>
                        <Text style={styles.label}>App Version</Text>
                        <Text style={styles.desc}>Hospital Queue App v1.0.0</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Danger Zone */}
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <View style={styles.dangerCard}>
                <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAccount}>
                    <View style={[styles.iconBg, { backgroundColor: '#FEE2E2' }]}>
                        <Trash2 color="#DC2626" size={18} />
                    </View>
                    <View style={styles.textBlock}>
                        <Text style={[styles.label, { color: '#DC2626' }]}>Delete Account</Text>
                        <Text style={styles.desc}>Permanently remove your account and data</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
    card: {
        backgroundColor: 'white', borderRadius: 16, marginHorizontal: 16,
        borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden',
    },
    row: {
        flexDirection: 'row', alignItems: 'center', padding: 14,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    iconBg: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    textBlock: { flex: 1 },
    label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    desc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    dangerTitle: { fontSize: 14, fontWeight: '600', color: '#DC2626', marginTop: 24, marginBottom: 8, marginLeft: 20 },
    dangerCard: {
        backgroundColor: 'white', borderRadius: 16, marginHorizontal: 16,
        borderWidth: 1, borderColor: '#FECACA', overflow: 'hidden',
    },
    dangerRow: {
        flexDirection: 'row', alignItems: 'center', padding: 14,
    },
});
