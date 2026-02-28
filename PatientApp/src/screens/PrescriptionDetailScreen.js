import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, Share2 } from 'lucide-react-native';

export default function PrescriptionDetailScreen({ route }) {
    const { prescription } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={styles.header}>Prescription Details</Text>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Consultation Info</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Date</Text>
                        <Text style={styles.value}>{prescription.date}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Doctor</Text>
                        <Text style={styles.value}>{prescription.doctor}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Diagnosis</Text>
                        <Text style={styles.value}>{prescription.diagnosis}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Medicines</Text>
                    <View style={styles.medicineItem}>
                        <Text style={styles.medName}>Paracetamol 500mg</Text>
                        <Text style={styles.medInstructions}>1 tablet, twice daily for 3 days</Text>
                        <Text style={styles.medNote}>Note: Take after meals</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.medicineItem}>
                        <Text style={styles.medName}>Cough Syrup</Text>
                        <Text style={styles.medInstructions}>10ml, thrice daily for 5 days</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtnPrimary}>
                        <Download color="white" size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.actionBtnTextPrimary}>Download PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnSecondary}>
                        <Share2 color="#0F52BA" size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.actionBtnTextSecondary}>Share</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16 },
    header: { fontSize: 24, fontWeight: 'bold', marginVertical: 16, color: '#1A1A1A' },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    label: { fontSize: 14, color: '#64748B' },
    value: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    medicineItem: { marginBottom: 16 },
    medName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
    medInstructions: { fontSize: 14, color: '#475569', marginTop: 4 },
    medNote: { fontSize: 12, color: '#D97706', marginTop: 4, fontStyle: 'italic' },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    actionBtnPrimary: {
        flex: 2,
        flexDirection: 'row',
        backgroundColor: '#0F52BA',
        paddingVertical: 14,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnTextPrimary: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    actionBtnSecondary: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        paddingVertical: 14,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    actionBtnTextSecondary: { color: '#0F52BA', fontSize: 16, fontWeight: 'bold' },
});
