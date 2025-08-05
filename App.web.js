import React, { useEffect, useState } from 'react';
import { GTFS_STOPS } from './utils/gtfsStops';
import { fetchBusesForLine } from './utils/mtaApi';
import MapComponent from './MapComponent.web.js';

// Borough-based bus line organization
const BOROUGH_BUS_LINES = {
    'Brooklyn': [
        // B1 - Bay Ridge - Manhattan Beach
        { value: 'B1_NB', label: 'B1 - Bay Ridge to Manhattan Beach' },
        { value: 'B1_SB', label: 'B1 - Manhattan Beach to Bay Ridge' },
    
    // B2 - Kings Highway Station - Kings Plaza
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
    
    // B31 - Gerritsen Beach - Kings Highway Station
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
    
    // B44-SBS - Sheepshead Bay - Williamsburg (Select Bus)
    { value: 'B44+_NB', label: 'B44-SBS - Sheepshead Bay to Williamsburg (Select Bus)' },
    { value: 'B44+_SB', label: 'B44-SBS - Williamsburg to Sheepshead Bay (Select Bus)' },
    
    // B45 - Downtown Brooklyn - Crown Heights
    { value: 'B45_NB', label: 'B45 - Downtown Brooklyn to Crown Heights' },
    { value: 'B45_SB', label: 'B45 - Crown Heights to Downtown Brooklyn' },
    
    // B46 - Kings Plaza - Williamsburg
    { value: 'B46_NB', label: 'B46 - Kings Plaza to Williamsburg' },
    { value: 'B46_SB', label: 'B46 - Williamsburg to Kings Plaza' },
    
    // B46-SBS - Kings Plaza - Williamsburg (Select Bus)
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
    
    // B74 - Sea Gate - Stillwell Avenue
    { value: 'B74_NB', label: 'B74 - Sea Gate to Stillwell Av' },
    { value: 'B74_SB', label: 'B74 - Stillwell Av to Sea Gate' },
    
    // B82 - Coney Island - Spring Creek Towers
    { value: 'B82_NB', label: 'B82 - Coney Island to Spring Creek Towers' },
    { value: 'B82_SB', label: 'B82 - Spring Creek Towers to Coney Island' },
    
    // B82-SBS - Coney Island - Spring Creek Towers (Select Bus)
    { value: 'B82+_NB', label: 'B82-SBS - Coney Island to Spring Creek Towers (Select Bus)' },
    { value: 'B82+_SB', label: 'B82-SBS - Spring Creek Towers to Coney Island (Select Bus)' },
    
    // B83 - Spring Creek - Broadway Junction
    { value: 'B83_NB', label: 'B83 - Spring Creek to Broadway Junction' },
    { value: 'B83_SB', label: 'B83 - Broadway Junction to Spring Creek' },
    
    // B84 - Spring Creek - New Lots
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
        { value: 'M15-SBS_NB', label: 'M15-SBS - South Ferry to East Harlem (Select Bus)' },
        { value: 'M15-SBS_SB', label: 'M15-SBS - East Harlem to South Ferry (Select Bus)' },
        { value: 'M20_NB', label: 'M20 - West Side to East Side' },
        { value: 'M20_SB', label: 'M20 - East Side to West Side' },
        { value: 'M21_NB', label: 'M21 - East Side to West Side' },
        { value: 'M21_SB', label: 'M21 - West Side to East Side' },
        { value: 'M22_NB', label: 'M22 - East Side to West Side' },
        { value: 'M22_SB', label: 'M22 - West Side to East Side' },
        { value: 'M23-SBS_NB', label: 'M23-SBS - East 23rd Street to West 23rd Street' },
        { value: 'M23-SBS_SB', label: 'M23-SBS - West 23rd Street to East 23rd Street' },
        { value: 'M31_NB', label: 'M31 - East Side to West Side' },
        { value: 'M31_SB', label: 'M31 - West Side to East Side' },
        { value: 'M34-SBS_NB', label: 'M34-SBS - East 34th Street to West 34th Street' },
        { value: 'M34-SBS_SB', label: 'M34-SBS - West 34th Street to East 34th Street' },
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
        { value: 'M60-SBS_NB', label: 'M60-SBS - LaGuardia Airport to West Harlem' },
        { value: 'M60-SBS_SB', label: 'M60-SBS - West Harlem to LaGuardia Airport' },
        { value: 'M66_NB', label: 'M66 - Lincoln Center to East 67th Street' },
        { value: 'M66_SB', label: 'M66 - East 67th Street to Lincoln Center' },
        { value: 'M72_NB', label: 'M72 - West 72nd Street to East 72nd Street' },
        { value: 'M72_SB', label: 'M72 - East 72nd Street to West 72nd Street' },
        { value: 'M79-SBS_NB', label: 'M79-SBS - West 79th Street to East 79th Street' },
        { value: 'M79-SBS_SB', label: 'M79-SBS - East 79th Street to West 79th Street' },
        { value: 'M86-SBS_NB', label: 'M86-SBS - West 86th Street to East 86th Street' },
        { value: 'M86-SBS_SB', label: 'M86-SBS - East 86th Street to West 86th Street' },
        { value: 'M96_NB', label: 'M96 - West 96th Street to East 96th Street' },
        { value: 'M96_SB', label: 'M96 - East 96th Street to West 96th Street' },
        { value: 'M98_NB', label: 'M98 - East Harlem to Lower East Side' },
        { value: 'M98_SB', label: 'M98 - Lower East Side to East Harlem' },
        { value: 'M100_NB', label: 'M100 - Inwood to Lower East Side' },
        { value: 'M100_SB', label: 'M100 - Lower East Side to Inwood' },
        { value: 'M101_NB', label: 'M101 - East Harlem to Lower East Side' },
        { value: 'M101_SB', label: 'M101 - Lower East Side to East Harlem' },
        { value: 'M102_NB', label: 'M102 - East Harlem to Lower East Side' },
        { value: 'M102_SB', label: 'M102 - Lower East Side to East Harlem' },
        { value: 'M103_NB', label: 'M103 - East Harlem to Lower East Side' },
        { value: 'M103_SB', label: 'M103 - Lower East Side to East Harlem' },
        { value: 'M104_NB', label: 'M104 - West Harlem to Lower West Side' },
        { value: 'M104_SB', label: 'M104 - Lower West Side to West Harlem' },
        { value: 'M106_NB', label: 'M106 - East Harlem to Yorkville' },
        { value: 'M106_SB', label: 'M106 - Yorkville to East Harlem' },
        { value: 'M116_NB', label: 'M116 - West Harlem to East Harlem' },
        { value: 'M116_SB', label: 'M116 - East Harlem to West Harlem' },
        { value: 'M125_NB', label: 'M125 - West Harlem to East Harlem' },
        { value: 'M125_SB', label: 'M125 - East Harlem to West Harlem' }
    ],
    'Queens': [
        { value: 'Q1_NB', label: 'Q1 - Jamaica to Broad Channel' },
        { value: 'Q1_SB', label: 'Q1 - Broad Channel to Jamaica' },
        { value: 'Q2_NB', label: 'Q2 - Jamaica to Rosedale' },
        { value: 'Q2_SB', label: 'Q2 - Rosedale to Jamaica' },
        { value: 'Q3_NB', label: 'Q3 - Jamaica to JFK Airport' },
        { value: 'Q3_SB', label: 'Q3 - JFK Airport to Jamaica' },
        { value: 'Q4_NB', label: 'Q4 - Jamaica to Cambria Heights' },
        { value: 'Q4_SB', label: 'Q4 - Cambria Heights to Jamaica' },
        { value: 'Q5_NB', label: 'Q5 - Jamaica to Green Acres Mall' },
        { value: 'Q5_SB', label: 'Q5 - Green Acres Mall to Jamaica' },
        { value: 'Q6_NB', label: 'Q6 - Jamaica to Rosedale' },
        { value: 'Q6_SB', label: 'Q6 - Rosedale to Jamaica' },
        { value: 'Q7_NB', label: 'Q7 - Long Island City to Flushing' },
        { value: 'Q7_SB', label: 'Q7 - Flushing to Long Island City' },
        { value: 'Q8_NB', label: 'Q8 - Jamaica to Broad Channel' },
        { value: 'Q8_SB', label: 'Q8 - Broad Channel to Jamaica' },
        { value: 'Q9_NB', label: 'Q9 - Jamaica to Rockaway Beach' },
        { value: 'Q9_SB', label: 'Q9 - Rockaway Beach to Jamaica' },
        { value: 'Q10_NB', label: 'Q10 - Kew Gardens to JFK Airport' },
        { value: 'Q10_SB', label: 'Q10 - JFK Airport to Kew Gardens' },
        { value: 'Q11_NB', label: 'Q11 - Jamaica to Woodhaven' },
        { value: 'Q11_SB', label: 'Q11 - Woodhaven to Jamaica' },
        { value: 'Q12_NB', label: 'Q12 - Jamaica to Astoria' },
        { value: 'Q12_SB', label: 'Q12 - Astoria to Jamaica' },
        { value: 'Q13_NB', label: 'Q13 - Jamaica to Whitestone' },
        { value: 'Q13_SB', label: 'Q13 - Whitestone to Jamaica' },
        { value: 'Q15_NB', label: 'Q15 - Jamaica to Whitestone' },
        { value: 'Q15_SB', label: 'Q15 - Whitestone to Jamaica' },
        { value: 'Q16_NB', label: 'Q16 - Jamaica to Broad Channel' },
        { value: 'Q16_SB', label: 'Q16 - Broad Channel to Jamaica' },
        { value: 'Q17_NB', label: 'Q17 - Jamaica to Broad Channel' },
        { value: 'Q17_SB', label: 'Q17 - Broad Channel to Jamaica' },
        { value: 'Q20_NB', label: 'Q20 - Jamaica to Whitestone' },
        { value: 'Q20_SB', label: 'Q20 - Whitestone to Jamaica' },
        { value: 'Q21_NB', label: 'Q21 - Jamaica to Whitestone' },
        { value: 'Q21_SB', label: 'Q21 - Whitestone to Jamaica' },
        { value: 'Q25_NB', label: 'Q25 - Jamaica to Flushing' },
        { value: 'Q25_SB', label: 'Q25 - Flushing to Jamaica' },
        { value: 'Q26_NB', label: 'Q26 - Jamaica to Auburndale' },
        { value: 'Q26_SB', label: 'Q26 - Auburndale to Jamaica' },
        { value: 'Q27_NB', label: 'Q27 - Jamaica to Cambria Heights' },
        { value: 'Q27_SB', label: 'Q27 - Cambria Heights to Jamaica' },
        { value: 'Q28_NB', label: 'Q28 - Jamaica to Flushing' },
        { value: 'Q28_SB', label: 'Q28 - Flushing to Jamaica' },
        { value: 'Q30_NB', label: 'Q30 - Jamaica to Astoria' },
        { value: 'Q30_SB', label: 'Q30 - Astoria to Jamaica' },
        { value: 'Q31_NB', label: 'Q31 - Jamaica to Astoria' },
        { value: 'Q31_SB', label: 'Q31 - Astoria to Jamaica' },
        { value: 'Q32_NB', label: 'Q32 - Jamaica to Long Island City' },
        { value: 'Q32_SB', label: 'Q32 - Long Island City to Jamaica' },
        { value: 'Q33_NB', label: 'Q33 - Jamaica to Long Island City' },
        { value: 'Q33_SB', label: 'Q33 - Long Island City to Jamaica' },
        { value: 'Q34_NB', label: 'Q34 - Jamaica to Whitestone' },
        { value: 'Q34_SB', label: 'Q34 - Whitestone to Jamaica' },
        { value: 'Q35_NB', label: 'Q35 - Jamaica to Rockaway Park' },
        { value: 'Q35_SB', label: 'Q35 - Rockaway Park to Jamaica' },
        { value: 'Q36_NB', label: 'Q36 - Jamaica to Rockaway Park' },
        { value: 'Q36_SB', label: 'Q36 - Rockaway Park to Jamaica' },
        { value: 'Q37_NB', label: 'Q37 - Jamaica to Ridgewood' },
        { value: 'Q37_SB', label: 'Q37 - Ridgewood to Jamaica' },
        { value: 'Q38_NB', label: 'Q38 - Jamaica to Ridgewood' },
        { value: 'Q38_SB', label: 'Q38 - Ridgewood to Jamaica' },
        { value: 'Q39_NB', label: 'Q39 - Jamaica to Ridgewood' },
        { value: 'Q39_SB', label: 'Q39 - Ridgewood to Jamaica' },
        { value: 'Q40_NB', label: 'Q40 - Jamaica to Rockaway Park' },
        { value: 'Q40_SB', label: 'Q40 - Rockaway Park to Jamaica' },
        { value: 'Q41_NB', label: 'Q41 - Jamaica to Elmhurst' },
        { value: 'Q41_SB', label: 'Q41 - Elmhurst to Jamaica' },
        { value: 'Q42_NB', label: 'Q42 - Jamaica to Elmhurst' },
        { value: 'Q42_SB', label: 'Q42 - Elmhurst to Jamaica' },
        { value: 'Q43_NB', label: 'Q43 - Jamaica to Elmhurst' },
        { value: 'Q43_SB', label: 'Q43 - Elmhurst to Jamaica' },
        { value: 'Q44_NB', label: 'Q44 - Jamaica to Bronx' },
        { value: 'Q44_SB', label: 'Q44 - Bronx to Jamaica' },
        { value: 'Q46_NB', label: 'Q46 - Jamaica to Glen Oaks' },
        { value: 'Q46_SB', label: 'Q46 - Glen Oaks to Jamaica' },
        { value: 'Q47_NB', label: 'Q47 - Jamaica to Bayside' },
        { value: 'Q47_SB', label: 'Q47 - Bayside to Jamaica' },
        { value: 'Q48_NB', label: 'Q48 - Jamaica to Flushing' },
        { value: 'Q48_SB', label: 'Q48 - Flushing to Jamaica' },
        { value: 'Q49_NB', label: 'Q49 - Jamaica to Astoria' },
        { value: 'Q49_SB', label: 'Q49 - Astoria to Jamaica' },
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
        { value: 'Q70_SB', label: 'Q70 - Jackson Heights to LaGuardia Airport' },
        { value: 'Q72_NB', label: 'Q72 - Jamaica to Elmhurst' },
        { value: 'Q72_SB', label: 'Q72 - Elmhurst to Jamaica' },
        { value: 'Q76_NB', label: 'Q76 - Jamaica to Cambria Heights' },
        { value: 'Q76_SB', label: 'Q76 - Cambria Heights to Jamaica' },
        { value: 'Q77_NB', label: 'Q77 - Jamaica to Cambria Heights' },
        { value: 'Q77_SB', label: 'Q77 - Cambria Heights to Jamaica' },
        { value: 'Q83_NB', label: 'Q83 - Jamaica to Cambria Heights' },
        { value: 'Q83_SB', label: 'Q83 - Cambria Heights to Jamaica' },
        { value: 'Q84_NB', label: 'Q84 - Jamaica to Cambria Heights' },
        { value: 'Q84_SB', label: 'Q84 - Cambria Heights to Jamaica' },
        { value: 'Q85_NB', label: 'Q85 - Jamaica to Cambria Heights' },
        { value: 'Q85_SB', label: 'Q85 - Cambria Heights to Jamaica' },
        { value: 'Q88_NB', label: 'Q88 - Jamaica to Cambria Heights' },
        { value: 'Q88_SB', label: 'Q88 - Cambria Heights to Jamaica' },
        { value: 'Q100_NB', label: 'Q100 - Jamaica to Rikers Island' },
        { value: 'Q100_SB', label: 'Q100 - Rikers Island to Jamaica' },
        { value: 'Q101_NB', label: 'Q101 - Jamaica to Astoria' },
        { value: 'Q101_SB', label: 'Q101 - Astoria to Jamaica' },
        { value: 'Q102_NB', label: 'Q102 - Jamaica to Astoria' },
        { value: 'Q102_SB', label: 'Q102 - Astoria to Jamaica' },
        { value: 'Q103_NB', label: 'Q103 - Jamaica to Astoria' },
        { value: 'Q103_SB', label: 'Q103 - Astoria to Jamaica' },
        { value: 'Q104_NB', label: 'Q104 - Jamaica to Astoria' },
        { value: 'Q104_SB', label: 'Q104 - Astoria to Jamaica' }
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

// Create a flattened list for backward compatibility
const BUS_LINES = Object.values(BOROUGH_BUS_LINES).flat();

const LINE_COLORS = ['#d500f9', '#00bcd4', '#ffeb3b', '#ff5722', '#4caf50', '#2196f3', '#e91e63', '#8bc34a', '#ff9800', '#9c27b0'];

export default function App() {
    const [selectedBorough, setSelectedBorough] = useState('Brooklyn');
    const [selectedLine, setSelectedLine] = useState('B47_NB');
    const [busData, setBusData] = useState([]);
    
    // Get available bus lines for selected borough
    const availableBusLines = BOROUGH_BUS_LINES[selectedBorough] || [];
    // Initialize favorite stops from localStorage or with defaults
    const [favStops, setFavStops] = useState(() => {
        // Try to load from localStorage first
        const savedStops = localStorage.getItem('favStops');
        if (savedStops) {
            try {
                return JSON.parse(savedStops);
            } catch (e) {
                console.error('Error parsing saved stops:', e);
            }
        }
        
        // Default to some B47 stops if nothing in localStorage
        return {
            'B47': ['308312', '303178'] // Marcus Garvey Blvd/Broadway and Broadway/Park Av
        };
    });
    
    // Save favorite stops to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('favStops', JSON.stringify(favStops));
    }, [favStops]);
    const [lastUpdateTime, setLastUpdateTime] = useState({ time: null, loading: false, error: false });

    // Fetch bus data for all lines with favorite stops
    useEffect(() => {
        let isMounted = true;
        let intervalId = null;
        
        async function fetchData() {
            try {
                // Get unique line IDs from favorite stops
                const favoriteLines = Object.keys(favStops);
                const uniqueLineIds = [...new Set(favoriteLines.map(line => line.split('_')[0]))];
                
                console.log('Fetching buses for favorite lines:', uniqueLineIds);
                
                // Show loading state
                setLastUpdateTime(prev => ({ ...prev, loading: true }));
                
                // Fetch buses for all favorite lines
                const allBusesPromises = uniqueLineIds.map(lineId => fetchBusesForLine(lineId));
                const allBusesResults = await Promise.all(allBusesPromises);
                
                // Combine all buses into a single array and add direction info
                const allBuses = allBusesResults.flatMap((buses, index) => {
                    const lineId = uniqueLineIds[index];
                    return buses.map(bus => ({
                        ...bus,
                        directionLine: lineId // Add the full direction line (e.g., 'B47_NB')
                    }));
                });
                
                // Only update state if component is still mounted
                if (isMounted) {
                    console.log(`Fetched ${allBuses.length} total buses for ${uniqueLineIds.length} favorite lines`);
                    setBusData(allBuses);
                    setLastUpdateTime({ time: new Date(), loading: false });
                }
            } catch (error) {
                console.error('Error fetching bus data:', error);
                if (isMounted) {
                    setLastUpdateTime({ time: new Date(), loading: false, error: true });
                }
            }
        }
        
        // Only fetch if there are favorite stops
        if (Object.keys(favStops).length > 0) {
            // Initial fetch
            fetchData();
            
            // Set up interval for subsequent fetches
            intervalId = setInterval(fetchData, 15000);
        } else {
            // Clear bus data if no favorite stops
            setBusData([]);
        }
        
        // Cleanup function
        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [favStops]);

    // Compute linesWithColors for polylines
    const linesWithColors = {};
    let colorIdx = 0;
    Object.keys(favStops).forEach(line => {
        linesWithColors[line] = LINE_COLORS[colorIdx % LINE_COLORS.length];
        colorIdx++;
    });

    // Compute routeCoordinates for selected line
    const routeCoordinates = (GTFS_STOPS[selectedLine] || []).map(stop => [stop.latitude, stop.longitude]);
    
    // Debug information
    console.log('Selected Line:', selectedLine);
    console.log('GTFS_STOPS has this line:', !!GTFS_STOPS[selectedLine]);
    console.log('Route Coordinates Length:', routeCoordinates.length);
    console.log('Bus Data Length:', busData.length);
    
    // Compute closest buses to each stop (simplified for demo)
    const closestBuses = Object.entries(favStops).flatMap(([line, stopIds]) =>
        stopIds.map(stopId => {
            // Find the correct route key that matches the base line name
            // For example, if line is 'B47', look for 'B47_NB' or 'B47_SB' in GTFS_STOPS
            const possibleRoutes = Object.keys(GTFS_STOPS).filter(route => route.startsWith(line + '_'));
            let stopObj = null;
            let matchedRoute = null;
            
            // Try to find the stop in any of the matching routes
            for (const route of possibleRoutes) {
                const foundStop = (GTFS_STOPS[route] || []).find(s => s.id === stopId);
                if (foundStop) {
                    stopObj = foundStop;
                    matchedRoute = route;
                    break;
                }
            }
            
            if (!stopObj) {
                console.warn(`Stop ${stopId} not found for line ${line} in any route (${possibleRoutes.join(', ')})`);
                return null;
            }
            
            // Filter buses for this line only (match base line number)
            const baseLineNumber = line.split('_')[0]; // Extract 'B47' from 'B47_NB'
            const lineBuses = busData.filter(bus => bus.label === baseLineNumber).map(bus => ({
                ...bus,
                directionLine: line // Add the full direction line (e.g., 'B47_NB')
            }));
            console.log(`Found ${lineBuses.length} buses for line ${line} (base: ${baseLineNumber})`);
            
            if (lineBuses.length === 0) {
                console.warn(`No buses found for line ${line}`);
                return null;
            }
            
            let closestBus = null;
            let minDistance = Infinity;
            
            lineBuses.forEach(bus => {
                const busLat = bus.lat || bus.latitude;
                const busLon = bus.lon || bus.longitude;
                
                if (typeof busLat === 'number' && typeof busLon === 'number') {
                    // Calculate distance using Haversine formula for more accuracy
                    const R = 6371; // Earth radius in km
                    const dLat = (busLat - stopObj.latitude) * Math.PI / 180;
                    const dLon = (busLon - stopObj.longitude) * Math.PI / 180;
                    const a = 
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(stopObj.latitude * Math.PI / 180) * Math.cos(busLat * Math.PI / 180) * 
                        Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const dist = R * c; // Distance in km
                    
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestBus = bus;
                    }
                } else {
                    console.warn(`Bus ${bus.id} has invalid coordinates:`, busLat, busLon);
                }
            });
            
            // Mark the closest bus with isClosestToStop property
            if (closestBus) {
                closestBus.isClosestToStop = true;
            }
            
            return closestBus && stopObj ? {
                line,
                stop: stopObj,
                bus: closestBus,
                distance: minDistance
            } : null;
        })
    ).filter(Boolean);
    
    // Sort closest buses by distance
    closestBuses.sort((a, b) => a.distance - b.distance);
    
    // Log closest buses for debugging
    console.log('Closest buses:', closestBuses.length > 0 ? 
        closestBuses.map(b => `${b.line} at ${b.stop.name}: Bus ${b.bus.id} (${b.distance.toFixed(2)} km)`) : 
        'None found');
    
    // Fallback to default route if no coordinates found
    const defaultCenter = [40.650002, -73.949997]; // Brooklyn center
    const mapCenter = routeCoordinates.length > 0 ? routeCoordinates[0] : defaultCenter;

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#333' }}>MTA Bus Tracker</h1>
                
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Borough:</label>
                    <select 
                        value={selectedBorough}
                        onChange={(e) => {
                            setSelectedBorough(e.target.value);
                            // Reset to first line of new borough
                            const newBoroughLines = BOROUGH_BUS_LINES[e.target.value];
                            if (newBoroughLines && newBoroughLines.length > 0) {
                                setSelectedLine(newBoroughLines[0].value);
                            }
                        }}
                        style={{ 
                            width: '300px', 
                            padding: '6px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '12px',
                            marginBottom: '10px'
                        }}
                    >
                        <option value="Brooklyn">Brooklyn</option>
                        <option value="Manhattan">Manhattan</option>
                        <option value="Queens">Queens</option>
                        <option value="Bronx">Bronx</option>
                    </select>

                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Bus Line:</label>
                    <select 
                        value={selectedLine}
                        onChange={(e) => setSelectedLine(e.target.value)}
                        style={{ 
                            width: '300px', 
                            padding: '6px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}
                    >
                        {availableBusLines.map(line => (
                            <option key={line.value} value={line.value}>
                                {line.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px' }}>
                    <span>Last Update: {lastUpdateTime.time ? lastUpdateTime.time.toLocaleTimeString() : 'Never'}</span>
                    {lastUpdateTime.loading && <span style={{ color: '#666' }}>Loading...</span>}
                    {lastUpdateTime.error && <span style={{ color: '#d32f2f' }}>Error</span>}
                    <span style={{ color: '#4caf50' }}>Buses: {busData.length}</span>
                </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex' }}>
                {/* Left Panel */}
                <div style={{ 
                    width: '400px', 
                    backgroundColor: '#ffffff', 
                    borderRight: '1px solid #e0e0e0',
                    overflowY: 'auto',
                    padding: '16px',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ background: '#f0f4f8', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #e0e0e0', paddingBottom: 8 }}>
                            <span style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 18 }}>Closest Buses to Your Stops</span>
                            <span style={{ color: '#666', fontSize: 12, fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                                <span>Last updated: {lastUpdateTime.time ? lastUpdateTime.time.toLocaleTimeString() : 'Never'}</span>
                                {lastUpdateTime.loading && (
                                    <span style={{ marginLeft: 5, color: '#0066cc', display: 'flex', alignItems: 'center' }}>
                                        <span style={{ marginRight: 4 }}>Refreshing</span>
                                        <div style={{ 
                                            width: 12, 
                                            height: 12, 
                                            borderRadius: '50%', 
                                            border: '2px solid #f3f3f3', 
                                            borderTop: '2px solid #0066cc', 
                                            animation: 'spin 1s linear infinite' 
                                        }}></div>
                                    </span>
                                )}
                                {lastUpdateTime.error && <span style={{ marginLeft: 5, color: '#cc0000' }}> (Error)</span>}
                            </span>
                        </div>
                        
                        {/* Add favorite stops section */}
                        <div style={{ 
                            marginBottom: 16, 
                            padding: 12, 
                            background: '#e3f2fd', 
                            borderRadius: 8, 
                            border: '1px solid #bbdefb',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ fontWeight: 'bold', color: '#0d47a1', marginBottom: 8 }}>
                                Add Favorite Stops
                            </div>
                            <div style={{ fontSize: 14, color: '#555', marginBottom: 10 }}>
                                Select stops to track nearby buses:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {/* Stop selector for current line */}
                                {(GTFS_STOPS[selectedLine] || []).length > 0 ? (
                                    <div>
                                        <select 
                                            style={{ 
                                                width: '100%', 
                                                padding: 8, 
                                                borderRadius: 4, 
                                                border: '1px solid #bbdefb',
                                                marginBottom: 8
                                            }}
                                            onChange={(e) => {
                                                const stopId = e.target.value;
                                                if (stopId && stopId !== 'default') {
                                                    // Add to favorites
                                                    const line = selectedLine.split('_')[0];
                                                    const newFavStops = {...favStops};
                                                    if (!newFavStops[line]) {
                                                        newFavStops[line] = [];
                                                    }
                                                    if (!newFavStops[line].includes(stopId)) {
                                                        newFavStops[line] = [...newFavStops[line], stopId];
                                                        setFavStops(newFavStops);
                                                        // Reset the select
                                                        e.target.value = 'default';
                                                    }
                                                }
                                            }}
                                            defaultValue="default"
                                        >
                                            <option value="default">Select a stop for {selectedLine.split('_')[0]}...</option>
                                            {(GTFS_STOPS[selectedLine] || []).map(stop => (
                                                <option key={stop.id} value={stop.id}>
                                                    {stop.name} ({stop.id})
                                                </option>
                                            ))}
                                        </select>
                                        <button 
                                            onClick={() => {
                                                const lineId = selectedLine.split('_')[0];
                                                // Add all stops for this line
                                                const allStopIds = (GTFS_STOPS[selectedLine] || []).map(stop => stop.id);
                                                const newFavStops = {...favStops};
                                                newFavStops[lineId] = allStopIds;
                                                setFavStops(newFavStops);
                                            }}
                                            style={{ 
                                                padding: '4px 8px', 
                                                background: '#1976d2', 
                                                color: 'white',
                                                border: 'none', 
                                                borderRadius: 4, 
                                                cursor: 'pointer',
                                                fontSize: 12
                                            }}
                                        >
                                            Add All Stops
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ 
                                        color: '#666', 
                                        fontStyle: 'italic',
                                        padding: 8,
                                        fontSize: 13
                                    }}>
                                        Select a stop to add all stops for this line
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Current favorite stops */}
                        {Object.keys(favStops).length > 0 && (
                            <div style={{ 
                                marginBottom: 16, 
                                padding: 12, 
                                background: '#fff', 
                                borderRadius: 8, 
                                border: '1px solid #e0e0e0',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    marginBottom: 8 
                                }}>
                                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                                        Your Favorite Stops
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setFavStops({});
                                        }}
                                        style={{ 
                                            padding: '4px 8px', 
                                            background: '#f44336', 
                                            color: 'white',
                                            border: 'none', 
                                            borderRadius: 4, 
                                            cursor: 'pointer',
                                            fontSize: 11
                                        }}
                                    >
                                        Clear All
                                    </button>
                                </div>
                                {Object.entries(favStops).map(([line, stopIds]) => (
                                    <div key={line} style={{ marginBottom: 8 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            marginBottom: 4,
                                            borderBottom: '1px solid #f0f0f0',
                                            paddingBottom: 4
                                        }}>
                                            <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                Line {line} ({stopIds.length} stops)
                                            </span>
                                            <button 
                                                onClick={() => {
                                                    const newFavStops = {...favStops};
                                                    delete newFavStops[line];
                                                    setFavStops(newFavStops);
                                                }}
                                                style={{ 
                                                    padding: '2px 6px', 
                                                    background: '#f44336', 
                                                    color: 'white',
                                                    border: 'none', 
                                                    borderRadius: 4, 
                                                    cursor: 'pointer',
                                                    fontSize: 10
                                                }}
                                            >
                                                Remove All
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {stopIds.map(stopId => {
                                                const stop = (GTFS_STOPS[`${line}_0`] || []).find(s => s.id === stopId) || 
                                                           (GTFS_STOPS[`${line}_1`] || []).find(s => s.id === stopId);
                                                return (
                                                    <div key={stopId} style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        background: '#e3f2fd', 
                                                        padding: '2px 6px', 
                                                        borderRadius: 4,
                                                        fontSize: 12
                                                    }}>
                                                        <span style={{ marginRight: 4 }}>
                                                            {stop ? stop.name : stopId}
                                                        </span>
                                                        <button 
                                                            onClick={() => {
                                                                const newFavStops = {...favStops};
                                                                newFavStops[line] = newFavStops[line].filter(id => id !== stopId);
                                                                if (newFavStops[line].length === 0) {
                                                                    delete newFavStops[line];
                                                                }
                                                                setFavStops(newFavStops);
                                                            }}
                                                            style={{ 
                                                                background: 'none', 
                                                                border: 'none', 
                                                                cursor: 'pointer',
                                                                color: '#f44336',
                                                                fontSize: 12,
                                                                padding: 0,
                                                                marginLeft: 2
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                            @keyframes pulse {
                                0% {
                                    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
                                }
                                70% {
                                    box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
                                }
                                100% {
                                    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
                                }
                            }
                        `}</style>
                         {closestBuses.length > 0 && closestBuses.map(({ line, stop, bus, distance }, idx) => {
                             // Determine distance color based on proximity
                             const distanceColor = distance < 0.01 ? '#4caf50' : // Very close (< 1km)
                                                 distance < 0.03 ? '#ff9800' : // Moderate distance (< 3km)
                                                 '#f44336'; // Far away
                             
                             // Format distance for display
                             const formattedDistance = distance < 0.01 ? 
                                 `${(distance * 1000).toFixed(0)}m` : // Show in meters if < 1km
                                 `${distance.toFixed(2)}km`; // Show in km otherwise
                             
                             return (
                                 <div key={line + '-' + stop.id} style={{ 
                                     marginBottom: 12, 
                                     padding: 12, 
                                     background: '#fff', 
                                     borderRadius: 8, 
                                     border: '1px solid #e0e0e0',
                                     boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                     transition: 'all 0.2s ease-in-out',
                                     cursor: 'pointer',
                                     position: 'relative',
                                     borderLeft: `4px solid ${linesWithColors[line]}`,
                                     ':hover': {
                                         transform: 'translateY(-2px)',
                                         boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                     }
                                 }}>
                                     {/* Pulsing indicator for active tracking */}
                                     <div style={{ 
                                         position: 'absolute', 
                                         top: 8, 
                                         right: 8, 
                                         width: 8, 
                                         height: 8, 
                                         borderRadius: '50%', 
                                         backgroundColor: '#4caf50',
                                         boxShadow: '0 0 0 rgba(76, 175, 80, 0.4)',
                                         animation: 'pulse 2s infinite'
                                     }}></div>
                                     
                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
                                         <span style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 16, display: 'flex', alignItems: 'center' }}>
                                             <span style={{ color: linesWithColors[line], fontWeight: 'bold', fontSize: 18, marginRight: 6 }}>●</span>
                                             {line} → {stop.name}
                                         </span>
                                     </div>
                                     <div style={{ paddingLeft: 8 }}>
                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                             <span style={{ color: '#333', fontWeight: 'bold', fontSize: 14 }}>Bus {bus.id || bus.vehicleRef || 'Unknown'}</span>
                                             <span style={{ 
                                                 color: '#fff', 
                                                 fontWeight: 'bold', 
                                                 fontSize: 12,
                                                 backgroundColor: distanceColor,
                                                 padding: '2px 8px',
                                                 borderRadius: 12,
                                                 display: 'flex',
                                                 alignItems: 'center',
                                                 gap: 4
                                             }}>
                                                 <span style={{ fontSize: 10 }}>📍</span>
                                                 {formattedDistance}
                                             </span>
                                         </div>
                                         <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                                             {bus.nextStop && (
                                                 <div style={{ 
                                                     fontSize: '13px', 
                                                     backgroundColor: '#e3f2fd', 
                                                     padding: '5px 8px', 
                                                     borderRadius: '4px', 
                                                     marginBottom: '8px',
                                                     borderLeft: '3px solid #1976d2',
                                                     fontWeight: 'bold',
                                                     color: '#0d47a1'
                                                 }}>
                                                     <span>Current Stop:</span> {bus.nextStop}
                                                 </div>
                                             )}
                                             <div style={{ marginBottom: 2 }}><strong>Location:</strong> {bus.lat || bus.latitude}, {bus.lon || bus.longitude}</div>
                                             {bus.recordedAtTime && (
                                                 <div style={{ marginTop: 2 }}><strong>Updated:</strong> {new Date(bus.recordedAtTime).toLocaleTimeString()}</div>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
                
                {/* Map */}
                <div style={{ flex: 1 }}>
                    <MapComponent 
                         buses={busData}
                         center={mapCenter}
                         routeCoordinates={routeCoordinates}
                         favStops={favStops}
                         linesWithColors={linesWithColors}
                         closestBuses={closestBuses}
                     />
                </div>
            </div>
        </div>
    );
}