import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, FileText } from 'lucide-react-native';

const MOCK_PRESCRIPTIONS = [
    { id: '1', date: '28 Feb 2026', doctor: 'Dr. Ayesha Khan', diagnosis: 'Viral Fever' },
    { id: '2', date: '15 Jan 2026', doctor: 'Dr. Rahul Sharma', diagnosis: 'Routine Checkup' },
];

export default function PrescriptionListScreen({ navigation }) {
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PrescriptionDetail', { prescription: item })}
        >
            <View style={styles.iconContainer}>
                <FileText color="#0F52BA" size={24} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.title}>{item.diagnosis}</Text>
                <Text style={styles.subtitle}>{item.doctor} • {item.date}</Text>
            </View>
            <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Digital Prescriptions</Text>
            <FlatList
                data={MOCK_PRESCRIPTIONS}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16 },
    header: { fontSize: 24, fontWeight: 'bold', marginVertical: 16, color: '#1A1A1A' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: { flex: 1 },
    title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
    subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
});
