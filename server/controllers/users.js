import admin from "../services/auth.js"
import decodeToken from "../services/token.js"
import { createError, extractError } from "../services/error.js";
import log from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   user checks whether its basket is valid
//  @route  GET  /api/users/:userID/basket-check
export const checkBasket = async (req, res) => {
    const token = req.headers.authorization;
    const userID = req.params.userID;
    

    //set the basket product
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => isUser;
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);
        
        //get the user
        const userReference = database.collection("users").doc(userID);
        const userDocument = await userReference.get();
        if (!userDocument.exists)
            throw createError(`A user with the id of ${userID} was not found`, 404);

        //get the basket
        const basketReference = userReference.collection("basket");
        const basketSnapshot = await basketReference.get();
        const basketDocuments = basketSnapshot.docs;

        //check for an unavailable item
        let errorMessage = "";
        for (let productDocument of basketDocuments) {
            //get the product
            const reference = database.collection("products").doc(productDocument.id);
            const document = await reference.get();
            if (!document.exists || document.data().price === 0)
                errorMessage += `\t• Product #${productDocument.id} is not available.\n`;
            else if (document.data().stock < productDocument.data().count)
                errorMessage += `\t• Product #${productDocument.id} does not have enough stock available.\n`;
        }

        //send a response
        if (errorMessage)
            res.status(200).json({message: "Invalid", alert: "Basket contains unavailable items:\n" + errorMessage});
        else
            res.status(200).json({message: "Valid"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}


//  @desc   admin/user sets product to a specific user's/its basket
//  @route  PUT  /api/users/:userID/basket/:productID
export const setProduct = async (req, res) => {
    const token = req.headers.authorization;
    const { count } = req.body;
    const userID = req.params.userID;
    const productID = req.params.productID;
    

    //set the basket product
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => isUser;
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //input check
        if (count === undefined)
            throw createError("All fields are required", 400);
        else if (!Number.isInteger(count) || count <= 0)
            throw createError("Please enter a valid count", 400);
        
        //get the user
        const userReference = database.collection("users").doc(userID);
        const userDocument = await userReference.get();
        if (!userDocument.exists)
            throw createError(`A user with the id of ${userID} was not found`, 404);

        //get the product
        const productReference = database.collection("products").doc(productID);
        const productDocument = await productReference.get();
        if (!productDocument.exists)
            throw createError(`A product with the id of ${productID} was not found`, 404);

        //check whether count is above stock number
        if (count > productDocument.data().stock)
            throw createError("Please enter a valid count", 400);

        //set the basket product data
        const productData = {
            count: count
        };

        //set the basket product
        let method = "ADD";
        const reference = database.collection("users").doc(userID).collection("basket").doc(productID);
        const document = await reference.get();
        if (document.exists)
            method = "SET";
        await database.collection("users").doc(userID).collection("basket").doc(productID).set(productData);
        await log(database, method, `users/${userDocument.id}/basket/${productID}`, productData, decodedToken.uid);

        //send a response
        res.status(200).json({message: `Successfully ${method == "ADD" ? "added" : "set"}`});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}


//  @desc   admin/user sets a specific user/itself
//  @route  PUT  /api/users/:userID
export const setUser = async (req, res) => {
    const token = req.headers.authorization;
    const { firstname, lastname, role, country, city, address, active } = req.body;
    let { wishlist } = req.body;
    const userID = req.params.userID;

    
    //set the user
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => tokenRole === "admin" || isUser;
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //input check
        if (isUser && (firstname === undefined || lastname === undefined || country === undefined || city === undefined || address === undefined))
            throw createError("All fields are required", 400);
        else if (isUser && (typeof firstname !== "string" || !firstname.trim()))
            throw createError("Please enter a valid firstname", 400);
        else if (isUser && (typeof lastname !== "string" || !lastname.trim()))
            throw createError("Please enter a valid lastname", 400);
        else if (tokenRole === "admin" && role !== undefined && typeof role !== "string" && !["customer", "productmanager", "salesmanager", "admin"].includes(role))
            throw createError("Please enter a valid role", 400);
        else if (isUser && (typeof country !== "string" || !country.trim()))
            throw createError("Please enter a valid country", 400);
        else if (isUser && (typeof city !== "string" || !city.trim()))
            throw createError("Please enter a valid city", 400);
        else if (isUser && (typeof address !== "string" || !address.trim()))
            throw createError("Please enter a valid address", 400);
        else if (isUser && (!Array.isArray(wishlist)))
            throw createError("Please enter a valid wishlist", 400);
        else if (tokenRole === "admin" && typeof active !== "boolean")
            throw createError("Please enter a valid active", 400); 
        if (isUser) {
            wishlist = [...new Set(wishlist)];
            for (let productID of wishlist) {
                const productReference = database.collection("products").doc(productID);
                const product = await productReference.get();
                if (!product.exists)
                    throw createError("Please enter a valid wishlist", 400);
            }
        }

        //get the user data
        const userReference = database.collection("users").doc(userID);
        const userDocument = await userReference.get();
        if (!userDocument.exists)
            throw createError(`A user with the id of ${userID} was not found`, 404);
        let userData = userDocument.data();

        //set the user data
        if (tokenRole === "admin") {
            userData.role = role;
            userData.active = active;
        }
        if (isUser) {
            userData.firstname = firstname;
            userData.lastname = lastname;
            userData.address.country = country;
            userData.address.city = city;
            userData.address.address = address;
            userData.wishlist = wishlist;
        }

        //set the user
        await database.collection("users").doc(userID).set(userData);
        await log(database, "SET", `users/${userDocument.uid}`, userData, decodedToken.uid);

        //send notification to user
        const oldUserData = userDocument.data();
        const roleNameMap = {customer: "customer", productmanager: "product manager", salesmanager: "sales manager", admin: "admin"};
        if (tokenRole === "admin" && oldUserData.role !== role) {
            const notificationData = {
                message: `Your role has been changed to ${roleNameMap[role]}.`,
                seen: false,
                date: Date()
            };
            const notificationDocument = await database.collection("users").doc(userID).collection("notifications").add(notificationData);
            await log(database, "ADD", `users/${userID}/notifications/${notificationDocument.id}`, notificationData, decodedToken.uid);
        }
        if (tokenRole === "admin" && oldUserData.active !== active) {
            const notificationData = {
                message: `Your account has been ${active ? "suspended" : "activated"}.`,
                seen: false,
                date: Date()
            };
            const notificationDocument = await database.collection("users").doc(userID).collection("notifications").add(notificationData);
            await log(database, "ADD", `users/${userID}/notifications/${notificationDocument.id}`, notificationData, decodedToken.uid);
        }

        //send a response
        res.status(200).json({message: "Successfully set"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}


//  @desc   user sets its specific notification
//  @route  PUT  /api/users/:userID/notifications/:notificationID
export const setNotification = async (req, res) => {
    const token = req.headers.authorization;
    const { seen } = req.body;
    const userID = req.params.userID;
    const notificationID = req.params.notificationID;
    

    //add the product
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => isUser;
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //input check
        if (seen === undefined)
            throw createError("All fields are required", 400);
        else if (typeof seen !== "boolean")
            throw createError("Please enter a valid seen", 400);
        
        //get the user
        const userReference = database.collection("users").doc(userID);
        const userDocument = await userReference.get();
        if (!userDocument.exists)
            throw createError(`A user with the id of ${userID} was not found`, 404);

        //get the notification
        const notificationReference = userReference.collection("notifications").doc(notificationID);
        const notificationDocument = await notificationReference.get();
        if (!notificationDocument.exists)
            throw createError(`A notification with the id of ${notificationID} was not found`, 404);

        //set the notification data
        const notificationData = notificationDocument.data();
        notificationData["seen"] = seen;

        //set the notification
        await notificationReference.set(notificationData);
        await log(database, "SET", `users/${userDocument.id}/notifications/${notificationDocument.id}`, notificationData, decodedToken.uid);
        
        //send a response
        res.status(201).json({message: "Successfully set"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}


//  @desc   admin/user deletes product from a specific user's/its basket
//  @route  DELETE  /api/users/:userID/basket/:productID
export const deleteProduct = async (req, res) => {
    const token = req.headers.authorization;
    const userID = req.params.userID;
    const productID = req.params.productID;
    

    //delete the product
    try {
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => isUser;
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //get the user
        const userReference = database.collection("users").doc(userID);
        const userDocument = await userReference.get();
        if (!userDocument.exists)
            throw createError(`A user with the id of ${userID} was not found`, 404);

        //get the product
        const productReference = userReference.collection("basket").doc(productID);
        const productDocument = await productReference.get();
        if (!productDocument.exists)
            throw createError(`A product with the id of ${productID} was not found`, 404);

        //delete the product
        await database.collection("users").doc(userID).collection("basket").doc(productID).delete();
        await log(database, "DELETE", `users/${userDocument.uid}/basket/${productID}`, null, decodedToken.uid);
        
        //send a response
        res.status(200).json({message: "Successfully deleted"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}