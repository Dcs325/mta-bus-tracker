import React, { useEffect, useState } from 'react';
import { Platform, View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { GTFS_STOPS } from './utils/gtfsStops';
import { fetchBusesForLine } from './utils/mtaApi';
import { auth, db } from './utils/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { registerForPushNotificationsAsync } from './utils/notifications';
import { onAuthStateChanged } from 'firebase/auth';
import AuthScreen from './components/AuthScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import ProfileScreen from './components/ProfileScreen';

// Import the appropriate map component based on platform
let MapComponent;
try {
    if (Platform.OS === 'web') {
        MapComponent = require('./MapComponent.web.js').default;
    } else {
        MapComponent = require('./MapComponent.native.js').default;
    }
} catch (error) {
    console.warn('Failed to load MapComponent:', error);
    // Fallback component
    MapComponent = () => <View style={{ padding: 20 }}><Text>Map component failed to load</Text></View>;
}

// Borough-based bus line organization
const BOROUGH_BUS_LINES = {
    'Brooklyn': [
        { value: 'B1_NB', label: 'B1 - Bay Ridge to Manhattan Beach' },
        { value: 'B1_SB', label: 'B1 - Manhattan Beach to Bay Ridge' },
        { value: 'B2_NB', label: 'B2 - Kings Hwy Station to Kings Plaza' },
        { value: 'B2_SB', label: 'B2 - Kings Plaza to Kings Hwy Station' },
        { value: 'B3_NB', label: 'B3 - Bensonhurst to Bergen Beach' },
        { value: 'B3_SB', label: 'B3 - Bergen Beach to Bensonhurst' },
        { value: 'B4_NB', label: 'B4 - Bay Ridge to Sheepshead Bay' },
        { value: 'B4_SB', label: 'B4 - Sheepshead Bay to Bay Ridge' },
        { value: 'B6_NB', label: 'B6 - Bath Beach to East New York' },
        { value: 'B6_SB', label: 'B6 - East New York to Bath Beach' },
        { value: 'B7_NB', label: 'B7 - Midwood to Bedford-Stuyvesant' },
        { value: 'B7_SB', label: 'B7 - Bedford-Stuyvesant to Midwood' },
        { value: 'B8_NB', label: 'B8 - Dyker Heights to East Flatbush' },
        { value: 'B8_SB', label: 'B8 - East Flatbush to Dyker Heights' },
        { value: 'B9_NB', label: 'B9 - Bay Ridge to Kings Plaza' },
        { value: 'B9_SB', label: 'B9 - Kings Plaza to Bay Ridge' },
        { value: 'B11_NB', label: 'B11 - Sunset Park to Midwood' },
        { value: 'B11_SB', label: 'B11 - Midwood to Sunset Park' },
        { value: 'B12_NB', label: 'B12 - Lefferts Gardens to East New York' },
        { value: 'B12_SB', label: 'B12 - East New York to Lefferts Gardens' },
        { value: 'B13_NB', label: 'B13 - Spring Creek to Wyckoff Hospital' },
        { value: 'B13_SB', label: 'B13 - Wyckoff Hospital to Spring Creek' },
        { value: 'B14_NB', label: 'B14 - Spring Creek to Crown Heights' },
        { value: 'B14_SB', label: 'B14 - Crown Heights to Spring Creek' },
        { value: 'B15_NB', label: 'B15 - Bedford Stuyvesant to JFK AirTrain' },
        { value: 'B15_SB', label: 'B15 - JFK AirTrain to Bedford Stuyvesant' },
        { value: 'B16_NB', label: 'B16 - Bay Ridge to Lefferts Gardens' },
        { value: 'B16_SB', label: 'B16 - Lefferts Gardens to Bay Ridge' },
        { value: 'B17_NB', label: 'B17 - Canarsie to Crown Heights' },
        { value: 'B17_SB', label: 'B17 - Crown Heights to Canarsie' },
        { value: 'B20_NB', label: 'B20 - Ridgewood to Spring Creek' },
        { value: 'B20_SB', label: 'B20 - Spring Creek to Ridgewood' },
        { value: 'B24_NB', label: 'B24 - Williamsburg to Greenpoint' },
        { value: 'B24_SB', label: 'B24 - Greenpoint to Williamsburg' },
        { value: 'B25_NB', label: 'B25 - Downtown Brooklyn & DUMBO to Broadway Junction' },
        { value: 'B25_SB', label: 'B25 - Broadway Junction to Downtown Brooklyn & DUMBO' },
        { value: 'B26_NB', label: 'B26 - Downtown Brooklyn to Ridgewood' },
        { value: 'B26_SB', label: 'B26 - Ridgewood to Downtown Brooklyn' },
        { value: 'B31_NB', label: 'B31 - Gerritsen Beach to Kings Hwy Station' },
        { value: 'B31_SB', label: 'B31 - Kings Hwy Station to Gerritsen Beach' },
        { value: 'B32_NB', label: 'B32 - Williamsburg to Long Island City' },
        { value: 'B32_SB', label: 'B32 - Long Island City to Williamsburg' },
        { value: 'B35_NB', label: 'B35 - Brownsville to Sunset Park' },
        { value: 'B35_SB', label: 'B35 - Sunset Park to Brownsville' },
        { value: 'B36_NB', label: 'B36 - Sheepshead Bay to Coney Island' },
        { value: 'B36_SB', label: 'B36 - Coney Island to Sheepshead Bay' },
        { value: 'B37_NB', label: 'B37 - Downtown Brooklyn to Bay Ridge' },
        { value: 'B37_SB', label: 'B37 - Bay Ridge to Downtown Brooklyn' },
        { value: 'B38_NB', label: 'B38 - Ridgewood to Downtown Brooklyn' },
        { value: 'B38_SB', label: 'B38 - Downtown Brooklyn to Ridgewood' },
        { value: 'B39_NB', label: 'B39 - Williamsburg Bridge Plaza to Lower East Side' },
        { value: 'B39_SB', label: 'B39 - Lower East Side to Williamsburg Bridge Plaza' },
        { value: 'B41_NB', label: 'B41 - Kings Plaza to Downtown Brooklyn' },
        { value: 'B41_SB', label: 'B41 - Downtown Brooklyn to Kings Plaza' },
        { value: 'B42_NB', label: 'B42 - Canarsie Pier to Rockaway Parkway Station' },
        { value: 'B42_SB', label: 'B42 - Rockaway Parkway Station to Canarsie Pier' },
        { value: 'B43_NB', label: 'B43 - Greenpoint to Lefferts Gardens' },
        { value: 'B43_SB', label: 'B43 - Lefferts Gardens to Greenpoint' },
        { value: 'B44_NB', label: 'B44 - Sheepshead Bay to Williamsburg' },
        { value: 'B44_SB', label: 'B44 - Williamsburg to Sheepshead Bay' },
        { value: 'B44+_NB', label: 'B44-SBS - Sheepshead Bay to Williamsburg (Select Bus)' },
        { value: 'B44+_SB', label: 'B44-SBS - Williamsburg to Sheepshead Bay (Select Bus)' },
        { value: 'B45_NB', label: 'B45 - Downtown Brooklyn to Crown Heights' },
        { value: 'B45_SB', label: 'B45 - Crown Heights to Downtown Brooklyn' },
        { value: 'B46_NB', label: 'B46 - Kings Plaza to Williamsburg' },
        { value: 'B46_SB', label: 'B46 - Williamsburg to Kings Plaza' },
        { value: 'B46+_NB', label: 'B46-SBS - Kings Plaza to Williamsburg (Select Bus)' },
        { value: 'B46+_SB', label: 'B46-SBS - Williamsburg to Kings Plaza (Select Bus)' },
        { value: 'B47_NB', label: 'B47 - Kings Plaza to Bedford-Stuyvesant' },
        { value: 'B47_SB', label: 'B47 - Bedford-Stuyvesant to Kings Plaza' },
        { value: 'B48_NB', label: 'B48 - Lefferts Gardens to Greenpoint' },
        { value: 'B48_SB', label: 'B48 - Greenpoint to Lefferts Gardens' },
        { value: 'B49_NB', label: 'B49 - Manhattan Beach to Bedford-Stuyvesant' },
        { value: 'B49_SB', label: 'B49 - Bedford-Stuyvesant to Manhattan Beach' },
        { value: 'B52_NB', label: 'B52 - Downtown Brooklyn to Ridgewood' },
        { value: 'B52_SB', label: 'B52 - Ridgewood to Downtown Brooklyn' },
        { value: 'B54_NB', label: 'B54 - Downtown Brooklyn to Ridgewood' },
        { value: 'B54_SB', label: 'B54 - Ridgewood to Downtown Brooklyn' },
        { value: 'B57_NB', label: 'B57 - Gowanus to Maspeth' },
        { value: 'B57_SB', label: 'B57 - Maspeth to Gowanus' },
        { value: 'B60_NB', label: 'B60 - Williamsburg to Canarsie' },
        { value: 'B60_SB', label: 'B60 - Canarsie to Williamsburg' },
        { value: 'B61_NB', label: 'B61 - Park Slope to Downtown Brooklyn' },
        { value: 'B61_SB', label: 'B61 - Downtown Brooklyn to Park Slope' },
        { value: 'B62_NB', label: 'B62 - Downtown Brooklyn to Long Island City' },
        { value: 'B62_SB', label: 'B62 - Long Island City to Downtown Brooklyn' },
        { value: 'B63_NB', label: 'B63 - Bay Ridge to Cobble Hill' },
        { value: 'B63_SB', label: 'B63 - Cobble Hill to Bay Ridge' },
        { value: 'B64_NB', label: 'B64 - Bay Ridge to Coney Island' },
        { value: 'B64_SB', label: 'B64 - Coney Island to Bay Ridge' },
        { value: 'B65_NB', label: 'B65 - Downtown Brooklyn to Crown Heights' },
        { value: 'B65_SB', label: 'B65 - Crown Heights to Downtown Brooklyn' },
        { value: 'B67_NB', label: 'B67 - Brooklyn Navy Yard to Kensington' },
        { value: 'B67_SB', label: 'B67 - Kensington to Brooklyn Navy Yard' },
        { value: 'B68_NB', label: 'B68 - Coney Island to Windsor Terrace' },
        { value: 'B68_SB', label: 'B68 - Windsor Terrace to Coney Island' },
        { value: 'B69_NB', label: 'B69 - Downtown Brooklyn to Kensington' },
        { value: 'B69_SB', label: 'B69 - Kensington to Downtown Brooklyn' },
        { value: 'B70_NB', label: 'B70 - Dyker Heights to Sunset Park' },
        { value: 'B70_SB', label: 'B70 - Sunset Park to Dyker Heights' },
        { value: 'B74_NB', label: 'B74 - Sea Gate to Stillwell Av' },
        { value: 'B74_SB', label: 'B74 - Stillwell Av to Sea Gate' },
        { value: 'B82_NB', label: 'B82 - Coney Island to Spring Creek Towers' },
        { value: 'B82_SB', label: 'B82 - Spring Creek Towers to Coney Island' },
        { value: 'B82+_NB', label: 'B82-SBS - Coney Island to Spring Creek Towers (Select Bus)' },
        { value: 'B82+_SB', label: 'B82-SBS - Spring Creek Towers to Coney Island (Select Bus)' },
        { value: 'B83_NB', label: 'B83 - Spring Creek to Broadway Junction' },
        { value: 'B83_SB', label: 'B83 - Broadway Junction to Spring Creek' },
        { value: 'B84_NB', label: 'B84 - Spring Creek to New Lots' },
        { value: 'B84_SB', label: 'B84 - New Lots to Spring Creek' }
    ],
    'Manhattan': [
        { value: 'M1_NB', label: 'M1 - Harlem to Battery Park' },
        { value: 'M1_SB', label: 'M1 - Battery Park to Harlem' },
        { value: 'M2_NB', label: 'M2 - Inwood to Lower East Side' },
        { value: 'M2_SB', label: 'M2 - Lower East Side to Inwood' },
        { value: 'M3_NB', label: 'M3 - East Harlem to Battery Park' },
        { value: 'M3_SB', label: 'M3 - Battery Park to East Harlem' },
        { value: 'M4_NB', label: 'M4 - Washington Heights to Lower East Side' },
        { value: 'M4_SB', label: 'M4 - Lower East Side to Washington Heights' },
        { value: 'M5_NB', label: 'M5 - Washington Heights to South Ferry' },
        { value: 'M5_SB', label: 'M5 - South Ferry to Washington Heights' },
        { value: 'M7_NB', label: 'M7 - East Harlem to Lower East Side' },
        { value: 'M7_SB', label: 'M7 - Lower East Side to East Harlem' },
        { value: 'M8_NB', label: 'M8 - Uptown to Downtown' },
        { value: 'M8_SB', label: 'M8 - Downtown to Uptown' },
        { value: 'M9_NB', label: 'M9 - Battery Park to West Side' },
        { value: 'M9_SB', label: 'M9 - West Side to Battery Park' },
        { value: 'M10_NB', label: 'M10 - South Ferry to Harlem' },
        { value: 'M10_SB', label: 'M10 - Harlem to South Ferry' },
        { value: 'M11_NB', label: 'M11 - East Side to West Side' },
        { value: 'M11_SB', label: 'M11 - West Side to East Side' },
        { value: 'M12_NB', label: 'M12 - Inwood to Lower East Side' },
        { value: 'M12_SB', label: 'M12 - Lower East Side to Inwood' },
        { value: 'M15_NB', label: 'M15 - South Ferry to East Harlem' },
        { value: 'M15_SB', label: 'M15 - East Harlem to South Ferry' },
        { value: 'M15+_NB', label: 'M15-SBS - South Ferry to East Harlem (Select Bus)' },
        { value: 'M15+_SB', label: 'M15-SBS - East Harlem to South Ferry (Select Bus)' },
        { value: 'M20_NB', label: 'M20 - West Side to East Side' },
        { value: 'M20_SB', label: 'M20 - East Side to West Side' },
        { value: 'M21_NB', label: 'M21 - East Side to West Side' },
        { value: 'M21_SB', label: 'M21 - West Side to East Side' },
        { value: 'M22_NB', label: 'M22 - East Side to West Side' },
        { value: 'M22_SB', label: 'M22 - West Side to East Side' },
        { value: 'M23+_NB', label: 'M23-SBS - East 23rd Street to West 23rd Street' },
        { value: 'M23+_SB', label: 'M23-SBS - West 23rd Street to East 23rd Street' },
        { value: 'M31_NB', label: 'M31 - East Side to West Side' },
        { value: 'M31_SB', label: 'M31 - West Side to East Side' },
        { value: 'M34+_NB', label: 'M34-SBS - East 34th Street to West 34th Street' },
        { value: 'M34+_SB', label: 'M34-SBS - West 34th Street to East 34th Street' },
        { value: 'M35_NB', label: 'M35 - East Side to West Side' },
        { value: 'M35_SB', label: 'M35 - West Side to East Side' },
        { value: 'M42_NB', label: 'M42 - East Side to West Side' },
        { value: 'M42_SB', label: 'M42 - West Side to East Side' },
        { value: 'M50_NB', label: 'M50 - East Side to West Side' },
        { value: 'M50_SB', label: 'M50 - West Side to East Side' },
        { value: 'M55_NB', label: 'M55 - East Side to West Side' },
        { value: 'M55_SB', label: 'M55 - West Side to East Side' },
        { value: 'M57_NB', label: 'M57 - East Side to West Side' },
        { value: 'M57_SB', label: 'M57 - West Side to East Side' },
        { value: 'M60+_NB', label: 'M60-SBS - LaGuardia Airport to West Harlem' },
        { value: 'M60+_SB', label: 'M60-SBS - West Harlem to LaGuardia Airport' },
        { value: 'M66_NB', label: 'M66 - Lincoln Center to East 67th Street' },
        { value: 'M66_SB', label: 'M66 - East 67th Street to Lincoln Center' },
        { value: 'M72_NB', label: 'M72 - West 72nd Street to East 72nd Street' },
        { value: 'M72_SB', label: 'M72 - East 72nd Street to West 72nd Street' },
        { value: 'M79+_NB', label: 'M79-SBS - West 79th Street to East 79th Street' },
        { value: 'M79+_SB', label: 'M79-SBS - East 79th Street to West 79th Street' },
        { value: 'M86+_NB', label: 'M86-SBS - West 86th Street to East 86th Street' },
        { value: 'M86+_SB', label: 'M86-SBS - East 86th Street to West 86th Street' },
        { value: 'M96_NB', label: 'M96 - West 96th Street to East 96th Street' },
        { value: 'M96_SB', label: 'M96 - East 96th Street to West 96th Street' },
        { value: 'M98_NB', label: 'M98 - Washington Heights to Upper East Side' },
        { value: 'M98_SB', label: 'M98 - Upper East Side to Washington Heights' },
        { value: 'M100_NB', label: 'M100 - Inwood to Lower East Side' },
        { value: 'M100_SB', label: 'M100 - Lower East Side to Inwood' },
        { value: 'M101_NB', label: 'M101 - Washington Heights to Lower East Side' },
        { value: 'M101_SB', label: 'M101 - Lower East Side to Washington Heights' },
        { value: 'M102_NB', label: 'M102 - Inwood to Lower East Side' },
        { value: 'M102_SB', label: 'M102 - Lower East Side to Inwood' },
        { value: 'M103_NB', label: 'M103 - Washington Heights to Lower East Side' },
        { value: 'M103_SB', label: 'M103 - Lower East Side to Washington Heights' },
        { value: 'M104_NB', label: 'M104 - Washington Heights to Lower East Side' },
        { value: 'M104_SB', label: 'M104 - Lower East Side to Washington Heights' },
        { value: 'M106_NB', label: 'M106 - East Harlem to West Side' },
        { value: 'M106_SB', label: 'M106 - West Side to East Harlem' },
        { value: 'M116_NB', label: 'M116 - West Side to East Harlem' },
        { value: 'M116_SB', label: 'M116 - East Harlem to West Side' },
        { value: 'M125_NB', label: 'M125 - Manhattanville to The Hub' },
        { value: 'M125_SB', label: 'M125 - The Hub to Manhattanville' }
    ],
    'Queens': [
        { value: 'Q1_NB', label: 'Q1 - Jamaica to Flushing' },
        { value: 'Q1_SB', label: 'Q1 - Flushing to Jamaica' },
        { value: 'Q2_NB', label: 'Q2 - Jamaica to Flushing' },
        { value: 'Q2_SB', label: 'Q2 - Flushing to Jamaica' },
        { value: 'Q3_NB', label: 'Q3 - Jamaica to Astoria' },
        { value: 'Q3_SB', label: 'Q3 - Astoria to Jamaica' },
        { value: 'Q4_NB', label: 'Q4 - Jamaica to Flushing' },
        { value: 'Q4_SB', label: 'Q4 - Flushing to Jamaica' },
        { value: 'Q5_NB', label: 'Q5 - Jamaica to Flushing' },
        { value: 'Q5_SB', label: 'Q5 - Flushing to Jamaica' },
        { value: 'Q6_NB', label: 'Q6 - Jamaica to Flushing' },
        { value: 'Q6_SB', label: 'Q6 - Flushing to Jamaica' },
        { value: 'Q7_NB', label: 'Q7 - Jamaica to Flushing' },
        { value: 'Q7_SB', label: 'Q7 - Flushing to Jamaica' },
        { value: 'Q8_NB', label: 'Q8 - Jamaica to Flushing' },
        { value: 'Q8_SB', label: 'Q8 - Flushing to Jamaica' },
        { value: 'Q9_NB', label: 'Q9 - Jamaica to Flushing' },
        { value: 'Q9_SB', label: 'Q9 - Flushing to Jamaica' },
        { value: 'Q10_NB', label: 'Q10 - Jamaica to Flushing' },
        { value: 'Q10_SB', label: 'Q10 - Flushing to Jamaica' },
        { value: 'Q11_NB', label: 'Q11 - Jamaica to Flushing' },
        { value: 'Q11_SB', label: 'Q11 - Flushing to Jamaica' },
        { value: 'Q12_NB', label: 'Q12 - Jamaica to Flushing' },
        { value: 'Q12_SB', label: 'Q12 - Flushing to Jamaica' },
        { value: 'Q13_NB', label: 'Q13 - Jamaica to Flushing' },
        { value: 'Q13_SB', label: 'Q13 - Flushing to Jamaica' },
        { value: 'Q15_NB', label: 'Q15 - Jamaica to Flushing' },
        { value: 'Q15_SB', label: 'Q15 - Flushing to Jamaica' },
        { value: 'Q16_NB', label: 'Q16 - Jamaica to Flushing' },
        { value: 'Q16_SB', label: 'Q16 - Flushing to Jamaica' },
        { value: 'Q17_NB', label: 'Q17 - Jamaica to Flushing' },
        { value: 'Q17_SB', label: 'Q17 - Flushing to Jamaica' },
        { value: 'Q18_NB', label: 'Q18 - Jamaica to Flushing' },
        { value: 'Q18_SB', label: 'Q18 - Flushing to Jamaica' },
        { value: 'Q19_NB', label: 'Q19 - Jamaica to Flushing' },
        { value: 'Q19_SB', label: 'Q19 - Flushing to Jamaica' },
        { value: 'Q20_NB', label: 'Q20 - Jamaica to College Point' },
        { value: 'Q20_SB', label: 'Q20 - College Point to Jamaica' },
        { value: 'Q21_NB', label: 'Q21 - Jamaica to Flushing' },
        { value: 'Q21_SB', label: 'Q21 - Flushing to Jamaica' },
        { value: 'Q22_NB', label: 'Q22 - Jamaica to Flushing' },
        { value: 'Q22_SB', label: 'Q22 - Flushing to Jamaica' },
        { value: 'Q23_NB', label: 'Q23 - Jamaica to Flushing' },
        { value: 'Q23_SB', label: 'Q23 - Flushing to Jamaica' },
        { value: 'Q24_NB', label: 'Q24 - Jamaica to Flushing' },
        { value: 'Q24_SB', label: 'Q24 - Flushing to Jamaica' },
        { value: 'Q25_NB', label: 'Q25 - Jamaica to Flushing' },
        { value: 'Q25_SB', label: 'Q25 - Flushing to Jamaica' },
        { value: 'Q26_NB', label: 'Q26 - Jamaica to Flushing' },
        { value: 'Q26_SB', label: 'Q26 - Flushing to Jamaica' },
        { value: 'Q27_NB', label: 'Q27 - Jamaica to Flushing' },
        { value: 'Q27_SB', label: 'Q27 - Flushing to Jamaica' },
        { value: 'Q28_NB', label: 'Q28 - Jamaica to Flushing' },
        { value: 'Q28_SB', label: 'Q28 - Flushing to Jamaica' },
        { value: 'Q29_NB', label: 'Q29 - Jamaica to Flushing' },
        { value: 'Q29_SB', label: 'Q29 - Flushing to Jamaica' },
        { value: 'Q30_NB', label: 'Q30 - Jamaica to Flushing' },
        { value: 'Q30_SB', label: 'Q30 - Flushing to Jamaica' },
        { value: 'Q31_NB', label: 'Q31 - Jamaica to Flushing' },
        { value: 'Q31_SB', label: 'Q31 - Flushing to Jamaica' },
        { value: 'Q32_NB', label: 'Q32 - Jamaica to Flushing' },
        { value: 'Q32_SB', label: 'Q32 - Flushing to Jamaica' },
        { value: 'Q33_NB', label: 'Q33 - Jamaica to Flushing' },
        { value: 'Q33_SB', label: 'Q33 - Flushing to Jamaica' },
        { value: 'Q34_NB', label: 'Q34 - Jamaica to Flushing' },
        { value: 'Q34_SB', label: 'Q34 - Flushing to Jamaica' },
        { value: 'Q35_NB', label: 'Q35 - Jamaica to Flushing' },
        { value: 'Q35_SB', label: 'Q35 - Flushing to Jamaica' },
        { value: 'Q36_NB', label: 'Q36 - Jamaica to Flushing' },
        { value: 'Q36_SB', label: 'Q36 - Flushing to Jamaica' },
        { value: 'Q37_NB', label: 'Q37 - Jamaica to Flushing' },
        { value: 'Q37_SB', label: 'Q37 - Flushing to Jamaica' },
        { value: 'Q38_NB', label: 'Q38 - Jamaica to Maspeth' },
        { value: 'Q38_SB', label: 'Q38 - Maspeth to Jamaica' },
        { value: 'Q39_NB', label: 'Q39 - Jamaica to Flushing' },
        { value: 'Q39_SB', label: 'Q39 - Flushing to Jamaica' },
        { value: 'Q40_NB', label: 'Q40 - Jamaica to Flushing' },
        { value: 'Q40_SB', label: 'Q40 - Flushing to Jamaica' },
        { value: 'Q41_NB', label: 'Q41 - Jamaica to Flushing' },
        { value: 'Q41_SB', label: 'Q41 - Flushing to Jamaica' },
        { value: 'Q42_NB', label: 'Q42 - Jamaica to Flushing' },
        { value: 'Q42_SB', label: 'Q42 - Flushing to Jamaica' },
        { value: 'Q43_NB', label: 'Q43 - Jamaica to Flushing' },
        { value: 'Q43_SB', label: 'Q43 - Flushing to Jamaica' },
        { value: 'Q44_NB', label: 'Q44 - Jamaica to Flushing' },
        { value: 'Q44_SB', label: 'Q44 - Flushing to Jamaica' },
        { value: 'Q46_NB', label: 'Q46 - Jamaica to Flushing' },
        { value: 'Q46_SB', label: 'Q46 - Flushing to Jamaica' },
        { value: 'Q47_NB', label: 'Q47 - Jamaica to Flushing' },
        { value: 'Q47_SB', label: 'Q47 - Flushing to Jamaica' },
        { value: 'Q48_NB', label: 'Q48 - Jamaica to Flushing' },
        { value: 'Q48_SB', label: 'Q48 - Flushing to Jamaica' },
        { value: 'Q49_NB', label: 'Q49 - Jamaica to Flushing' },
        { value: 'Q49_SB', label: 'Q49 - Flushing to Jamaica' },
        { value: 'Q50_NB', label: 'Q50 - Jamaica to Flushing' },
        { value: 'Q50_SB', label: 'Q50 - Flushing to Jamaica' },
        { value: 'Q52_NB', label: 'Q52 - Jamaica to Woodside' },
        { value: 'Q52_SB', label: 'Q52 - Woodside to Jamaica' },
        { value: 'Q53_NB', label: 'Q53 - Jamaica to Woodside' },
        { value: 'Q53_SB', label: 'Q53 - Woodside to Jamaica' },
        { value: 'Q54_NB', label: 'Q54 - Jamaica to Maspeth' },
        { value: 'Q54_SB', label: 'Q54 - Maspeth to Jamaica' },
        { value: 'Q55_NB', label: 'Q55 - Jamaica to Elmhurst' },
        { value: 'Q55_SB', label: 'Q55 - Elmhurst to Jamaica' },
        { value: 'Q56_NB', label: 'Q56 - Jamaica to Ridgewood' },
        { value: 'Q56_SB', label: 'Q56 - Ridgewood to Jamaica' },
        { value: 'Q58_NB', label: 'Q58 - Jamaica to Flushing' },
        { value: 'Q58_SB', label: 'Q58 - Flushing to Jamaica' },
        { value: 'Q59_NB', label: 'Q59 - Jamaica to Elmhurst' },
        { value: 'Q59_SB', label: 'Q59 - Elmhurst to Jamaica' },
        { value: 'Q60_NB', label: 'Q60 - Jamaica to Elmhurst' },
        { value: 'Q60_SB', label: 'Q60 - Elmhurst to Jamaica' },
        { value: 'Q64_NB', label: 'Q64 - Jamaica to Elmhurst' },
        { value: 'Q64_SB', label: 'Q64 - Elmhurst to Jamaica' },
        { value: 'Q65_NB', label: 'Q65 - Jamaica to Flushing' },
        { value: 'Q65_SB', label: 'Q65 - Flushing to Jamaica' },
        { value: 'Q66_NB', label: 'Q66 - Jamaica to Astoria' },
        { value: 'Q66_SB', label: 'Q66 - Astoria to Jamaica' },
        { value: 'Q67_NB', label: 'Q67 - Jamaica to Long Island City' },
        { value: 'Q67_SB', label: 'Q67 - Long Island City to Jamaica' },
        { value: 'Q69_NB', label: 'Q69 - Jamaica to Astoria' },
        { value: 'Q69_SB', label: 'Q69 - Astoria to Jamaica' },
        { value: 'Q70_NB', label: 'Q70 - LaGuardia Airport to Jackson Heights' },
        { value: 'Q70_SB', label: 'Q70 - Jackson Heights to LaGuardia Airport' }
    ],
    'Bronx': [
        { value: 'Bx1_NB', label: 'Bx1 - Riverdale to Fordham' },
        { value: 'Bx1_SB', label: 'Bx1 - Fordham to Riverdale' },
        { value: 'Bx2_NB', label: 'Bx2 - Riverdale to Fordham' },
        { value: 'Bx2_SB', label: 'Bx2 - Fordham to Riverdale' },
        { value: 'Bx3_NB', label: 'Bx3 - Riverdale to Fordham' },
        { value: 'Bx3_SB', label: 'Bx3 - Fordham to Riverdale' },
        { value: 'Bx4_NB', label: 'Bx4 - Riverdale to Fordham' },
        { value: 'Bx4_SB', label: 'Bx4 - Fordham to Riverdale' },
        { value: 'Bx5_NB', label: 'Bx5 - Riverdale to Fordham' },
        { value: 'Bx5_SB', label: 'Bx5 - Fordham to Riverdale' },
        { value: 'Bx6_NB', label: 'Bx6 - Riverdale to Hunts Point' },
        { value: 'Bx6_SB', label: 'Bx6 - Hunts Point to Riverdale' },
        { value: 'Bx7_NB', label: 'Bx7 - Riverdale to Hunts Point' },
        { value: 'Bx7_SB', label: 'Bx7 - Hunts Point to Riverdale' },
        { value: 'Bx8_NB', label: 'Bx8 - Riverdale to Hunts Point' },
        { value: 'Bx8_SB', label: 'Bx8 - Hunts Point to Riverdale' },
        { value: 'Bx9_NB', label: 'Bx9 - Riverdale to Hunts Point' },
        { value: 'Bx9_SB', label: 'Bx9 - Hunts Point to Riverdale' },
        { value: 'Bx10_NB', label: 'Bx10 - Riverdale to Hunts Point' },
        { value: 'Bx10_SB', label: 'Bx10 - Hunts Point to Riverdale' },
        { value: 'Bx11_NB', label: 'Bx11 - Riverdale to Hunts Point' },
        { value: 'Bx11_SB', label: 'Bx11 - Hunts Point to Riverdale' },
        { value: 'Bx12_NB', label: 'Bx12 - Riverdale to Hunts Point' },
        { value: 'Bx12_SB', label: 'Bx12 - Hunts Point to Riverdale' },
        { value: 'Bx13_NB', label: 'Bx13 - Riverdale to Hunts Point' },
        { value: 'Bx13_SB', label: 'Bx13 - Hunts Point to Riverdale' },
        { value: 'Bx15_NB', label: 'Bx15 - Riverdale to Hunts Point' },
        { value: 'Bx15_SB', label: 'Bx15 - Hunts Point to Riverdale' },
        { value: 'Bx16_NB', label: 'Bx16 - Riverdale to Hunts Point' },
        { value: 'Bx16_SB', label: 'Bx16 - Hunts Point to Riverdale' },
        { value: 'Bx17_NB', label: 'Bx17 - Riverdale to Hunts Point' },
        { value: 'Bx17_SB', label: 'Bx17 - Hunts Point to Riverdale' },
        { value: 'Bx18_NB', label: 'Bx18 - Riverdale to Hunts Point' },
        { value: 'Bx18_SB', label: 'Bx18 - Hunts Point to Riverdale' },
        { value: 'Bx19_NB', label: 'Bx19 - Riverdale to Hunts Point' },
        { value: 'Bx19_SB', label: 'Bx19 - Hunts Point to Riverdale' },
        { value: 'Bx20_NB', label: 'Bx20 - Riverdale to Hunts Point' },
        { value: 'Bx20_SB', label: 'Bx20 - Hunts Point to Riverdale' },
        { value: 'Bx21_NB', label: 'Bx21 - Riverdale to Hunts Point' },
        { value: 'Bx21_SB', label: 'Bx21 - Hunts Point to Riverdale' },
        { value: 'Bx22_NB', label: 'Bx22 - Riverdale to Hunts Point' },
        { value: 'Bx22_SB', label: 'Bx22 - Hunts Point to Riverdale' },
        { value: 'Bx23_NB', label: 'Bx23 - Riverdale to Hunts Point' },
        { value: 'Bx23_SB', label: 'Bx23 - Hunts Point to Riverdale' },
        { value: 'Bx24_NB', label: 'Bx24 - Riverdale to Hunts Point' },
        { value: 'Bx24_SB', label: 'Bx24 - Hunts Point to Riverdale' },
        { value: 'Bx25_NB', label: 'Bx25 - Riverdale to Hunts Point' },
        { value: 'Bx25_SB', label: 'Bx25 - Hunts Point to Riverdale' },
        { value: 'Bx26_NB', label: 'Bx26 - Riverdale to Hunts Point' },
        { value: 'Bx26_SB', label: 'Bx26 - Hunts Point to Riverdale' },
        { value: 'Bx27_NB', label: 'Bx27 - Riverdale to Hunts Point' },
        { value: 'Bx27_SB', label: 'Bx27 - Hunts Point to Riverdale' },
        { value: 'Bx28_NB', label: 'Bx28 - Riverdale to Hunts Point' },
        { value: 'Bx28_SB', label: 'Bx28 - Hunts Point to Riverdale' },
        { value: 'Bx29_NB', label: 'Bx29 - Riverdale to Hunts Point' },
        { value: 'Bx29_SB', label: 'Bx29 - Hunts Point to Riverdale' },
        { value: 'Bx30_NB', label: 'Bx30 - Riverdale to Hunts Point' },
        { value: 'Bx30_SB', label: 'Bx30 - Hunts Point to Riverdale' },
        { value: 'Bx31_NB', label: 'Bx31 - Riverdale to Hunts Point' },
        { value: 'Bx31_SB', label: 'Bx31 - Hunts Point to Riverdale' },
        { value: 'Bx32_NB', label: 'Bx32 - Riverdale to Hunts Point' },
        { value: 'Bx32_SB', label: 'Bx32 - Hunts Point to Riverdale' },
        { value: 'Bx33_NB', label: 'Bx33 - Riverdale to Hunts Point' },
        { value: 'Bx33_SB', label: 'Bx33 - Hunts Point to Riverdale' },
        { value: 'Bx34_NB', label: 'Bx34 - Riverdale to Hunts Point' },
        { value: 'Bx34_SB', label: 'Bx34 - Hunts Point to Riverdale' },
        { value: 'Bx35_NB', label: 'Bx35 - Riverdale to Hunts Point' },
        { value: 'Bx35_SB', label: 'Bx35 - Hunts Point to Riverdale' },
        { value: 'Bx36_NB', label: 'Bx36 - Riverdale to Hunts Point' },
        { value: 'Bx36_SB', label: 'Bx36 - Hunts Point to Riverdale' },
        { value: 'Bx39_NB', label: 'Bx39 - Riverdale to Hunts Point' },
        { value: 'Bx39_SB', label: 'Bx39 - Hunts Point to Riverdale' },
        { value: 'Bx40_NB', label: 'Bx40 - Riverdale to Hunts Point' },
        { value: 'Bx40_SB', label: 'Bx40 - Hunts Point to Riverdale' },
        { value: 'Bx41_NB', label: 'Bx41 - Riverdale to Hunts Point' },
        { value: 'Bx41_SB', label: 'Bx41 - Hunts Point to Riverdale' },
        { value: 'Bx42_NB', label: 'Bx42 - Riverdale to Hunts Point' },
        { value: 'Bx42_SB', label: 'Bx42 - Hunts Point to Riverdale' },
        { value: 'Bx46_NB', label: 'Bx46 - Riverdale to Hunts Point' },
        { value: 'Bx46_SB', label: 'Bx46 - Hunts Point to Riverdale' }
    ]
};

// Flatten all bus lines for compatibility
const BUS_LINES = Object.values(BOROUGH_BUS_LINES).flat();

// Legacy bus lines array (now replaced by BOROUGH_BUS_LINES)
const LEGACY_BUS_LINES = [
    // B1 - Bay Ridge - Manhattan Beach
    { value: 'B1_NB', label: 'B1 - Bay Ridge to Manhattan Beach' },
    { value: 'B1_SB', label: 'B1 - Manhattan Beach to Bay Ridge' },
    
    // B2 - Kings Hwy Station - Kings Plaza
    { value: 'B2_NB', label: 'B2 - Kings Hwy Station to Kings Plaza' },
    { value: 'B2_SB', label: 'B2 - Kings Plaza to Kings Hwy Station' },
    
    // B3 - Bensonhurst - Bergen Beach
    { value: 'B3_NB', label: 'B3 - Bensonhurst to Bergen Beach' },
    { value: 'B3_SB', label: 'B3 - Bergen Beach to Bensonhurst' },
    
    // B4 - Bay Ridge - Sheepshead Bay
    { value: 'B4_NB', label: 'B4 - Bay Ridge to Sheepshead Bay' },
    { value: 'B4_SB', label: 'B4 - Sheepshead Bay to Bay Ridge' },
    
    // B6 - Bath Beach - East New York
    { value: 'B6_NB', label: 'B6 - Bath Beach to East New York' },
    { value: 'B6_SB', label: 'B6 - East New York to Bath Beach' },
    
    // B7 - Midwood - Bedford-Stuyvesant
    { value: 'B7_NB', label: 'B7 - Midwood to Bedford-Stuyvesant' },
    { value: 'B7_SB', label: 'B7 - Bedford-Stuyvesant to Midwood' },
    
    // B8 - Dyker Heights - East Flatbush
    { value: 'B8_NB', label: 'B8 - Dyker Heights to East Flatbush' },
    { value: 'B8_SB', label: 'B8 - East Flatbush to Dyker Heights' },
    
    // B9 - Bay Ridge - Kings Plaza
    { value: 'B9_NB', label: 'B9 - Bay Ridge to Kings Plaza' },
    { value: 'B9_SB', label: 'B9 - Kings Plaza to Bay Ridge' },
    
    // B11 - Sunset Park - Midwood
    { value: 'B11_NB', label: 'B11 - Sunset Park to Midwood' },
    { value: 'B11_SB', label: 'B11 - Midwood to Sunset Park' },
    
    // B12 - Lefferts Gardens - East New York
    { value: 'B12_NB', label: 'B12 - Lefferts Gardens to East New York' },
    { value: 'B12_SB', label: 'B12 - East New York to Lefferts Gardens' },
    
    // B13 - Spring Creek - Wyckoff Hospital
    { value: 'B13_NB', label: 'B13 - Spring Creek to Wyckoff Hospital' },
    { value: 'B13_SB', label: 'B13 - Wyckoff Hospital to Spring Creek' },
    
    // B14 - Spring Creek - Crown Heights
    { value: 'B14_NB', label: 'B14 - Spring Creek to Crown Heights' },
    { value: 'B14_SB', label: 'B14 - Crown Heights to Spring Creek' },
    
    // B15 - Bedford Stuyvesant - JFK AirTrain
    { value: 'B15_NB', label: 'B15 - Bedford Stuyvesant to JFK AirTrain' },
    { value: 'B15_SB', label: 'B15 - JFK AirTrain to Bedford Stuyvesant' },
    
    // B16 - Bay Ridge - Lefferts Gardens
    { value: 'B16_NB', label: 'B16 - Bay Ridge to Lefferts Gardens' },
    { value: 'B16_SB', label: 'B16 - Lefferts Gardens to Bay Ridge' },
    
    // B17 - Canarsie - Crown Heights
    { value: 'B17_NB', label: 'B17 - Canarsie to Crown Heights' },
    { value: 'B17_SB', label: 'B17 - Crown Heights to Canarsie' },
    
    // B20 - Ridgewood - Spring Creek
    { value: 'B20_NB', label: 'B20 - Ridgewood to Spring Creek' },
    { value: 'B20_SB', label: 'B20 - Spring Creek to Ridgewood' },
    
    // B24 - Williamsburg - Greenpoint
    { value: 'B24_NB', label: 'B24 - Williamsburg to Greenpoint' },
    { value: 'B24_SB', label: 'B24 - Greenpoint to Williamsburg' },
    
    // B25 - Downtown Brooklyn & DUMBO - Broadway Junction
    { value: 'B25_NB', label: 'B25 - Downtown Brooklyn & DUMBO to Broadway Junction' },
    { value: 'B25_SB', label: 'B25 - Broadway Junction to Downtown Brooklyn & DUMBO' },
    
    // B26 - Downtown Brooklyn - Ridgewood
    { value: 'B26_NB', label: 'B26 - Downtown Brooklyn to Ridgewood' },
    { value: 'B26_SB', label: 'B26 - Ridgewood to Downtown Brooklyn' },
    
    // B31 - Gerritsen Beach - Kings Hwy Station
    { value: 'B31_NB', label: 'B31 - Gerritsen Beach to Kings Hwy Station' },
    { value: 'B31_SB', label: 'B31 - Kings Hwy Station to Gerritsen Beach' },
    
    // B32 - Williamsburg - Long Island City
    { value: 'B32_NB', label: 'B32 - Williamsburg to Long Island City' },
    { value: 'B32_SB', label: 'B32 - Long Island City to Williamsburg' },
    
    // B35 - Brownsville - Sunset Park
    { value: 'B35_NB', label: 'B35 - Brownsville to Sunset Park' },
    { value: 'B35_SB', label: 'B35 - Sunset Park to Brownsville' },
    
    // B36 - Sheepshead Bay - Coney Island
    { value: 'B36_NB', label: 'B36 - Sheepshead Bay to Coney Island' },
    { value: 'B36_SB', label: 'B36 - Coney Island to Sheepshead Bay' },
    
    // B37 - Downtown Brooklyn - Bay Ridge
    { value: 'B37_NB', label: 'B37 - Downtown Brooklyn to Bay Ridge' },
    { value: 'B37_SB', label: 'B37 - Bay Ridge to Downtown Brooklyn' },
    
    // B38 - Ridgewood - Downtown Brooklyn
    { value: 'B38_NB', label: 'B38 - Ridgewood to Downtown Brooklyn' },
    { value: 'B38_SB', label: 'B38 - Downtown Brooklyn to Ridgewood' },
    
    // B39 - Williamsburg Bridge Plaza - Lower East Side
    { value: 'B39_NB', label: 'B39 - Williamsburg Bridge Plaza to Lower East Side' },
    { value: 'B39_SB', label: 'B39 - Lower East Side to Williamsburg Bridge Plaza' },
    
    // B41 - Kings Plaza - Downtown Brooklyn
    { value: 'B41_NB', label: 'B41 - Kings Plaza to Downtown Brooklyn' },
    { value: 'B41_SB', label: 'B41 - Downtown Brooklyn to Kings Plaza' },
    
    // B42 - Canarsie Pier - Rockaway Parkway Station
    { value: 'B42_NB', label: 'B42 - Canarsie Pier to Rockaway Parkway Station' },
    { value: 'B42_SB', label: 'B42 - Rockaway Parkway Station to Canarsie Pier' },
    
    // B43 - Greenpoint - Lefferts Gardens
    { value: 'B43_NB', label: 'B43 - Greenpoint to Lefferts Gardens' },
    { value: 'B43_SB', label: 'B43 - Lefferts Gardens to Greenpoint' },
    
    // B44 - Sheepshead Bay - Williamsburg
    { value: 'B44_NB', label: 'B44 - Sheepshead Bay to Williamsburg' },
    { value: 'B44_SB', label: 'B44 - Williamsburg to Sheepshead Bay' },
    
    // B44 SBS - Sheepshead Bay - Williamsburg (Select Bus Service)
    { value: 'B44+_NB', label: 'B44-SBS - Sheepshead Bay to Williamsburg (Select Bus)' },
    { value: 'B44+_SB', label: 'B44-SBS - Williamsburg to Sheepshead Bay (Select Bus)' },
    
    // B45 - Downtown Brooklyn - Crown Heights
    { value: 'B45_NB', label: 'B45 - Downtown Brooklyn to Crown Heights' },
    { value: 'B45_SB', label: 'B45 - Crown Heights to Downtown Brooklyn' },
    
    // B46 - Kings Plaza - Williamsburg
    { value: 'B46_NB', label: 'B46 - Kings Plaza to Williamsburg' },
    { value: 'B46_SB', label: 'B46 - Williamsburg to Kings Plaza' },
    
    // B46 SBS - Kings Plaza - Williamsburg (Select Bus Service)
    { value: 'B46+_NB', label: 'B46-SBS - Kings Plaza to Williamsburg (Select Bus)' },
    { value: 'B46+_SB', label: 'B46-SBS - Williamsburg to Kings Plaza (Select Bus)' },
    
    // B47 - Kings Plaza - Bedford-Stuyvesant
    { value: 'B47_NB', label: 'B47 - Kings Plaza to Bedford-Stuyvesant' },
    { value: 'B47_SB', label: 'B47 - Bedford-Stuyvesant to Kings Plaza' },
    
    // B48 - Lefferts Gardens - Greenpoint
    { value: 'B48_NB', label: 'B48 - Lefferts Gardens to Greenpoint' },
    { value: 'B48_SB', label: 'B48 - Greenpoint to Lefferts Gardens' },
    
    // B49 - Manhattan Beach - Bedford-Stuyvesant
    { value: 'B49_NB', label: 'B49 - Manhattan Beach to Bedford-Stuyvesant' },
    { value: 'B49_SB', label: 'B49 - Bedford-Stuyvesant to Manhattan Beach' },
    
    // B52 - Downtown Brooklyn - Ridgewood
    { value: 'B52_NB', label: 'B52 - Downtown Brooklyn to Ridgewood' },
    { value: 'B52_SB', label: 'B52 - Ridgewood to Downtown Brooklyn' },
    
    // B54 - Downtown Brooklyn - Ridgewood
    { value: 'B54_NB', label: 'B54 - Downtown Brooklyn to Ridgewood' },
    { value: 'B54_SB', label: 'B54 - Ridgewood to Downtown Brooklyn' },
    
    // B57 - Gowanus - Maspeth
    { value: 'B57_NB', label: 'B57 - Gowanus to Maspeth' },
    { value: 'B57_SB', label: 'B57 - Maspeth to Gowanus' },
    
    // B60 - Williamsburg - Canarsie
    { value: 'B60_NB', label: 'B60 - Williamsburg to Canarsie' },
    { value: 'B60_SB', label: 'B60 - Canarsie to Williamsburg' },
    
    // B61 - Park Slope - Downtown Brooklyn
    { value: 'B61_NB', label: 'B61 - Park Slope to Downtown Brooklyn' },
    { value: 'B61_SB', label: 'B61 - Downtown Brooklyn to Park Slope' },
    
    // B62 - Downtown Brooklyn - Long Island City
    { value: 'B62_NB', label: 'B62 - Downtown Brooklyn to Long Island City' },
    { value: 'B62_SB', label: 'B62 - Long Island City to Downtown Brooklyn' },
    
    // B63 - Bay Ridge - Cobble Hill
    { value: 'B63_NB', label: 'B63 - Bay Ridge to Cobble Hill' },
    { value: 'B63_SB', label: 'B63 - Cobble Hill to Bay Ridge' },
    
    // B64 - Bay Ridge - Coney Island
    { value: 'B64_NB', label: 'B64 - Bay Ridge to Coney Island' },
    { value: 'B64_SB', label: 'B64 - Coney Island to Bay Ridge' },
    
    // B65 - Downtown Brooklyn - Crown Heights
    { value: 'B65_NB', label: 'B65 - Downtown Brooklyn to Crown Heights' },
    { value: 'B65_SB', label: 'B65 - Crown Heights to Downtown Brooklyn' },
    
    // B67 - Brooklyn Navy Yard - Kensington
    { value: 'B67_NB', label: 'B67 - Brooklyn Navy Yard to Kensington' },
    { value: 'B67_SB', label: 'B67 - Kensington to Brooklyn Navy Yard' },
    
    // B68 - Coney Island - Windsor Terrace
    { value: 'B68_NB', label: 'B68 - Coney Island to Windsor Terrace' },
    { value: 'B68_SB', label: 'B68 - Windsor Terrace to Coney Island' },
    
    // B69 - Downtown Brooklyn - Kensington
    { value: 'B69_NB', label: 'B69 - Downtown Brooklyn to Kensington' },
    { value: 'B69_SB', label: 'B69 - Kensington to Downtown Brooklyn' },
    
    // B70 - Dyker Heights - Sunset Park
    { value: 'B70_NB', label: 'B70 - Dyker Heights to Sunset Park' },
    { value: 'B70_SB', label: 'B70 - Sunset Park to Dyker Heights' },
    
    // B74 - Sea Gate - Stillwell Av
    { value: 'B74_NB', label: 'B74 - Sea Gate to Stillwell Av' },
    { value: 'B74_SB', label: 'B74 - Stillwell Av to Sea Gate' },
    
    // B82 - Coney Island - Spring Creek Towers
    { value: 'B82_NB', label: 'B82 - Coney Island to Spring Creek Towers' },
    { value: 'B82_SB', label: 'B82 - Spring Creek Towers to Coney Island' },
    
    // B82 SBS - Coney Island - Spring Creek Towers (Select Bus Service)
    { value: 'B82+_NB', label: 'B82-SBS - Coney Island to Spring Creek Towers (Select Bus)' },
    { value: 'B82+_SB', label: 'B82-SBS - Spring Creek Towers to Coney Island (Select Bus)' },
    
    // B83 - Spring Creek - Broadway Junction
    { value: 'B83_NB', label: 'B83 - Spring Creek to Broadway Junction' },
    { value: 'B83_SB', label: 'B83 - Broadway Junction to Spring Creek' },
    
    // B84 - Spring Creek - New Lots
    { value: 'B84_NB', label: 'B84 - Spring Creek to New Lots' },
    { value: 'B84_SB', label: 'B84 - New Lots to Spring Creek' }
];

const LINE_COLORS = ['#d500f9', '#00bcd4', '#ffeb3b', '#ff5722', '#4caf50', '#2196f3', '#e91e63', '#8bc34a', '#ff9800', '#9c27b0'];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8'
    },
    content: {
        flex: 1,
        padding: 16
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1976d2',
        textAlign: 'center',
        marginBottom: 16
    },
    section: {
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 8
    },
    text: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4
    },
    busItem: {
        backgroundColor: '#fff',
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    busId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976d2'
    },
    busDetails: {
        fontSize: 14,
        color: '#666',
        marginTop: 4
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20
    },
    loadingText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20
    },
    lineSelector: {
        marginBottom: 8
    },
    lineButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center'
    },
    selectedLineButton: {
        borderWidth: 3,
        borderColor: '#1976d2'
    },
    lineButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    },
    selectorButton: {
        backgroundColor: '#1976d2',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    selectorButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    mapContainer: {
        height: 300,
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        overflow: 'hidden'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxHeight: '70%'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976d2',
        textAlign: 'center',
        marginBottom: 16
    },
    modalItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    modalItemText: {
        fontSize: 16,
        color: '#333'
    },
    modalCloseButton: {
        backgroundColor: '#d32f2f',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    }
});

