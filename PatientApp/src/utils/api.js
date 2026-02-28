import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebaseConfig';

const FLASK_URL = 'http://10.146.128.234:5000';

/**
 * Get a valid Flask JWT, refreshing via Firebase if expired.
 * This ensures every API call has a working token.
 */
export async function getValidJWT() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('Not logged in');
    }

    // Always get a fresh Firebase ID token (Firebase caches it if not expired)
    const idToken = await currentUser.getIdToken(true);

    // Exchange with Flask for a fresh JWT
    const response = await axios.post(`${FLASK_URL}/api/auth/verify-token`, {
        token: idToken,
    });

    const jwt = response.data.access_token;
    await AsyncStorage.setItem('app_jwt', jwt);
    return jwt;
}

/**
 * Create an authenticated Axios instance with auto-refresh.
 */
export async function authRequest(method, path, data = null) {
    const jwt = await getValidJWT();
    const config = {
        method,
        url: `${FLASK_URL}${path}`,
        headers: { Authorization: `Bearer ${jwt}` },
        timeout: 15000,
    };
    if (data) config.data = data;
    return axios(config);
}

export { FLASK_URL };
export default { getValidJWT, authRequest, FLASK_URL };
