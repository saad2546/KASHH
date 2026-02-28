import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../utils/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const FLASK_URL = 'http://10.146.128.234:5000';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password.');
            return;
        }

        setLoading(true);
        try {
            // Step 1 — Sign in with Firebase compat auth
            const credential = await auth.signInWithEmailAndPassword(email.trim(), password);

            // Step 2 — Get Firebase ID Token
            const idToken = await credential.user.getIdToken(true);

            // Step 3 — Exchange with Flask for app JWT
            const response = await axios.post(`${FLASK_URL}/api/auth/verify-token`, {
                token: idToken,
            });

            // Step 4 — Store Flask JWT
            await AsyncStorage.setItem('app_jwt', response.data.access_token);

            // Auth state listener handles navigation automatically

        } catch (error) {
            Alert.alert('Login Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Login</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
                <Text style={styles.btnTextPrimary}>{loading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('RegisterScreen')}>
                <Text style={styles.btnTextSecondary}>New patient? Register here</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', padding: 24, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 32, textAlign: 'center' },
    input: {
        backgroundColor: 'white',
        height: 50,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontSize: 16,
    },
    btnPrimary: {
        backgroundColor: '#0F52BA',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    btnTextPrimary: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    btnSecondary: { alignItems: 'center', marginTop: 16, padding: 8 },
    btnTextSecondary: { color: '#0F52BA', fontSize: 16, fontWeight: '500' },
});

export default LoginScreen;
