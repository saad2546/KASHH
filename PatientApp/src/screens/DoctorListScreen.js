import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';

const MOCK_DOCTORS = [
    { id: '1', name: 'Dr. Ayesha Khan', specialty: 'General Physician', department: 'General Medicine' },
    { id: '2', name: 'Dr. Rahul Sharma', specialty: 'Cardiologist', department: 'Cardiology' },
    { id: '3', name: 'Dr. Sarah Smith', specialty: 'Pediatrician', department: 'Pediatrics' },
];

export default function DoctorListScreen({ navigation }) {
    const [search, setSearch] = useState('');

    const filteredDoctors = MOCK_DOCTORS.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.department.toLowerCase().includes(search.toLowerCase()));

    const renderDoctor = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PatientIntake', { doctor: item })}
        >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.specialty}>{item.specialty} • {item.department}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Book Appointment</Text>
            <View style={styles.searchContainer}>
                <Search color="gray" size={20} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search doctor or department"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
            <FlatList
                data={filteredDoctors}
                keyExtractor={item => item.id}
                renderItem={renderDoctor}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginVertical: 16, color: '#1A1A1A' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: { flex: 1, height: 48, marginLeft: 8 },
    card: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    name: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
    specialty: { fontSize: 14, color: '#64748B', marginTop: 4 },
});