export default function App() {
    const [selectedBorough, setSelectedBorough] = useState('Brooklyn');
    const [selectedLine, setSelectedLine] = useState('B47_NB');
    const [selectedStop, setSelectedStop] = useState(null);
    const [busData, setBusData] = useState([]);
    const [favStops, setFavStops] = useState([]);
    const [lastUpdateTime, setLastUpdateTime] = useState({ time: null, loading: false, error: false });
    const [showBoroughModal, setShowBoroughModal] = useState(false);
    const [showLineModal, setShowLineModal] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [trackingSubscriptionId, setTrackingSubscriptionId] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    
    // Authentication state
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    
    // Get user's current location
    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    // Load favorite stops from AsyncStorage and get user location on app start
    useEffect(() => {
        const loadFavStops = async () => {
            try {
                const savedStops = await AsyncStorage.getItem('favStops');
                if (savedStops) {
                    setFavStops(JSON.parse(savedStops));
                }
            } catch (e) {
                console.error('Error loading saved stops:', e);
            }
        };
        loadFavStops();
        getUserLocation();
    }, []);

    // Save favorite stops to AsyncStorage whenever they change
    useEffect(() => {
        const saveFavStops = async () => {
            try {
                await AsyncStorage.setItem('favStops', JSON.stringify(favStops));
            } catch (e) {
                console.error('Error saving favorite stops:', e);
            }
        };
        saveFavStops();
    }, [favStops]);

    // Calculate distance between two coordinates in kilometers
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Fetch bus data
    const fetchBusData = async () => {
        if (!selectedLine) {
            console.log('No line selected, skipping fetch');
            return;
        }
        
        setLastUpdateTime(prev => ({ ...prev, loading: true, error: false }));
        try {
            // Strip direction suffix (_NB, _SB) from line reference for API call
            const apiLineRef = selectedLine.replace(/_[NS]B$/, '');
            const data = await fetchBusesForLine(apiLineRef);
            let filteredData = data || [];
            
            // If user location is available, show only the closest buses to user
            if (userLocation && userLocation.latitude && userLocation.longitude) {
                // Calculate distance for each bus and filter valid buses
                const busesWithDistance = filteredData
                    .filter(bus => bus.lat && bus.lon) // Only buses with valid coordinates
                    .map(bus => ({
                        ...bus,
                        distanceToUser: calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            bus.lat,
                            bus.lon
                        )
                    }))
                    .sort((a, b) => a.distanceToUser - b.distanceToUser); // Sort by distance
                
                // Show only the 3 closest buses
                filteredData = busesWithDistance.slice(0, 3);
            } else if (selectedStop && selectedStop.latitude && selectedStop.longitude) {
                // Fallback: filter by proximity to selected stop if no user location
                const PROXIMITY_THRESHOLD = 0.02; // ~2km radius
                
                filteredData = filteredData.filter(bus => {
                    if (!bus.lat || !bus.lon) {
                        return false;
                    }
                    
                    const latDiff = Math.abs(bus.lat - selectedStop.latitude);
                    const lonDiff = Math.abs(bus.lon - selectedStop.longitude);
                    
                    return latDiff <= PROXIMITY_THRESHOLD && lonDiff <= PROXIMITY_THRESHOLD;
                });
            }
            
            setBusData(filteredData);
            setLastUpdateTime(prev => ({ ...prev, time: new Date(), loading: false, error: false }));
        } catch (error) {
            console.error('Error fetching bus data:', error);
            setLastUpdateTime(prev => ({ ...prev, loading: false, error: true }));
        }
    };

    // Authentication state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setAuthLoading(false);
        });
        return unsubscribe;
    }, []);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (user) {
            fetchBusData();
            const interval = setInterval(fetchBusData, 30000);
            return () => clearInterval(interval);
        }
    }, [selectedLine, selectedStop, user]);

    // Check tracking status when line or stop changes
    useEffect(() => {
        if (user) {
            checkTrackingStatus();
        }
    }, [selectedLine, selectedStop, user]);

    // Get stops for selected line
    const getStopsForLine = (lineId) => {
        // Convert the lineId format to match GTFS_STOPS keys
        // BOROUGH_BUS_LINES uses "+" for SBS routes, but GTFS_STOPS uses "-SBS"
        let gtfsLineId = lineId;
        if (lineId && lineId.includes('+')) {
            gtfsLineId = lineId.replace('+', '-SBS');
        }
        
        // GTFS_STOPS is an object with route keys, so we need to get the stops for the specific route
        return GTFS_STOPS[gtfsLineId] || [];
    };

    const handleBoroughSelect = (borough) => {
        setSelectedBorough(borough);
        const firstLine = BOROUGH_BUS_LINES[borough][0];
        setSelectedLine(firstLine.value);
        setSelectedStop(null);
        setShowBoroughModal(false);
    };

    const handleLineSelect = (lineValue) => {
        setSelectedLine(lineValue);
        setSelectedStop(null);
        setShowLineModal(false);
    };

    const handleStopSelect = (stop) => {
        setSelectedStop(stop);
        setShowStopModal(false);
        // Check if this combination is already being tracked
        checkTrackingStatus();
    };

    // Check if current bus/stop combination is being tracked
    const checkTrackingStatus = async () => {
        if (!auth.currentUser || !selectedLine || !selectedStop) {
            setIsTracking(false);
            setTrackingSubscriptionId(null);
            return;
        }

        try {
            const q = query(
                collection(db, 'userSubscriptions'),
                where('userId', '==', auth.currentUser.uid),
                where('routeId', '==', selectedLine.replace(/_NB|_SB/, '')),
                where('stopId', '==', selectedStop.id)
            );
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                setIsTracking(true);
                setTrackingSubscriptionId(querySnapshot.docs[0].id);
            } else {
                setIsTracking(false);
                setTrackingSubscriptionId(null);
            }
        } catch (error) {
            console.error('Error checking tracking status:', error);
        }
    };

    // Start tracking the selected bus and stop
    const startTracking = async () => {
        if (!auth.currentUser) {
            Alert.alert('Authentication Required', 'Please sign in to track buses.');
            return;
        }

        if (!selectedLine || !selectedStop) {
            Alert.alert('Selection Required', 'Please select a bus line and stop to track.');
            return;
        }

        try {
            // Register for push notifications if not already done
            const pushToken = await registerForPushNotificationsAsync();
            if (!pushToken) {
                Alert.alert('Notification Error', 'Failed to register for push notifications.');
                return;
            }

            // Create subscription
            const subscription = {
                userId: auth.currentUser.uid,
                routeId: selectedLine.replace(/_NB|_SB/, ''), // Remove direction suffix
                stopId: selectedStop.id,
                stopName: selectedStop.name,
                stopLatitude: selectedStop.lat,
                stopLongitude: selectedStop.lon,
                fcmToken: pushToken,
                notified1Mile: false,
                notified0_5Mile: false,
                createdAt: new Date(),
                lastNotificationSentAt: null
            };

            const docRef = await addDoc(collection(db, 'userSubscriptions'), subscription);
            setIsTracking(true);
            setTrackingSubscriptionId(docRef.id);
            
            Alert.alert(
                'Tracking Started', 
                `You will receive notifications when buses on ${selectedLine.replace(/_NB|_SB/, '')} approach ${selectedStop.name}.`
            );
        } catch (error) {
            console.error('Error starting tracking:', error);
            Alert.alert('Error', 'Failed to start tracking. Please try again.');
        }
    };

    // Stop tracking the selected bus and stop
    const stopTracking = async () => {
        if (!trackingSubscriptionId) return;

        try {
            await deleteDoc(doc(db, 'userSubscriptions', trackingSubscriptionId));
            setIsTracking(false);
            setTrackingSubscriptionId(null);
            
            Alert.alert('Tracking Stopped', 'You will no longer receive notifications for this bus.');
        } catch (error) {
            console.error('Error stopping tracking:', error);
            Alert.alert('Error', 'Failed to stop tracking. Please try again.');
        }
    };

    // Show loading screen while checking authentication
    if (authLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // Show authentication screen if user is not logged in
    if (!user) {
        if (showResetPassword) {
            return (
                <ResetPasswordScreen 
                    navigation={{ goBack: () => setShowResetPassword(false) }}
                />
            );
        }
        return (
            <AuthScreen 
                onAuth={() => setUser(auth.currentUser)}
                onForgotPassword={() => setShowResetPassword(true)}
            />
        );
    }

    // Show profile screen if requested
    if (showProfile) {
        return (
            <ProfileScreen 
                onClose={() => setShowProfile(false)}
            />
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={styles.title}>MTA Bus Tracker</Text>
                    <TouchableOpacity 
                        style={[styles.selectorButton, { paddingHorizontal: 12, paddingVertical: 8 }]}
                        onPress={() => setShowProfile(true)}
                    >
                        <Text style={[styles.selectorButtonText, { fontSize: 14 }]}>Profile</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Borough</Text>
                    <TouchableOpacity 
                        style={styles.selectorButton}
                        onPress={() => setShowBoroughModal(true)}
                    >
                        <Text style={styles.selectorButtonText}>{selectedBorough}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Bus Line</Text>
                    <TouchableOpacity 
                        style={styles.selectorButton}
                        onPress={() => setShowLineModal(true)}
                    >
                        <Text style={styles.selectorButtonText}>{selectedLine}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Stop (Optional)</Text>
                    <TouchableOpacity 
                        style={styles.selectorButton}
                        onPress={() => setShowStopModal(true)}
                    >
                        <Text style={styles.selectorButtonText}>
                            {selectedStop ? selectedStop.stop_name : 'All Stops'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Selected Line: {selectedLine}</Text>
                    {selectedStop && (
                        <Text style={styles.text}>Selected Stop: {selectedStop.name}</Text>
                    )}
                    <Text style={styles.text}>Buses found: {busData.length}</Text>
                    <Text style={styles.text}>
                        Last updated: {lastUpdateTime?.time ? lastUpdateTime.time.toLocaleTimeString() : 'Never'}
                    </Text>
                    {lastUpdateTime?.loading && <Text style={styles.loadingText}>Loading...</Text>}
                    {lastUpdateTime?.error && <Text style={styles.errorText}>Error loading data</Text>}
                    
                    {/* Track Bus Button */}
                    {selectedLine && selectedStop && (
                        <TouchableOpacity 
                            style={[styles.selectorButton, { 
                                backgroundColor: isTracking ? '#d32f2f' : '#4caf50',
                                marginTop: 12
                            }]}
                            onPress={isTracking ? stopTracking : startTracking}
                        >
                            <Text style={styles.selectorButtonText}>
                                {isTracking ? 'Stop Tracking' : 'Track This Bus'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bus List - Only show on web */}
                {Platform.OS === 'web' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Bus List</Text>
                        {busData.length === 0 ? (
                            <Text style={styles.text}>
                                {selectedStop 
                                    ? 'No buses found near the selected stop' 
                                    : 'No buses found for this line'
                                }
                            </Text>
                        ) : (
                            busData.map((bus, index) => (
                                <View key={index} style={styles.busItem}>
                                    <Text style={styles.busId}>Bus {bus.id || bus.vehicleRef || 'Unknown'}</Text>
                                    <Text style={styles.busDetails}>
                                        Location: {bus.lat || bus.latitude}, {bus.lon || bus.longitude}
                                    </Text>
                                    <Text style={styles.busDetails}>
                                        Next Stop: {bus.nextStop || 'Unknown'}
                                    </Text>
                                    <Text style={styles.busDetails}>
                                        Updated: {new Date(bus.recordedAtTime).toLocaleTimeString()}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* Map Component */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Map View</Text>
                    <View style={styles.mapContainer}>
                        <MapComponent 
                            buses={busData}
                            selectedLine={selectedLine}
                            selectedStop={selectedStop}
                            stops={getStopsForLine(selectedLine)}
                            userLocation={userLocation}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Borough Selection Modal */}
            <Modal
                visible={showBoroughModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowBoroughModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Borough</Text>
                        <FlatList
                            data={Object.keys(BOROUGH_BUS_LINES)}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => handleBoroughSelect(item)}
                                >
                                    <Text style={styles.modalItemText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowBoroughModal(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Line Selection Modal */}
            <Modal
                visible={showLineModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowLineModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Bus Line</Text>
                        <FlatList
                            data={BOROUGH_BUS_LINES[selectedBorough]}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => handleLineSelect(item.value)}
                                >
                                    <Text style={styles.modalItemText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowLineModal(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Stop Selection Modal */}
            <Modal
                visible={showStopModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowStopModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Stop</Text>
                        <TouchableOpacity
                            style={styles.modalItem}
                            onPress={() => handleStopSelect(null)}
                        >
                            <Text style={styles.modalItemText}>All Stops</Text>
                        </TouchableOpacity>
                        <FlatList
                            data={getStopsForLine(selectedLine)}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => handleStopSelect(item)}
                                >
                                    <Text style={styles.modalItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowStopModal(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
