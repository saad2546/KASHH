import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, AlertTriangle } from 'lucide-react-native';
import { authRequest } from '../utils/api';

export default function BookingConfirmationScreen({ route, navigation }) {
    const { doctor, slot, intakeData } = route.params;
    const [booking, setBooking] = useState(false);
    const [booked, setBooked] = useState(false);
    const [result, setResult] = useState(null);

    const handleBookAppointment = async () => {
        setBooking(true);
        try {
            const response = await authRequest('POST', '/api/booking/book-appointment', {
                doctor_id: doctor.id,
                doctor_name: doctor.name,
                slot: slot,
                complaint: intakeData.complaint,
                appointment_type: intakeData.appointment_type,
                urgency_score: intakeData.urgency_score,
                is_emergency: intakeData.is_emergency,
                age: intakeData.age,
                patient_name: intakeData.patient_name,
            });

            setResult(response.data);
            setBooked(true);

        } catch (error) {
            Alert.alert('Booking Error', error.response?.data?.error || error.message);
        } finally {
            setBooking(false);
        }
    };

    // Urgency color
    const urgencyColor = intakeData?.urgency_score >= 7 ? '#DC2626'
        : intakeData?.urgency_score >= 4 ? '#EA580C' : '#16A34A';

    const typeLabels = { new: '🩺 New Consultation', followup: '🔁 Follow-up', report: '📄 Report Review' };

    if (booked && result) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <CheckCircle color="#10B981" size={64} />
                    <Text style={styles.title}>Booking Confirmed!</Text>

                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Token Number</Text>
                            <Text style={styles.value}>{result.token_number}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <Text style={styles.label}>Queue Position</Text>
                            <Text style={styles.value}>{result.queue_position}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <Text style={styles.label}>Doctor</Text>
                            <Text style={styles.value}>{doctor.name}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <Text style={styles.label}>Time Slot</Text>
                            <Text style={styles.value}>{slot}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <Text style={styles.label}>Priority Score</Text>
                            <Text style={[styles.value, { color: urgencyColor }]}>
                                {result.priority_score}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <Text style={styles.label}>Est. Wait</Text>
                            <Text style={styles.value}>{result.estimated_wait}</Text>
                        </View>
                    </View>

                    {result.warning && (
                        <View style={styles.warningCard}>
                            <AlertTriangle color="#EA580C" size={16} />
                            <Text style={styles.warningText}>{result.warning}</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => navigation.navigate('DoctorList')}
                >
                    <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.reviewTitle}>Review Booking</Text>

                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Doctor</Text>
                        <Text style={styles.value}>{doctor.name}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Time Slot</Text>
                        <Text style={styles.value}>{slot}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Type</Text>
                        <Text style={styles.value}>{typeLabels[intakeData?.appointment_type] || intakeData?.appointment_type}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Complaint</Text>
                        <Text style={[styles.value, { fontSize: 13, maxWidth: '60%', textAlign: 'right' }]}>
                            {intakeData?.complaint}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Urgency</Text>
                        <Text style={[styles.value, { color: urgencyColor }]}>
                            {intakeData?.urgency_score}/10 {intakeData?.is_emergency ? '🚨' : ''}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Priority Score</Text>
                        <Text style={[styles.value, { color: '#0F52BA', fontWeight: 'bold' }]}>
                            {intakeData?.priority_score}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
                <TouchableOpacity
                    style={[styles.doneBtn, booking && { opacity: 0.7 }]}
                    onPress={handleBookAppointment}
                    disabled={booking}
                >
                    {booking ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.doneBtnText}>Booking...</Text>
                        </View>
                    ) : (
                        <Text style={styles.doneBtnText}>Confirm & Join Queue</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginTop: 16, marginBottom: 24 },
    reviewTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 24 },
    card: {
        backgroundColor: 'white', width: '100%', borderRadius: 16, padding: 20,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }, elevation: 4,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
    label: { fontSize: 13, color: '#64748B' },
    value: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },
    warningCard: {
        flexDirection: 'row', alignItems: 'center', marginTop: 16,
        backgroundColor: '#FFF7ED', padding: 12, borderRadius: 10,
        borderWidth: 1, borderColor: '#FED7AA', width: '100%',
    },
    warningText: { fontSize: 12, color: '#9A3412', marginLeft: 8, flex: 1 },
    doneBtn: {
        backgroundColor: '#0F52BA', paddingVertical: 16,
        borderRadius: 12, alignItems: 'center', marginBottom: 24,
    },
    doneBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
