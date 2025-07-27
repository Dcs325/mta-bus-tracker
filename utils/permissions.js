import { Platform, Alert, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export const requestPermissions = async () => {
    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        if (granted['android.permission.ACCESS_FINE_LOCATION'] !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Location permission is required for bus tracking.');
            return false;
        }
    }

    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Foreground location permission is required for bus tracking.');
        return false;
    }

    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
    if (notificationStatus.status !== 'granted') {
        Alert.alert('Permission Denied', 'Notification permission is required for alerts.');
        return false;
    }
    return true;
};

export const saveUserLocation = async (latitude, longitude) => {
    if (auth.currentUser) {
        const locationId = 'current'; // or use a timestamp/uuid
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'locations', locationId), {
            latitude,
            longitude,
            timestamp: Date.now()
        });
    }
};