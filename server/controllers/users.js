import admin from "../services/auth.js"
import log from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   admin/user sets product to a specific user's/its basket
//  @route  PUT  /api/users/:userID/basket/:productID
export const setProduct = async (req, res, next) => {
    const token = req.headers.authorization;
    const { count } = req.body;
    const userID = req.params.userID;
    const productID = req.params.productID;
    

    //add the product
    try {
        //token check
        let decodedToken;
        let tokenRole;
        let isUser;
        if (!token) {
            const error = new Error("No token provided");
            error.status = 401;
            return next(error);
        } else {
            decodedToken = await admin.auth().verifyIdToken(token);
            const userReference = database.collection("users").doc(decodedToken.uid);
            const user = await userReference.get();
            tokenRole = user.data().role;
            isUser = user.id === decodedToken.uid;
            if (!user.exists || !isUser) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //input check
        if (count === undefined) {
            const error = new Error("All fields are required");
            error.status = 400;
            return next(error);
        } else if (!Number.isInteger(count) || count <= 0) {
            const error = new Error("Please enter a valid count");
            error.status = 400;
            return next(error);
        }
        //get the user
        const userReference = database.collection("users").doc(userID);
        const userDocument = await userReference.get();
        if (!userDocument.exists) {
            const error = new Error(`A user with the id of ${userID} was not found`);
            error.status = 404;
            return next(error);
        }
        //get the product
        const productReference = database.collection("products").doc(productID);
        const productDocument = await productReference.get();
        if (!productDocument.exists) {
            const error = new Error(`A product with the id of ${productID} was not found`);
            error.status = 404;
            return next(error);
        }
        //check whether count is above stock number
        if (count > productDocument.data().stock) {
            const error = new Error("Please enter a valid count");
            error.status = 400;
            return next(error);
        }

        const productData = {
            count: count
        };

        let method = "ADD";
        const reference = database.collection("users").doc(userID).collection("basket").doc(productID);
        const document = await reference.get();
        if (document.exists) {
            method = "SET";
        }
        //set the product
        await database.collection("users").doc(userID).collection("basket").doc(productID).set(productData);
        await log(database, method, `users/${userDocument.id}/basket/${productID}`, productData, decodedToken.uid);
        res.status(200).json({message: `Successfully ${method == "ADD" ? "added" : "set"}`});
    } catch (error) {
        console.error(error);
        //extract error message and return response
        let message = "Internal server error";
        let status = 500;
        switch (error.code) {
            case "auth/id-token-expired":
                message = "Invalid or expired token";
                status = 401;
                break;
        }
        res.status(status).json({
          message: message
        });
    }
}


//  @desc   admin/user sets a specific user/itself
//  @route  PUT  /api/users/:userID
export const setUser = async (req, res, next) => {
    const token = req.headers.authorization;
    const { firstname, lastname, role, country, city, address, active } = req.body;
    let { wishlist } = req.body;
    const userID = req.params.userID;

    
    //set the user
    try {
        //token check
        let decodedToken;
        let tokenRole;
        let isUser;
        if (!token) {
            const error = new Error("No token provided");
            error.status = 401;
            return next(error);
        } else {
            decodedToken = await admin.auth().verifyIdToken(token);
            const userReference = database.collection("users").doc(decodedToken.uid);
            const user = await userReference.get();
            tokenRole = user.data().role;
            isUser = user.id === decodedToken.uid;
            if (!user.exists || (tokenRole !== "admin" && !isUser)) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //input check
        if (isUser && (firstname === undefined || lastname === undefined || country === undefined || city === undefined || address === undefined)) {
            const error = new Error("All fields are required");
            error.status = 400;
            return next(error);
        } else if (isUser && (typeof firstname !== "string" || !firstname.trim())) {
            const error = new Error("Please enter a valid firstname");
            error.status = 400;
            return next(error);
        } else if (isUser && (typeof lastname !== "string" || !lastname.trim())) {
            const error = new Error("Please enter a valid lastname");
            error.status = 400;
            return next(error);
        } else if (tokenRole === "admin" && role !== undefined && typeof role !== "string" && !["customer", "productmanager", "salesmanager", "admin"].includes(role)) {
            const error = new Error("Please enter a valid role");
            error.status = 400;
            return next(error);
        } else if (isUser && (typeof country !== "string" || !country.trim())) {
            const error = new Error("Please enter a valid country");
            error.status = 400;
            return next(error);
        } else if (isUser && (typeof city !== "string" || !city.trim())) {
            const error = new Error("Please enter a valid city");
            error.status = 400;
            return next(error);
        } else if (isUser && (typeof address !== "string" || !address.trim())) {
            const error = new Error("Please enter a valid address");
            error.status = 400;
            return next(error);
        } else if (isUser && (!Array.isArray(wishlist))) {
            const error = new Error("Please enter a valid wishlist");
            error.status = 400;
            return next(error);
        } else if (tokenRole === "admin" && typeof active !== "boolean") {
            const error = new Error("Please enter a valid active");
            error.status = 400;
            return next(error); 
        }
        if (isUser) {
            wishlist = [...new Set(wishlist)];
            for (let productID of wishlist) {
                const productReference = database.collection("products").doc(productID);
                const product = await productReference.get();
                if (!product.exists) {
                    const error = new Error("Please enter a valid wishlist");
                    error.status = 400;
                    return next(error);
                }
            }
        }
        //get the user
        const userReference = database.collection("users").doc(userID);
        const userDocument = await userReference.get();
        if (!userDocument.exists) {
            const error = new Error(`A user with the id of ${userID} was not found`);
            error.status = 404;
            return next(error);
        }

        const userData = {
            firstname: tokenRole === "admin" ? userDocument.data().firstname : firstname,
            lastname: tokenRole === "admin" ? userDocument.data().lastname : lastname,
            email: userDocument.data().email,
            role: tokenRole === "admin" ? role : userDocument.data().role,
            address: {
                country: tokenRole === "admin" ? userDocument.data().address.country : country,
                city: tokenRole === "admin" ? userDocument.data().address.city : city,
                address: tokenRole === "admin" ? userDocument.data().address.address : address
            },
            active: tokenRole === "admin" ? active : userDocument.data().active,
            wishlist: tokenRole === "admin" ? userDocument.data().wishlist : wishlist
        };

        //set the user
        await database.collection("users").doc(userID).set(userData);
        await log(database, "SET", `users/${userDocument.uid}`, userData, decodedToken.uid);
        if (tokenRole === "admin" && userDocument.data().active !== active) {
            const notificationData = {
                message: `Your account has been ${active ? "suspended" : "activated"}.`,
                seen: false,
                date: Date()
            };
            const notificationDocument = await database.collection("users").doc(userID).collection("notifications").add(notificationData);
            await log(database, "ADD", `users/${userID}/notifications/${notificationDocument.id}`, notificationData, decodedToken.uid);
        }
        res.status(200).json({message: "Successfully set"});
    } catch (error) {
        console.error(error);
        //extract error message and return response
        let message = "Internal server error";
        let status = 500;
        switch (error.code) {
            case "auth/id-token-expired":
                message = "Invalid or expired token";
                status = 401;
                break;
        }
        res.status(status).json({
          message: message
        });
    }
}


//  @desc   user sets its specific notification
//  @route  PUT  /api/users/:userID/notifications/:notificationID
export const setNotification = async (req, res, next) => {
    const token = req.headers.authorization;
    const { seen } = req.body;
    const userID = req.params.userID;
    const notificationID = req.params.notificationID;
    

    //add the product
    try {
        //token check
        let decodedToken;
        let tokenRole;
        let isUser;
        if (!token) {
            const error = new Error("No token provided");
            error.status = 401;
            return next(error);
        } else {
            decodedToken = await admin.auth().verifyIdToken(token);
            const userReference = database.collection("users").doc(decodedToken.uid);
            const user = await userReference.get();
            tokenRole = user.data().role;
            isUser = user.id === decodedToken.uid;
            if (!user.exists || !isUser) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //input check
        if (seen === undefined) {
            const error = new Error("All fields are required");
            error.status = 400;
            return next(error);
        } else if (typeof seen !== "boolean") {
            const error = new Error("Please enter a valid seen");
            error.status = 400;
            return next(error);
        }
        //get the user
        const userReference = database.collection("users").doc(userID);
        const userDocument = await userReference.get();
        if (!userDocument.exists) {
            const error = new Error(`A user with the id of ${userID} was not found`);
            error.status = 404;
            return next(error);
        }
        const notificationReference = userReference.collection("notifications").doc(notificationID);
        const notificationDocument = await notificationReference.get();
        if (!notificationDocument.exists) {
            const error = new Error(`A notification with the id of ${notificationID} was not found`);
            error.status = 404;
            return next(error);
        }
        const notificationData = notificationDocument.data();
        notificationData["seen"] = seen;
        await notificationReference.set(notificationData);
        await log(database, "SET", `users/${userDocument.id}/notifications/${notificationDocument.id}`, notificationData, decodedToken.uid);
        res.status(201).json({message: "Successfully set"});
    } catch (error) {
        console.error(error);
        //extract error message and return response
        let message = "Internal server error";
        let status = 500;
        switch (error.code) {
            case "auth/id-token-expired":
                message = "Invalid or expired token";
                status = 401;
                break;
        }
        res.status(status).json({
          message: message
        });
    }
}


//  @desc   admin/user deletes product from a specific user's/its basket
//  @route  DELETE  /api/users/:userID/basket/:productID
export const deleteProduct = async (req, res, next) => {
    const token = req.headers.authorization;
    const userID = req.params.userID;
    const productID = req.params.productID;
    

    //add the product
    try {
        //token check
        let decodedToken;
        let tokenRole;
        let isUser;
        if (!token) {
            const error = new Error("No token provided");
            error.status = 401;
            return next(error);
        } else {
            decodedToken = await admin.auth().verifyIdToken(token);
            const userReference = database.collection("users").doc(decodedToken.uid);
            const user = await userReference.get();
            tokenRole = user.data().role;
            isUser = user.id === decodedToken.uid;
            if (!user.exists || !isUser) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //get the user
        const userReference = database.collection("users").doc(userID);
        const userDocument = await userReference.get();
        if (!userDocument.exists) {
            const error = new Error(`A user with the id of ${userID} was not found`);
            error.status = 404;
            return next(error);
        }
        //get the product
        const productReference = userReference.collection("basket").doc(productID);
        const productDocument = await productReference.get();
        if (!productDocument.exists) {
            const error = new Error(`A product with the id of ${productID} was not found`);
            error.status = 404;
            return next(error);
        }
        //delete the product
        await database.collection("users").doc(userID).collection("basket").doc(productID).delete();
        await log(database, "DELETE", `users/${userDocument.uid}/basket/${productID}`, null, decodedToken.uid);
        res.status(200).json({message: "Successfully deleted"});
    } catch (error) {
        console.error(error);
        //extract error message and return response
        let message = "Internal server error";
        let status = 500;
        switch (error.code) {
            case "auth/id-token-expired":
                message = "Invalid or expired token";
                status = 401;
                break;
        }
        res.status(status).json({
          message: message
        });
    }
}