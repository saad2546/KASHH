import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Users, Activity, AlertCircle } from 'lucide-react-native';

export default function VisitStatusScreen() {
    const [queuePos, setQueuePos] = useState(7);
    const [waitTime, setWaitTime] = useState(62);
    const [alertMsg, setAlertMsg] = useState('');

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setQueuePos((prev) => Math.max(0, prev - 1));
            setWaitTime((prev) => Math.max(0, prev - 8));

            // Randomly trigger an alert for demo purposes
            if (Math.random() > 0.8) {
                setAlertMsg('Emergency case added. Wait time adjusted.');
                setTimeout(() => setAlertMsg(''), 5000);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>My Visit Status</Text>

            {alertMsg ? (
                <View style={styles.alertBanner}>
                    <AlertCircle color="#DC2626" size={20} />
                    <Text style={styles.alertText}>{alertMsg}</Text>
                </View>
            ) : null}

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={styles.statusCard}>
                    <View style={styles.header}>
                        <Text style={styles.doctorName}>Dr. Ayesha Khan</Text>
                        <View style={styles.badge}>
                            <View style={styles.dot} />
                            <Text style={styles.badgeText}>Consulting</Text>
                        </View>
                    </View>

                    <View style={styles.metricRow}>
                        <View style={styles.metric}>
                            <Users color="#0F52BA" size={24} />
                            <Text style={styles.metricValue}>{queuePos}</Text>
                            <Text style={styles.metricLabel}>Patients Ahead</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.metric}>
                            <Clock color="#0F52BA" size={24} />
                            <Text style={styles.metricValue}>{waitTime}m</Text>
                            <Text style={styles.metricLabel}>Expected Wait</Text>
                        </View>
                    </View>

                    <View style={styles.footerRow}>
                        <Activity color="#10B981" size={16} />
                        <Text style={styles.footerText}>AI Confidence: 89%</Text>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Recommendations</Text>
                    <Text style={styles.infoDesc}>Please plan to arrive at the hospital by <Text style={{ fontWeight: 'bold' }}>5:40 PM</Text>.</Text>
                    <Text style={styles.infoDesc}>Your current token number is <Text style={{ fontWeight: 'bold' }}>A-042</Text>.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginVertical: 16, color: '#1A1A1A' },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    alertText: { color: '#991B1B', marginLeft: 8, fontWeight: '500' },
    statusCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        marginBottom: 16,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    doctorName: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706', marginRight: 6 },
    badgeText: { fontSize: 12, color: '#B45309', fontWeight: '600' },
    metricRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 24 },
    metric: { alignItems: 'center' },
    metricValue: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', marginTop: 8 },
    metricLabel: { fontSize: 14, color: '#64748B', marginTop: 4 },
    verticalDivider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    footerText: { fontSize: 14, color: '#10B981', marginLeft: 8, fontWeight: '500' },
    infoCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    infoTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
    infoDesc: { fontSize: 14, color: '#475569', marginBottom: 4, lineHeight: 20 },
});
