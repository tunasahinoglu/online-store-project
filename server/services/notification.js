export const addNotification = async (database, userID, message) => {
    const reference = database.collection("users").doc(userID).collection("notifications");
    const data = {
        message: message,
        seen: false,
        date: Date()
    };
    const document = await reference.add(notificationData);
    return document;
}