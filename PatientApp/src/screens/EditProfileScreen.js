import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Alert,
    StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save } from 'lucide-react-native';
import { auth, db } from '../utils/firebaseConfig';

export default function EditProfileScreen({ navigation, route }) {
    const existingData = route.params?.userData || {};
    const onRefresh = route.params?.onRefresh;

    const [fullName, setFullName] = useState(existingData.full_name || '');
    const [phone, setPhone] = useState(existingData.phone || '');
    const [age, setAge] = useState(existingData.age?.toString() || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Full name is required.');
            return;
        }

        setSaving(true);
        try {
            const uid = auth.currentUser.uid;
            await db.collection('users').doc(uid).update({
                full_name: fullName.trim(),
                phone: phone.trim(),
                age: age ? parseInt(age) : null,
            });

            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => { onRefresh && onRefresh(); navigation.goBack(); } }
            ]);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#1A1A1A" size={22} />
                </TouchableOpacity>
                <Text style={styles.header}>Edit Profile</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your name" />

                <Text style={styles.label}>Email</Text>
                <TextInput style={[styles.input, styles.disabled]} value={existingData.email || ''} editable={false} />
                <Text style={styles.hint}>Email cannot be changed here</Text>

                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Your phone number" keyboardType="phone-pad" />

                <Text style={styles.label}>Age</Text>
                <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Your age" keyboardType="numeric" />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Save color="white" size={18} style={{ marginRight: 8 }} />
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
    label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 16, marginLeft: 4 },
    input: {
        backgroundColor: 'white', height: 48, borderRadius: 10, paddingHorizontal: 14,
        borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15, color: '#1A1A1A',
    },
    disabled: { backgroundColor: '#F1F5F9', color: '#94A3B8' },
    hint: { fontSize: 11, color: '#94A3B8', marginTop: 4, marginLeft: 4 },
    saveBtn: {
        flexDirection: 'row', backgroundColor: '#0F52BA', paddingVertical: 14,
        borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 32,
    },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
