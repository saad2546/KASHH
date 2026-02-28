import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert,
    ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Settings, LogOut, Bell, Shield, CircleUserRound,
    ChevronRight, Mail, Phone, Calendar, Edit3
} from 'lucide-react-native';
import { auth, db } from '../utils/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const doc = await db.collection('users').doc(currentUser.uid).get();
                if (doc.exists) {
                    setUserData(doc.data());
                } else {
                    // Fallback to Firebase Auth data if Firestore doc doesn't exist
                    setUserData({
                        full_name: currentUser.displayName || 'Patient',
                        email: currentUser.email,
                        uid: currentUser.uid,
                        role: 'patient',
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out', style: 'destructive',
                    onPress: async () => {
                        try {
                            await auth.signOut();
                            await AsyncStorage.removeItem('app_jwt');
                        } catch (error) {
                            Alert.alert('Logout Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0F52BA" />
                <Text style={{ marginTop: 12, color: '#64748B' }}>Loading profile...</Text>
            </SafeAreaView>
        );
    }

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.header}>My Profile</Text>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {getInitials(userData?.full_name)}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>{userData?.full_name || 'Patient'}</Text>
                        <Text style={styles.roleTag}>
                            {userData?.role === 'patient' ? '🏥 Patient' : userData?.role}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => navigation.navigate('EditProfile', { userData, onRefresh: fetchUserProfile })}
                    >
                        <Edit3 color="#0F52BA" size={18} />
                    </TouchableOpacity>
                </View>

                {/* Info Cards */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Mail color="#64748B" size={18} />
                        <View style={styles.infoTextBlock}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{userData?.email || 'Not set'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Phone color="#64748B" size={18} />
                        <View style={styles.infoTextBlock}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <Text style={styles.infoValue}>{userData?.phone || 'Not set'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Calendar color="#64748B" size={18} />
                        <View style={styles.infoTextBlock}>
                            <Text style={styles.infoLabel}>Age</Text>
                            <Text style={styles.infoValue}>{userData?.age ? `${userData.age} years` : 'Not set'}</Text>
                        </View>
                    </View>
                </View>

                {/* Settings Menu */}
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.sectionList}>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => navigation.navigate('NotificationPrefs')}
                    >
                        <View style={[styles.rowIconBg, { backgroundColor: '#EEF2FF' }]}>
                            <Bell color="#0F52BA" size={18} />
                        </View>
                        <Text style={styles.rowText}>Notification Preferences</Text>
                        <ChevronRight color="#94A3B8" size={18} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => navigation.navigate('PrivacySecurity')}
                    >
                        <View style={[styles.rowIconBg, { backgroundColor: '#F0FDF4' }]}>
                            <Shield color="#16A34A" size={18} />
                        </View>
                        <Text style={styles.rowText}>Privacy & Security</Text>
                        <ChevronRight color="#94A3B8" size={18} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.row, { borderBottomWidth: 0 }]}
                        onPress={() => navigation.navigate('AccountSettings')}
                    >
                        <View style={[styles.rowIconBg, { backgroundColor: '#FFF7ED' }]}>
                            <Settings color="#EA580C" size={18} />
                        </View>
                        <Text style={styles.rowText}>Account Settings</Text>
                        <ChevronRight color="#94A3B8" size={18} />
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut color="#DC2626" size={18} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutBtnText}>Log Out</Text>
                </TouchableOpacity>

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16 },
    header: { fontSize: 26, fontWeight: 'bold', marginVertical: 16, color: '#1A1A1A' },
    profileCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'white', padding: 20, borderRadius: 16,
        marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    },
    avatarCircle: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#0F52BA', justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    profileInfo: { flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
    roleTag: { fontSize: 13, color: '#64748B', marginTop: 2 },
    editBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center',
    },
    infoSection: {
        backgroundColor: 'white', borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    infoTextBlock: { marginLeft: 12, flex: 1 },
    infoLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
    infoValue: { fontSize: 15, color: '#1A1A1A', marginTop: 1 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8, marginLeft: 4 },
    sectionList: {
        backgroundColor: 'white', borderRadius: 16,
        borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row', alignItems: 'center', padding: 14,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    rowIconBg: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    rowText: { fontSize: 15, color: '#1A1A1A', flex: 1 },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: 8, padding: 14, backgroundColor: '#FEE2E2', borderRadius: 12,
    },
    logoutBtnText: { color: '#DC2626', fontSize: 15, fontWeight: 'bold' },
});
