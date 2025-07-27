/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Import necessary modules for Firebase Functions v2
const { setGlobalOptions } = require("firebase-functions");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// Set maxInstances for cost control
setGlobalOptions({
    maxInstances: 10,
});

/**
 * Calculates the Haversine distance between two sets of coordinates.
 * @param {number} lat1 - Latitude of point 1.
 * @param {number} lon1 - Longitude of point 1.
 * @param {number} lat2 - Latitude of point 2.
 * @param {number} lon2 - Longitude of point 2.
 * @return {number} The distance in miles.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Cloud Function triggered when a bus's location document is updated.
 * It checks for nearby user subscriptions and sends notifications.
 */
exports.checkBusProximityAndNotify = onDocumentUpdated(
    "busLocations/{busId}",
    async (event) => {
        if (!event.data) {
            logger.info("No data associated with the event.");
            return null;
        }
        const newBusData = event.data.after.data();
        const oldBusData = event.data.before.data();
        if (
            newBusData.latitude === oldBusData.latitude &&
            newBusData.longitude === oldBusData.longitude
        ) {
            logger.info(
                `Bus ${newBusData.busId} location unchanged. Skipping notification check.`,
            );
            return null;
        }
        const busRouteId = newBusData.routeId;
        const busLat = newBusData.latitude;
        const busLon = newBusData.longitude;
        const busId = newBusData.busId;
        logger.info(
            `Checking proximity for Bus ${busId} (Route: ${busRouteId}) at Lat: ` +
            `${busLat}, Lon: ${busLon}`,
        );
        try {
            const subscriptionsSnapshot = await db
                .collection("userSubscriptions")
                .where("routeId", "==", busRouteId)
                .get();
            if (subscriptionsSnapshot.empty) {
                logger.info(`No active subscriptions found for route ${busRouteId}.`);
                return null;
            }
            const messagesToSend = [];
            const updatesToPerform = [];
            for (const doc of subscriptionsSnapshot.docs) {
                const subscription = doc.data();
                const subscriptionId = doc.id;
                const userFCMToken = subscription.fcmToken;
                const stopLat = subscription.stopLatitude;
                const stopLon = subscription.stopLongitude;
                const notifiedOneMile = subscription.notified1Mile;
                const notifiedHalfMile = subscription.notified0_5Mile;
                const stopName = subscription.stopName;
                const distance = calculateDistance(
                    busLat,
                    busLon,
                    stopLat,
                    stopLon,
                );
                logger.info(
                    `Distance for subscription ${subscriptionId} (Stop: ${stopName}): ` +
                    `${distance.toFixed(2)} miles`,
                );
                // Reset flags if bus has moved significantly past the stop or is far away
                if (distance > 1.5 && (notifiedOneMile || notifiedHalfMile)) {
                    updatesToPerform.push(
                        doc.ref.update({
                            notified1Mile: false,
                            notified0_5Mile: false,
                        }),
                    );
                    logger.info(
                        `Resetting notification flags for subscription ${subscriptionId}.`,
                    );
                }
                // 1-mile notification
                if (distance <= 1.0 && distance > 0.5 && !notifiedOneMile) {
                    const title = `Bus ${busRouteId} Alert!`;
                    const body = `Your bus for ${busRouteId} at ${stopName} is approximately 1 mile away.`;
                    messagesToSend.push({
                        token: userFCMToken,
                        notification: { title, body },
                        data: {
                            routeId: busRouteId,
                            stopId: subscription.stopId,
                            distance: distance.toFixed(2),
                            alertType: "1mile",
                        },
                    });
                    updatesToPerform.push(
                        doc.ref.update({
                            notified1Mile: true,
                            lastNotificationSentAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        }),
                    );
                    logger.info(`Prepared 1-mile notification for ${subscriptionId}.`);
                } else if (distance <= 0.5 && !notifiedHalfMile) {
                    // 0.5-mile notification
                    const title = `Bus ${busRouteId} Arriving Soon!`;
                    const body = `Your bus for ${busRouteId} at ${stopName} is approximately 0.5 miles away.`;
                    messagesToSend.push({
                        token: userFCMToken,
                        notification: { title, body },
                        data: {
                            routeId: busRouteId,
                            stopId: subscription.stopId,
                            distance: distance.toFixed(2),
                            alertType: "0_5mile",
                        },
                    });
                    updatesToPerform.push(
                        doc.ref.update({
                            notified0_5Mile: true,
                            lastNotificationSentAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        }),
                    );
                    logger.info(`Prepared 0.5-mile notification for ${subscriptionId}.`);
                }
            }
            // Send all collected messages
            if (messagesToSend.length > 0) {
                const response = await messaging.sendAll(messagesToSend);
                logger.info("Notifications sent successfully:", {
                    successCount: response.successCount,
                    failureCount: response.failureCount,
                });
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        logger.error(
                            `Failed to send message to token ` +
                            `${messagesToSend[idx].token}:`,
                            resp.error,
                        );
                        if (
                            resp.error.code === "messaging/invalid-registration-token" ||
                            resp.error.code === "messaging/registration-token-not-registered"
                        ) {
                            logger.warn(
                                `Removing invalid token: ` +
                                `${messagesToSend[idx].token}`,
                            );
                            // In a real app, you'd likely query and delete the subscription document associated with this token.
                            // For example:
                            // await db.collection('userSubscriptions').where('fcmToken', '==', messagesToSend[idx].token).get()
                            //   .then(snapshot => snapshot.forEach(doc => doc.ref.delete()));
                        }
                    }
                });
            } else {
                logger.info("No notifications to send in this update cycle.");
            }
            // Perform all collected Firestore updates
            if (updatesToPerform.length > 0) {
                await Promise.all(updatesToPerform);
                logger.info("Firestore subscription flags updated.");
            }
            return null;
        } catch (error) {
            logger.error("Error in checkBusProximityAndNotify:", error);
            return null;
        }
    },
);

