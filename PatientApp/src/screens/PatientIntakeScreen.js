import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Alert,
    StyleSheet, ScrollView, ActivityIndicator, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft, AlertTriangle, Stethoscope,
    RefreshCw, FileText, Zap
} from 'lucide-react-native';
import { auth, db } from '../utils/firebaseConfig';
import { authRequest } from '../utils/api';

const APPOINTMENT_TYPES = [
    { key: 'new', label: '🩺 New Consultation', score: 5 },
    { key: 'followup', label: '🔁 Follow-up', score: 3 },
    { key: 'report', label: '📄 Report Review', score: 2 },
];

export default function PatientIntakeScreen({ route, navigation }) {
    const { doctor } = route.params;

    const [complaint, setComplaint] = useState('');
    const [appointmentType, setAppointmentType] = useState(null);
    const [isEmergency, setIsEmergency] = useState(false);
    const [age, setAge] = useState(null);
    const [userName, setUserName] = useState('');
    const [classifying, setClassifying] = useState(false);

    // Auto-fetch age from Firestore profile
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const doc = await db.collection('users').doc(user.uid).get();
                    if (doc.exists) {
                        const data = doc.data();
                        setAge(data.age || null);
                        setUserName(data.full_name || 'Patient');
                    }
                }
            } catch (e) {
                console.log('Error fetching user age:', e);
            }
        };
        fetchUserData();
    }, []);

    const handleContinue = async () => {
        if (!complaint.trim()) {
            Alert.alert('Required', 'Please describe your chief complaint.');
            return;
        }
        if (!appointmentType) {
            Alert.alert('Required', 'Please select an appointment type.');
            return;
        }

        setClassifying(true);

        try {
            // If emergency → force urgency 9-10
            let urgencyScore;

            if (isEmergency) {
                urgencyScore = 10;
            } else {
                // Call Flask backend for AI urgency classification
                try {
                    const response = await authRequest('POST', '/api/booking/classify-urgency', {
                        complaint: complaint.trim(),
                    });
                    urgencyScore = response.data.urgency_score;
                } catch (apiError) {
                    // Fallback to default if API is down
                    console.log('Urgency API fallback:', apiError.message);
                    urgencyScore = 5;
                }
            }

            // Calculate priority score locally for display
            const typeScore = APPOINTMENT_TYPES.find(t => t.key === appointmentType)?.score || 3;
            const ageFactor = (age && (age < 5 || age > 65)) ? 10 : 0;
            const priorityScore = parseFloat(
                ((0.6 * urgencyScore) + (0.3 * typeScore) + (0.1 * ageFactor)).toFixed(2)
            );

            // Build intake data object
            const intakeData = {
                complaint: complaint.trim(),
                appointment_type: appointmentType,
                is_emergency: isEmergency,
                urgency_score: urgencyScore,
                priority_score: priorityScore,
                age: age,
                patient_name: userName,
            };

            // Navigate to slot selection with intake data
            navigation.navigate('SlotSelection', {
                doctor,
                intakeData,
            });

        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setClassifying(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#1A1A1A" size={22} />
                </TouchableOpacity>
                <Text style={styles.header}>Patient Details</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {/* Doctor Info */}
                <View style={styles.doctorCard}>
                    <Stethoscope color="#0F52BA" size={20} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.doctorName}>{doctor.name}</Text>
                        <Text style={styles.doctorSpec}>{doctor.specialty} • {doctor.department}</Text>
                    </View>
                </View>

                {/* Emergency Toggle */}
                <View style={styles.emergencyCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <AlertTriangle color={isEmergency ? '#DC2626' : '#94A3B8'} size={20} />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={[styles.emergencyLabel, isEmergency && { color: '#DC2626' }]}>
                                Emergency
                            </Text>
                            <Text style={styles.emergencyDesc}>
                                {isEmergency ? 'You will get immediate priority' : 'Toggle if this is urgent'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={isEmergency}
                        onValueChange={setIsEmergency}
                        trackColor={{ false: '#E2E8F0', true: '#FCA5A5' }}
                        thumbColor={isEmergency ? '#DC2626' : '#f4f3f4'}
                    />
                </View>

                {/* Chief Complaint */}
                <Text style={styles.sectionLabel}>Chief Complaint *</Text>
                <TextInput
                    style={styles.complaintInput}
                    placeholder="Describe your main symptom in one line..."
                    placeholderTextColor="#94A3B8"
                    value={complaint}
                    onChangeText={setComplaint}
                    multiline
                    maxLength={200}
                />
                <Text style={styles.charCount}>{complaint.length}/200</Text>

                {/* Appointment Type */}
                <Text style={styles.sectionLabel}>Appointment Type *</Text>
                <View style={styles.typeContainer}>
                    {APPOINTMENT_TYPES.map(type => (
                        <TouchableOpacity
                            key={type.key}
                            style={[
                                styles.typeCard,
                                appointmentType === type.key && styles.typeCardSelected
                            ]}
                            onPress={() => setAppointmentType(type.key)}
                        >
                            <Text style={[
                                styles.typeLabel,
                                appointmentType === type.key && styles.typeLabelSelected
                            ]}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Age Info (read-only) */}
                {age && (
                    <View style={styles.ageInfo}>
                        <Text style={styles.ageText}>
                            Age: {age} years {(age < 5 || age > 65) ? '⚠️ Priority boost applied' : ''}
                        </Text>
                    </View>
                )}

                {/* Continue Button */}
                <TouchableOpacity
                    style={[styles.continueBtn, classifying && { opacity: 0.7 }]}
                    onPress={handleContinue}
                    disabled={classifying}
                >
                    {classifying ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.continueBtnText}>Analyzing Urgency...</Text>
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Zap color="white" size={18} style={{ marginRight: 8 }} />
                            <Text style={styles.continueBtnText}>Continue to Time Slots</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={{ height: 32 }} />
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
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    },
    header: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
    doctorCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#EEF2FF', padding: 14, borderRadius: 12, marginBottom: 16,
        borderWidth: 1, borderColor: '#C7D2FE',
    },
    doctorName: { fontSize: 15, fontWeight: 'bold', color: '#1E3A8A' },
    doctorSpec: { fontSize: 12, color: '#3B82F6', marginTop: 2 },
    emergencyCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'white', padding: 14, borderRadius: 12, marginBottom: 20,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    emergencyLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    emergencyDesc: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
    sectionLabel: {
        fontSize: 13, fontWeight: '600', color: '#64748B',
        marginBottom: 8, marginLeft: 2,
    },
    complaintInput: {
        backgroundColor: 'white', borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15,
        color: '#1A1A1A', minHeight: 80, textAlignVertical: 'top',
    },
    charCount: { fontSize: 11, color: '#94A3B8', textAlign: 'right', marginTop: 4, marginBottom: 16 },
    typeContainer: { gap: 8, marginBottom: 16 },
    typeCard: {
        backgroundColor: 'white', padding: 14, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#E2E8F0',
    },
    typeCardSelected: {
        backgroundColor: '#EEF2FF', borderColor: '#0F52BA',
    },
    typeLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
    typeLabelSelected: { color: '#0F52BA', fontWeight: '700' },
    ageInfo: {
        backgroundColor: '#FFF7ED', padding: 12, borderRadius: 10,
        borderWidth: 1, borderColor: '#FED7AA', marginBottom: 16,
    },
    ageText: { fontSize: 13, color: '#9A3412', fontWeight: '500' },
    continueBtn: {
        backgroundColor: '#0F52BA', paddingVertical: 16, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', marginTop: 8,
    },
    continueBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
