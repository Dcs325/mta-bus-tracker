import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export const scheduleBusAlert = async (message) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Bus Alert!',
            body: message,
            sound: true,
        },
        trigger: null,
    });
};

export async function registerForPushNotificationsAsync() {
    let token;
    if (Constants.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        // Save this token to Firestore user profile
        if (auth.currentUser) {
            await setDoc(doc(db, 'users', auth.currentUser.uid), { pushToken: token }, { merge: true });
        }
    } else {
        alert('Must use physical device for Push Notifications');
    }
    return token;
}