import addLog from "./log.js";


export const addNotification = async (database, userID, tokenID, message) => {
    let reference = database.collection("users").doc(userID).collection("notifications");
    const data = {
        message: message,
        seen: false,
        date: Date()
    };
    reference = await reference.add(data);
    await addLog(database, "ADD", reference.path, null, data, tokenID);
}