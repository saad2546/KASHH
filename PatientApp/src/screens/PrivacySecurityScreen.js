import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert,
    TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, KeyRound } from 'lucide-react-native';
import { auth } from '../utils/firebaseConfig';
import firebase from '../utils/firebaseConfig';

export default function PrivacySecurityScreen({ navigation }) {
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) {
            Alert.alert('Error', 'All fields are required.');
            return;
        }
        if (newPw.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters.');
            return;
        }
        if (newPw !== confirmPw) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            // Re-authenticate before password change
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPw);
            await user.reauthenticateWithCredential(credential);

            // Update password
            await user.updatePassword(newPw);

            Alert.alert('Success', 'Password changed successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Current password is incorrect.');
            } else {
                Alert.alert('Error', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#1A1A1A" size={22} />
                </TouchableOpacity>
                <Text style={styles.header}>Privacy & Security</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Lock color="#16A34A" size={20} />
                    <Text style={styles.cardTitle}>Change Password</Text>
                </View>

                <Text style={styles.label}>Current Password</Text>
                <TextInput
                    style={styles.input} secureTextEntry
                    value={currentPw} onChangeText={setCurrentPw}
                    placeholder="Enter current password"
                />

                <Text style={styles.label}>New Password</Text>
                <TextInput
                    style={styles.input} secureTextEntry
                    value={newPw} onChangeText={setNewPw}
                    placeholder="Enter new password"
                />

                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                    style={styles.input} secureTextEntry
                    value={confirmPw} onChangeText={setConfirmPw}
                    placeholder="Confirm new password"
                />

                <TouchableOpacity style={styles.changeBtn} onPress={handleChangePassword} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <KeyRound color="white" size={16} style={{ marginRight: 8 }} />
                            <Text style={styles.changeBtnText}>Update Password</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>🔒 Your Data is Secure</Text>
                <Text style={styles.infoText}>
                    Your personal and health data is encrypted and stored securely using Firebase.
                    We never share your data with third parties without your explicit consent.
                </Text>
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
        padding: 16, borderWidth: 1, borderColor: '#E2E8F0',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginLeft: 8 },
    label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4, marginTop: 12, marginLeft: 2 },
    input: {
        backgroundColor: '#F8F9FA', height: 44, borderRadius: 8, paddingHorizontal: 12,
        borderWidth: 1, borderColor: '#E2E8F0', fontSize: 14,
    },
    changeBtn: {
        flexDirection: 'row', backgroundColor: '#16A34A', paddingVertical: 12,
        borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 20,
    },
    changeBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    infoCard: {
        backgroundColor: '#F0FDF4', borderRadius: 16, marginHorizontal: 16,
        padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#BBF7D0',
    },
    infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#166534', marginBottom: 6 },
    infoText: { fontSize: 13, color: '#166534', lineHeight: 18 },
});
