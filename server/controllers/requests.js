import admin from "../services/auth.js"
import decodeToken from "../services/token.js"
import { createError, extractError } from "../services/error.js"
import addLog from "../services/log.js"
import { addNotification } from "../services/notification.js"


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   user adds a request
//  @route  POST  /api/requests
export const addRequest = async (req, res) => {
    const token = req.headers.authorization;
    const { order, request } = req.body;
    

    //add the request
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => isUser;
        const { decodedToken, tokenRole, isUser } = await decodeToken(admin, database, token, true, tokenCondition);

        //input check
        if (order === undefined || request === undefined)
            throw createError("All fields are required", 400);
        else if (typeof order !== "string" || !order.trim())
            throw createError("Please enter a valid order", 400);
        else if (typeof request !== "string" || !["refund"].includes(request))
            throw createError("Please enter a valid request", 400);

        //get the order
        const orderReference = database.collection("orders").doc(order);
        const orderDocument = await orderReference.get();
        if (!(orderDocument.exists && orderDocument.data().status === "delivered" && (new Date() - new Date(orderDocument.data().deliverydate))/(1000*60*60*24) <= 30))
            throw createError("Please enter a valid order", 400);

        //get the user data
        const userReference = database.collection("users").doc(decodedToken.uid);
        const userDocument = await userReference.get();
        if (!userDocument.exists)
            throw createError(`A user with the id of ${decodedToken.uid} was not found`, 404);
        const userData = userDocument.data();

        //get the request
        const requestReference = database.collection("requests").where("user", "==", decodedToken.uid).where("request", "==", request);
        const requestSnapshot = await requestReference.get();
        if (!requestSnapshot.empty)
            throw createError(`A request was already made`, 400);

        //set the request data
        const requestData = {
            user: userDocument.id,
            firstname: userData.firstname,
            lastname: userData.lastname,
            reviewed: false,
            approved: false,
            order: order,
            request: request,
            date: Date()
        };

        //add the request
        const requestDocument = await database.collection("requests").add(requestData);
        await addLog(database, "ADD", requestDocument.path, null, requestData, decodedToken.uid);

        //send notification
        await addNotification(database, orderData.user, decodeToken.uid, `${request.charAt(0).toUpperCase() + request.slice(1)} request for order #${order} has been added.`);
        
        //send a response
        console.log("Response: Successfully added");
        res.status(201).json({message: "Successfully added"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}


//  @desc   admin/sales manaher sets a specific request
//  @route  PUT  /api/requests/:requestID
export const setRequest = async (req, res) => {
    const token = req.headers.authorization;
    let { approved } = req.body;
    const requestID = req.params.requestID;
    let alertMessage = "";
    

    //set the request
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => tokenRole === "salesmanager";
        const { decodedToken, tokenRole, isUser } = await decodeToken(admin, database, token, false, tokenCondition);

        //input check
        if (approved === undefined)
            throw createError("All fields are required", 400);
        else if (typeof approved !== "boolean")
            throw createError("Please enter a valid approved", 400);

        //get the request data
        const requestReference = database.collection("requests").doc(requestID);
        const requestDocument = await requestReference.get();
        if (!requestDocument.exists)
            throw createError(`Request with the id of ${requestID} was not found`, 404);
        const requestData = requestDocument.data();
        if (requestData.reviewed)
            throw createError("Request is already reviewed", 400);

        //get the order
        let orderReference;
        let orderDocument;
        if (requestData["request"] === "refund") {
            orderReference = database.collection("orders").doc(requestData["order"]);
            orderDocument = await orderReference.get();
            if (!orderDocument.exists)
                throw createError(`Order with the id of ${orderID} was not found`, 404);
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

        //accept the request
        if (requestData["request"] === "refund" && approved) {
            orderData["status"] = "refunded";
            await orderReference.set(orderData);
            await addLog(database, "SET", orderReference.path, orderDocument.data(), orderData, decodedToken.uid);
            
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
                await addLog(database, "SET", reference.path, document.data(), productData, decodedToken.uid);
            }
        }

        //set the request
        requestData["reviewed"] = true;
        requestData["approved"] = approved;
        await requestReference.set(requestData);
        await addLog(database, "SET", requestReference.path, requestDocument.data(), requestData, decodedToken.uid);

        //send an email to user
        if (requestData["request"] === "refunded" && approved) {
            const userReference = database.collection("users").doc(orderData.user);
            const userDocument = await userReference.get();
            const userData = userDocument.data();
            const content = `
                <p>Hello ${userData.firstname},</p>
                
                <p>We’re reaching out to confirm that your refund for order #${orderDocument.id} has been successfully processed.</p>
            
                <h3>Refund Details:</h3>
                <ul>
                    <li><strong>Order ID:</strong> ${orderDocument.id}</li>
                    <li><strong>Refund Amount:</strong> $${orderData.totaldiscountedcost.toFixed(2)}</li>
                    <li><strong>Refund Date:</strong> ${Date()}</li>
                </ul>
            
                <p>The amount will be credited back within 3-5 business days, depending on your bank’s processing time.</p>
            
                <p>Best regards,</p>
                <p><strong>TeknoSU Team</strong></p>
            `;
            await sendEmail(userData.email, "Refund request has been confirmed", content);
        }

        //send notification
        await addNotification(database, orderData.user, decodedToken.uid, `${requestData["request"].charAt(0).toUpperCase() + requestData["request"].slice(1)} request for order #${orderDocument.id} has been ${approved ? "accepted" : "rejected"}.`);

        //send a response
        console.log("Response: Successfully set" + alertMessage ? `\nAlert: ${alertMessage}` : "");
        res.status(200).json({message: "Successfully set", alert:alertMessage});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}