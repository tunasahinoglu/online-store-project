import { createError } from "./error.js";


const decodeToken = async (admin, database, token, condition) => {    
    if (!token)
        throw createError("No token provided", 401);

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userReference = database.collection("users").doc(decodedToken.uid);
    const userDocument = await userReference.get();
    const userData = userDocument.data();
    const tokenRole = userData.role;
    const isUser = userDocument.id === decodedToken.uid;

    if (!(userDocument.exists) || !(condition(decodedToken, tokenRole, isUser, userData)))
        throw createError("Unauthorized access", 401);

    return { decodedToken, tokenRole, isUser };
}


export default decodeToken;