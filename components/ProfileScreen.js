import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../utils/firebase';
import { signOut, deleteUser, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { GTFS_STOPS } from '../utils/gtfsStops';
import { registerForPushNotificationsAsync } from '../utils/notifications';

const BUS_LINES = [
    'B1', 'B2', 'B3', 'B4', 'B6', 'B7', 'B8', 'B9', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B20', 'B23', 'B24', 'B25', 'B26', 'B27', 'B28', 'B29', 'B31', 'B32', 'B35', 'B36', 'B37', 'B38', 'B39', 'B41', 'B42', 'B43', 'B44', 'B45', 'B46', 'B47', 'B48', 'B49', 'B50', 'B52', 'B54', 'B57', 'B60', 'B61', 'B62', 'B63', 'B64', 'B65', 'B66', 'B67', 'B68', 'B69', 'B70', 'B71', 'B74', 'B78', 'B82', 'B83', 'B84', 'B100', 'B103'
];

export default function ProfileScreen({ onClose }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [favBuses, setFavBuses] = useState([]);
    const [favStops, setFavStops] = useState([]);
    const [selectedStops, setSelectedStops] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pushToken, setPushToken] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const user = auth.currentUser;
            if (user) {
                setEmail(user.email);
                setName(user.displayName || '');
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setFavBuses(userDoc.data().favBuses || []);
                    setFavStops(userDoc.data().favStops || []);
                    const token = userDoc.data().pushToken;
                    setPushToken(token || '');
                    setNotificationsEnabled(!!token);
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const toggleBus = (bus) => {
        setFavBuses(favBuses.includes(bus) ? favBuses.filter(b => b !== bus) : [...favBuses, bus]);
    };
    const toggleStop = (bus, stopId) => {
        setSelectedStops(prev => {
            const current = prev[bus] || [];
            return {
                ...prev,
                [bus]: current.includes(stopId)
                    ? current.filter(id => id !== stopId)
                    : [...current, stopId]
            };
        });
    };

    const saveProfile = async () => {
        setSaving(true);
        const user = auth.currentUser;
        if (user) {
            await updateProfile(user, { displayName: name });
            await updateDoc(doc(db, 'users', user.uid), { name, favBuses, favStops: selectedStops });
        }
        setSaving(false);
        Alert.alert('Profile updated!');
        if (onClose) onClose();
    };

    const handleSignOut = async () => {
        await signOut(auth);
        if (onClose) onClose();
    };

    const handleDelete = async () => {
        Alert.alert('Delete Account', 'Are you sure? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    const user = auth.currentUser;
                    if (user) {
                        await deleteDoc(doc(db, 'users', user.uid));
                        await deleteUser(user);
                    }
                    if (onClose) onClose();
                }
            }
        ]);
    };

    const handleToggleNotifications = async () => {
        const user = auth.currentUser;
        if (!user) return;
        if (notificationsEnabled) {
            // Disable notifications: remove token from Firestore
            await updateDoc(doc(db, 'users', user.uid), { pushToken: '' });
            setPushToken('');
            setNotificationsEnabled(false);
        } else {
            // Enable notifications: register and save token
            const token = await registerForPushNotificationsAsync();
            setPushToken(token || '');
            setNotificationsEnabled(!!token);
        }
    };

    if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Profile & Settings</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Email</Text>
            <Text style={styles.input} editable={false}>{email}</Text>
            <Text style={styles.label}>Favorite Bus Routes</Text>
            <View style={styles.multiList}>
                {BUS_LINES.map(bus => (
                    <TouchableOpacity
                        key={bus}
                        style={[styles.multiButton, favBuses.includes(bus) && styles.multiButtonSelected]}
                        onPress={() => toggleBus(bus)}
                    >
                        <Text style={[styles.multiButtonText, favBuses.includes(bus) && styles.multiButtonTextSelected]}>{bus}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {favBuses.length > 0 && (
                <>
                    <Text style={styles.label}>Favorite Bus Stops</Text>
                    {favBuses.map(bus => (
                        <View key={bus} style={{ width: '100%', marginBottom: 12 }}>
                            <Text style={{ color: '#1976d2', fontWeight: 'bold', marginBottom: 4 }}>{bus} Stops</Text>
                            <View style={styles.multiList}>
                                {(GTFS_STOPS[bus] || []).map(stop => (
                                    <TouchableOpacity
                                        key={stop.id}
                                        style={[styles.multiButton, selectedStops[bus]?.includes(stop.id) && styles.multiButtonSelected]}
                                        onPress={() => toggleStop(bus, stop.id)}
                                    >
                                        <Text style={[styles.multiButtonText, selectedStops[bus]?.includes(stop.id) && styles.multiButtonTextSelected]}>{stop.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}
                </>
            )}
            <View style={{ backgroundColor: '#f0f4f8', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 18 }}>Push Notifications</Text>
                <Text style={{ color: notificationsEnabled ? 'green' : 'red', marginTop: 8 }}>
                    {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </Text>
                {pushToken ? (
                    <Text style={{ fontSize: 12, color: '#333', marginTop: 4 }}>Token: {pushToken}</Text>
                ) : null}
                <Button
                    title={notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
                    onPress={handleToggleNotifications}
                    color={notificationsEnabled ? '#d32f2f' : '#1976d2'}
                />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 24, alignItems: 'center', backgroundColor: '#fff', flexGrow: 1 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1976d2', marginBottom: 20 },
    label: { fontWeight: 'bold', color: '#1976d2', marginTop: 16, marginBottom: 4, alignSelf: 'flex-start' },
    input: { width: '100%', borderWidth: 2, borderColor: '#1976d2', borderRadius: 12, padding: 10, marginBottom: 8, fontSize: 16, color: '#1976d2', backgroundColor: '#fff' },
    multiList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    multiButton: { backgroundColor: '#eee', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, margin: 4 },
    multiButtonSelected: { backgroundColor: '#1976d2' },
    multiButtonText: { color: '#1976d2', fontWeight: 'bold' },
    multiButtonTextSelected: { color: '#fff' },
    saveButton: { width: '100%', backgroundColor: '#1976d2', borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginTop: 18 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    signOutButton: { width: '100%', backgroundColor: '#fff', borderColor: '#1976d2', borderWidth: 2, borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    signOutButtonText: { color: '#1976d2', fontSize: 18, fontWeight: 'bold' },
    deleteButton: { width: '100%', backgroundColor: '#fff', borderColor: 'red', borderWidth: 2, borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    deleteButtonText: { color: 'red', fontSize: 18, fontWeight: 'bold' },
});