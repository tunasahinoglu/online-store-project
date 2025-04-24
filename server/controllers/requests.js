import admin from "../services/auth.js"
import log from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   user adds a request
//  @route  POST  /api/requests
export const addRequest = async (req, res, next) => {
    const token = req.headers.authorization;
    const { order, request } = req.body;
    

    //add the product
    try {
        //token check
        let decodedToken;
        let tokenRole;
        if (!token) {
            const error = new Error("No token provided");
            error.status = 401;
            return next(error);
        } else {
            decodedToken = await admin.auth().verifyIdToken(token);
            const userReference = database.collection("users").doc(decodedToken.uid);
            const user = await userReference.get();
            tokenRole = user.data().role;
            if (!user.exists) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //input check
        if (order === undefined || request === undefined) {
            const error = new Error("All fields are required");
            error.status = 400;
            return next(error);
        } else if (typeof order !== "string" || !order.trim()) {
            const error = new Error("Please enter a valid order");
            error.status = 400;
            return next(error);
        } else if (typeof request !== "string" || !["refund"].includes(request)) {
            const error = new Error("Please enter a valid request");
            error.status = 400;
            return next(error);
        }
        //get the order
        const orderReference = database.collection("orders").doc(order);
        const orderDocument = await orderReference.get();
        if (!(orderDocument.exists && orderDocument.data().status === "delivered" && (new Date() - new Date(orderDocument.data().deliverydate))/(1000*60*60*24) <= 30)) {
            const error = new Error("Please enter a valid order");
            error.status = 400;
            return next(error);
        }
        //get the user
        const userReference = database.collection("users").doc(decodedToken.uid);
        const userDocument = await userReference.get();
        if (!userDocument.exists) {
            const error = new Error(`A user with the id of ${decodedToken.uid} was not found`);
            error.status = 404;
            return next(error);
        }
        //get the request
        const requestReference = database.collection("requests").where("user", "==", decodedToken.uid).where("request", "==", request);
        const requestSnapshot = await requestReference.get();
        if (!requestSnapshot.empty) {
            const error = new Error(`A request was already made`);
            error.status = 400;
            return next(error);
        }   

        const requestData = {
            user: userDocument.id,
            firstname: userDocument.data().firstname,
            lastname: userDocument.data().lastname,
            reviewed: false,
            approved: false,
            order: order,
            request: request,
            date: Date()
        };

        //add the request
        const requestDocument = await database.collection("requests").add(requestData);
        await log(database, "ADD", `requests/${requestDocument.id}`, requestData, decodedToken.uid);
        //send notification
        const notificationData = {
            message: `${request.charAt(0).toUpperCase() + request.slice(1)} request for order #${order} has been added.`,
            seen: false,
            date: Date()
        };
        const notificationDocument = await database.collection("users").doc(decodedToken.uid).collection("notifications").add(notificationData);
        await log(database, "ADD", `users/${decodedToken.uid}/notifications/${notificationDocument.id}`, notificationData, decodedToken.uid);
        res.status(201).json({message: "Successfully added"});
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


//  @desc   admin/sales manaher sets a specific request
//  @route  PUT  /api/requests/:requestID
export const setRequest = async (req, res, next) => {
    const token = req.headers.authorization;
    let { approved } = req.body;
    const requestID = req.params.requestID;
    let alertMessage = "";
    

    //set the request
    try {
        //token check
        let decodedToken;
        let tokenRole;
        if (!token) {
            const error = new Error("No token provided");
            error.status = 401;
            return next(error);
        } else {
            decodedToken = await admin.auth().verifyIdToken(token);
            const userReference = database.collection("users").doc(decodedToken.uid);
            const user = await userReference.get();
            tokenRole = user.data().role;
            if (!user.exists || (tokenRole !== "salesmanager")) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //input check
        if (approved === undefined) {
            const error = new Error("All fields are required");
            error.status = 400;
            return next(error);
        } else if (typeof approved !== "boolean") {
            const error = new Error("Please enter a valid approved");
            error.status = 400;
            return next(error);
        }

        //get the request
        const requestReference = database.collection("requests").doc(requestID);
        const requestDocument = await requestReference.get();
        if (!requestDocument.exists) {
            const error = new Error(`Request with the id of ${requestID} was not found`);
            error.status = 400;
            return next(error);
        }
        const requestData = requestDocument.data();
        if (requestData.reviewed) {
            const error = new Error("Request is already reviewed");
            error.status = 400;
            return next(error);
        }
        let orderReference;
        let orderDocument;
        if (requestData["request"] === "refund") {
            //get the order
            orderReference = database.collection("orders").doc(requestData["order"]);
            orderDocument = await orderReference.get();
            if (!orderDocument.exists) {
                const error = new Error(`Order with the id of ${orderID} was not found`);
                error.status = 400;
                return next(error);
            }
            const orderData = orderDocument.data();
            if ((new Date() - new Date(orderData["deliverydate"]))/(1000*60*60*24) > 30) {
                approved = false;
                alertMessage = "Request is rejected since 30 days have passed"
            }
            //check existence of products
            const productsReference = orderReference.collection("products");
            const productsSnapshot = await productsReference.get();
            const productDocuments = productsSnapshot.docs;
            for (let productDocument of productDocuments) {
                const reference = database.collection("products").doc(productDocument.id);
                const document = await reference.get();
                if (!document.exists) {
                    approved = false;
                    alertMessage = alertMessage === "" ? "Request is rejected since some products are deleted" : "Request is rejected since 30 days have passed and some products are deleted";
                    break;
                }
            }
        }
        if (requestData["request"] === "refund" && approved) {
            orderData["status"] = "refunded";
            await orderReference.set(orderData);
            await log(database, "SET", `orders/${orderID}`, orderData, decodedToken.uid);
            //update product stocks
            const productsReference = orderReference.collection("products");
            const productsSnapshot = await productsReference.get();
            const productDocuments = productsSnapshot.docs;
            for (let productDocument of productDocuments) {
                const reference = database.collection("products").doc(productDocument.id);
                const document = await reference.get();
                const productData = document.data();
                productData["stock"] += productDocument.data().count;
                productData["popularity"] -= productDocument.data().count;
                await reference.set(productData);
                await log(database, "SET", `products/${productDocument.id}`, productData, decodedToken.uid);
            }
        }
        requestData["reviewed"] = true;
        requestData["approved"] = approved;
        await requestReference.set(requestData);
        await log(database, "SET", `requests/${requestID}`, requestData, decodedToken.uid);
        if (requestData["request"] === "refunded" && approved) {
            //send email
            const userReference = database.collection("users").doc(orderData.user);
            const userDocument = await userReference.get();
            const content = `
                <p>Hello ${userDocument.data().firstname},</p>
                
                <p>We’re reaching out to confirm that your refund for order #${orderDocument.id} has been successfully processed.</p>
            
                <h3>Refund Details:</h3>
                <ul>
                    <li><strong>Order ID:</strong> ${orderDocument.id}</li>
                    <li><strong>Refund Amount:</strong> $${orderData.totaldiscountedcost.toFixed(2)}</li>
                    <li><strong>Refund Date:</strong> ${Date()}</li>
                </ul>
            
                <p>The amount will be credited back within 3-5 business days, depending on your bank’s processing time.</p>
            
                <p>Best regards,</p>
                <p><strong>Teknosu Team</strong></p>
            `;
            await sendEmail(userDocument.data().email, "Refund request has been confirmed", content);
        }
        //send notification
        const notificationData = {
            message: `${requestData["request"].charAt(0).toUpperCase() + requestData["request"].slice(1)} request for order #${orderDocument.id} has been ${approved ? "accepted" : "rejected"}.`,
            seen: false,
            date: Date()
        };
        const notificationDocument = await database.collection("users").doc(orderData.user).collection("notifications").add(notificationData);
        await log(database, "ADD", `users/${orderData.user}/notifications/${notificationDocument.id}`, notificationData, decodedToken.uid);
        res.status(200).json({message: "Successfully set", alert:alertMessage});
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