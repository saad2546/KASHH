import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

const SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM'];

export default function SlotSelectionScreen({ route, navigation }) {
    const { doctor, intakeData } = route.params;
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [smartMode, setSmartMode] = useState(false);

    const handleBooking = () => {
        if (!selectedSlot) return;
        navigation.navigate('BookingConfirmation', {
            doctor,
            slot: selectedSlot,
            intakeData,
        });
    };

    const handleSmartModeToggle = (value) => {
        setSmartMode(value);
        if (value) {
            // Simulate AI slot suggestion
            setTimeout(() => setSelectedSlot('04:30 PM'), 800);
        }
    };

    // Urgency color indicator
    const urgencyColor = intakeData?.urgency_score >= 7 ? '#DC2626'
        : intakeData?.urgency_score >= 4 ? '#EA580C' : '#16A34A';

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#1A1A1A" size={22} />
                </TouchableOpacity>
                <Text style={styles.header}>Select Time Slot</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {/* Doctor + Priority Badge */}
                <View style={styles.doctorCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.doctorName}>{doctor.name}</Text>
                        <Text style={styles.doctorSpec}>{doctor.specialty}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: urgencyColor + '20', borderColor: urgencyColor }]}>
                        <Text style={[styles.priorityText, { color: urgencyColor }]}>
                            Priority: {intakeData?.priority_score}
                        </Text>
                    </View>
                </View>

                {/* Complaint Summary */}
                {intakeData?.complaint && (
                    <View style={styles.complaintSummary}>
                        <Text style={styles.complaintLabel}>Complaint</Text>
                        <Text style={styles.complaintText}>{intakeData.complaint}</Text>
                    </View>
                )}

                {/* Smart Mode Toggle */}
                <View style={styles.smartModeContainer}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.smartModeTitle}>Smart Agent Mode</Text>
                        <Text style={styles.smartModeDesc}>AI suggests best slot for lowest wait time.</Text>
                    </View>
                    <Switch value={smartMode} onValueChange={handleSmartModeToggle} />
                </View>

                {/* Time Slots */}
                <Text style={styles.slotsTitle}>Available Slots</Text>
                <View style={styles.slotsContainer}>
                    {SLOTS.map((slot) => (
                        <TouchableOpacity
                            key={slot}
                            style={[styles.slot, selectedSlot === slot && styles.slotSelected]}
                            onPress={() => setSelectedSlot(slot)}
                        >
                            <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextSelected]}>{slot}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Book Button */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <TouchableOpacity
                    style={[styles.bookBtn, !selectedSlot && styles.bookBtnDisabled]}
                    disabled={!selectedSlot}
                    onPress={handleBooking}
                >
                    <Text style={styles.bookBtnText}>
                        Confirm Booking {selectedSlot && `for ${selectedSlot}`}
                    </Text>
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
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    },
    header: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
    doctorCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'white', padding: 14, borderRadius: 12, marginBottom: 12,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    doctorName: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
    doctorSpec: { fontSize: 13, color: '#64748B', marginTop: 2 },
    priorityBadge: {
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
        borderWidth: 1,
    },
    priorityText: { fontSize: 12, fontWeight: 'bold' },
    complaintSummary: {
        backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10,
        borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 12,
    },
    complaintLabel: { fontSize: 11, fontWeight: '600', color: '#166534' },
    complaintText: { fontSize: 13, color: '#166534', marginTop: 2 },
    smartModeContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#EBF4FF', padding: 14, borderRadius: 12, marginBottom: 16,
        borderWidth: 1, borderColor: '#BFDBFE',
    },
    smartModeTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E3A8A' },
    smartModeDesc: { fontSize: 11, color: '#3B82F6', marginTop: 2 },
    slotsTitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8, marginLeft: 2 },
    slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 24 },
    slot: {
        width: '30%', paddingVertical: 12,
        backgroundColor: 'white', borderRadius: 10, borderWidth: 1.5,
        borderColor: '#E2E8F0', alignItems: 'center',
    },
    slotSelected: { backgroundColor: '#0F52BA', borderColor: '#0F52BA' },
    slotText: { color: '#1A1A1A', fontWeight: '500', fontSize: 13 },
    slotTextSelected: { color: 'white' },
    bookBtn: {
        backgroundColor: '#0F52BA', paddingVertical: 16,
        borderRadius: 12, alignItems: 'center',
    },
    bookBtnDisabled: { backgroundColor: '#94A3B8' },
    bookBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
