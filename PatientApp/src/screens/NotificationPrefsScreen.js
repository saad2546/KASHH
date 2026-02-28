import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'notification_prefs';

export default function NotificationPrefsScreen({ navigation }) {
    const [prefs, setPrefs] = useState({
        queueUpdates: true,
        appointmentReminders: true,
        doctorDelays: true,
        prescriptionReady: true,
    });

    useEffect(() => {
        loadPrefs();
    }, []);

    const loadPrefs = async () => {
        try {
            const saved = await AsyncStorage.getItem(PREFS_KEY);
            if (saved) setPrefs(JSON.parse(saved));
        } catch (e) { /* use defaults */ }
    };

    const togglePref = async (key) => {
        const updated = { ...prefs, [key]: !prefs[key] };
        setPrefs(updated);
        await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    };

    const items = [
        { key: 'queueUpdates', label: 'Queue Position Updates', desc: 'Get notified when your queue position changes', icon: Clock, color: '#0F52BA' },
        { key: 'appointmentReminders', label: 'Appointment Reminders', desc: 'Receive reminders before your appointment', icon: Bell, color: '#7C3AED' },
        { key: 'doctorDelays', label: 'Doctor Delay Alerts', desc: 'Be alerted if your doctor is running late', icon: AlertTriangle, color: '#EA580C' },
        { key: 'prescriptionReady', label: 'Prescription Ready', desc: 'Notified when your prescription is available', icon: CheckCircle, color: '#16A34A' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#1A1A1A" size={22} />
                </TouchableOpacity>
                <Text style={styles.header}>Notifications</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={styles.card}>
                {items.map((item, i) => (
                    <View key={item.key} style={[styles.row, i === items.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={[styles.iconBg, { backgroundColor: item.color + '15' }]}>
                            <item.icon color={item.color} size={18} />
                        </View>
                        <View style={styles.textBlock}>
                            <Text style={styles.label}>{item.label}</Text>
                            <Text style={styles.desc}>{item.desc}</Text>
                        </View>
                        <Switch
                            value={prefs[item.key]}
                            onValueChange={() => togglePref(item.key)}
                            trackColor={{ false: '#E2E8F0', true: '#0F52BA' }}
                            thumbColor="white"
                        />
                    </View>
                ))}
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
    textBlock: { flex: 1, marginRight: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    desc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