/**
 * Firestore trigger: Send push notification every mile
 * Assumes user location is stored in 'users/{userId}/locations/{locationId}'
 * and user push token is stored in 'users/{userId}/pushToken'
 */
exports.onLocationUpdate = onDocumentUpdated({
    document: 'users/{userId}/locations/{locationId}'
}, async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (!before || !after) return;
    const prevLat = before.latitude;
    const prevLon = before.longitude;
    const currLat = after.latitude;
    const currLon = after.longitude;
    if (typeof prevLat !== 'number' || typeof prevLon !== 'number' || typeof currLat !== 'number' || typeof currLon !== 'number') return;
    const distance = calculateDistance(prevLat, prevLon, currLat, currLon);
    // Check if user has crossed a mile boundary
    const prevMiles = Math.floor(before.totalMiles || 0);
    const currMiles = Math.floor((after.totalMiles || 0) + distance);
    if (currMiles > prevMiles) {
        // Get push token
        const userId = event.params.userId;
        const userDoc = await db.collection('users').doc(userId).get();
        const pushToken = userDoc.data().pushToken;
        if (pushToken) {
            await messaging.send({
                token: pushToken,
                notification: {
                    title: 'Mile Reached!',
                    body: `You have traveled ${currMiles} miles.`
                }
            });
            logger.info(`Push notification sent to ${userId} for ${currMiles} miles.`);
        }
    }
});

/**
 * Firestore trigger: Send push notification when a bus is within 1 mile of the user's location
 * Assumes user location is stored in 'users/{userId}/locations/{locationId}'
 * and bus locations are stored in 'busLocations/{busId}'
 * and user push token is stored in 'users/{userId}/pushToken'
 */
exports.onUserLocationUpdate = onDocumentUpdated({
    document: 'users/{userId}/locations/{locationId}'
}, async (event) => {
    const after = event.data.after.data();
    if (!after) return;
    const userLat = after.latitude;
    const userLon = after.longitude;
    if (typeof userLat !== 'number' || typeof userLon !== 'number') return;
    // Get all bus locations
    const busSnapshot = await db.collection('busLocations').get();
    let busWithinMile = null;
    busSnapshot.forEach(doc => {
        const bus = doc.data();
        if (typeof bus.latitude === 'number' && typeof bus.longitude === 'number') {
            const dist = calculateDistance(userLat, userLon, bus.latitude, bus.longitude);
            if (dist <= 1) {
                busWithinMile = bus;
            }
        }
    });
    if (busWithinMile) {
        // Get push token
        const userId = event.params.userId;
        const userDoc = await db.collection('users').doc(userId).get();
        const pushToken = userDoc.data().pushToken;
        if (pushToken) {
            await messaging.send({
                token: pushToken,
                notification: {
                    title: 'Bus Nearby!',
                    body: `Bus ${busWithinMile.lineRef || ''}${busWithinMile.destination ? ' to ' + busWithinMile.destination : ''} is within 1 mile of your location.`
                }
            });
            logger.info(`Push notification sent to ${userId} for bus within 1 mile.`);
        }
    }
});

// You can keep your existing helloWorld example function if you like, or remove it.
// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
