import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { auth, db } from '../utils/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

export default function AuthScreen({ onAuth, onForgotPassword }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        setError('');
        setLoading(true);
        if (isSignUp && (!name || !email || !password)) {
            setError('Please fill all fields.');
            setLoading(false);
            return;
        }
        try {
            if (isSignUp) {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCred.user, { displayName: name });
                await setDoc(doc(db, "users", userCred.user.uid), {
                    name,
                    email,
                    emailVerified: false
                });
                await sendEmailVerification(userCred.user);
                alert("Verify your email. A verification email has been sent. Please verify before logging in.");
                setIsSignUp(false);
            } else {
                const userCred = await signInWithEmailAndPassword(auth, email, password);
                if (!userCred.user.emailVerified) {
                    await sendEmailVerification(userCred.user);
                    setError("Please verify your email. A new verification email has been sent.");
                    setLoading(false);
                    return;
                }
                onAuth();
            }
        } catch (err) {
            // Improved error handling for Firebase Auth
            let message = err.message;
            if (err.code) {
                switch (err.code) {
                    case 'auth/invalid-email':
                        message = 'Invalid email address.';
                        break;
                    case 'auth/user-disabled':
                        message = 'This user account has been disabled.';
                        break;
                    case 'auth/user-not-found':
                        message = 'No user found with this email.';
                        break;
                    case 'auth/wrong-password':
                        message = 'Incorrect password.';
                        break;
                    case 'auth/too-many-requests':
                        message = 'Too many failed attempts. Please try again later.';
                        break;
                    default:
                        message = err.message;
                }
            }
            setError(message);
        }
        setLoading(false);
    };

    return (
        <View style={styles.outerContainer}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>BUS{"\n"}TRACKER</Text>
                {isSignUp && (
                    <TextInput
                        style={styles.input}
                        placeholder="name"
                        placeholderTextColor="#1976d2"
                        value={name}
                        onChangeText={setName}
                    />
                )}
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#1976d2"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#1976d2"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? "Please wait..." : (isSignUp ? "sign up" : "sign in")}</Text>
                </TouchableOpacity>
                {!isSignUp && (
                    <TouchableOpacity onPress={onForgotPassword} disabled={loading}>
                        <Text style={styles.switchText}>Forgot Password?</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} disabled={loading}>
                    <Text style={styles.switchText}>{isSignUp ? "Already have an account? Sign in" : "No account? Sign up"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    formContainer: {
        width: 320,
        paddingVertical: 40,
        paddingHorizontal: 24,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#1976d2',
        alignItems: 'center',
        backgroundColor: '#fff',
        shadowColor: '#1976d2',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 32,
        textAlign: 'center',
        fontFamily: 'monospace',
        letterSpacing: 2,
    },
    input: {
        width: '100%',
        borderWidth: 2,
        borderColor: '#1976d2',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 18,
        fontSize: 18,
        color: '#1976d2',
        backgroundColor: '#fff',
        fontFamily: 'monospace',
    },
    button: {
        width: '100%',
        backgroundColor: '#fff',
        borderColor: '#1976d2',
        borderWidth: 2,
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 18,
    },
    buttonText: {
        color: '#1976d2',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
    switchText: {
        color: '#1976d2',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
        fontFamily: 'monospace',
    },
});