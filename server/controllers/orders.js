import admin from "../services/auth.js"
import log from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   user adds an order
//  @route  POST  /api/orders
export const addOrder = async (req, res, next) => {
    const token = req.headers.authorization;
    const { delivery, notes } = req.body;
    

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
            tokenRole = user.id === decodedToken.uid ? "user" : user.data().role;
            if (!user.exists || !user.data().active) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //input check
        if (delivery === undefined) {
            const error = new Error("All fields are required");
            error.status = 400;
            return next(error);
        } else if (typeof delivery !== "object" || delivery.type === undefined || typeof delivery.type !== "string" || !["standard", "express"].includes(delivery.type) || delivery.company === undefined || typeof delivery.company === "string") {
            const error = new Error("Please enter a valid delivery");
            error.status = 400;
            return next(error);
        }
        //get the delivery company
        const deliveryCompanyReference = database.collection("deliverycompanies").doc(delivery.company);
        const deliveryCompanyDocument = await deliveryCompanyReference.get();
        if (!deliveryCompanyDocument.exists) {
            const error = new Error("Please enter a valid delivery");
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
        //get the basket
        const basketReference = userReference.collection("basket");
        const basketSnapshot = await basketReference.get();
        const basketDocuments = basketSnapshot.docs;
        if (basketDocuments.length) {
            const error = new Error(`Basket is empty`);
            error.status = 400;
            return next(error);
        }

        const orderData = {
            user: userDocument.id,
            firstname: userDocument.data().firstname,
            lastname: userDocument.data().lastname,
            totalcost: 0,
            totaldiscountedcost: 0,
            status: "processing",
            address: userDocument.data().address,
            billingaddress: userDocument.data().address,
            delivery: delivery,
            notes: JSON.stringify(notes),
            date: Date()
        };

        //add the order
        const orderDocument = await database.collection("orders").add(orderData);
        //calculate total cost & discounted cost
        let totalCost = delivery.type === "standard" ? deliveryCompanyDocument.costs[0] : deliveryCompanyDocument.costs[1];
        let totalDiscountedCost = totalCost;
        const orderID = orderDocument.id;
        for (let productDocument of basketDocuments) {
            //get the product
            const reference = database.collection("products").doc(productDocument.id);
            const document = await reference.get();
            if (!document.exists || document.data().price === 0 || document.data().stock < productDocument.data().count) {
                const error = new Error(`Basket contains an unavailable item`);
                error.status = 400;
                return next(error);
            }
            //update product
            const newDocumentData = document.data();
            newDocumentData["stock"] = document.data().stock - productDocument.data().count;
            newDocumentData["popularity"] = document.data().popularity + productDocument.data().count;
            await database.collection("products").doc(productDocument.id).set(newDocumentData);
            log(database, "SET", `products/${document.id}`, newDocumentData, decodedToken.uid);
            //add product
            totalCost += document.data().price;
            totalDiscountedCost += document.data().price * (100 - document.data().discount)/100
            const productData = {
                price: document.data().price,
                discount: document.data().discount,
                count: productDocument.data().count
            };
            await database.collection("orders").doc(orderID).collection("products").doc(productDocument.id).set(productData);
            log(database, "SET", `orders/${orderID}/products/${productDocument.id}`, productData, decodedToken.uid);
        }
        //delete user basket
        for (let productDocument of basketDocuments) {
            await basketReference.doc(productDocument.id).delete();
            log(database, "DELETE", `users/${userDocument.id}/basket/${productDocument.id}`, null, decodedToken.uid);
        }
        orderData["totalcost"] = totalCost;
        orderData["totaldiscountedcost"] = totalDiscountedCost;
        log(database, "SET", `orders/${orderID}`, orderData, decodedToken.uid);
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


//  @desc   user/salesmanager/admin sets an order
//  @route  PUT  /api/orders/:orderID
export const setOrder = async (req, res, next) => {
    const token = req.headers.authorization;
    const { status } = req.body;
    const orderID = req.params.orderID;
    

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
            tokenRole = user.id === decodedToken.uid ? "user" : user.data().role;
            if (!user.exists || (tokenRole !== "admin" && tokenRole !== "salesmanager" && tokenRole !== "user" && !user.data().active)) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //input check
        if (status === undefined) {
            const error = new Error("All fields are required");
            error.status = 400;
            return next(error);
        } else if (typeof status !== "string" || ["cancelled", "refunded", "in-transit", "delivered"].includes(status)) {
            const error = new Error("Please enter a valid status");
            error.status = 400;
            return next(error);
        }

        //get the order
        const orderReference = userReference.collection("orders").doc(orderID);
        const orderDocument = await orderReference.get();
        if (!orderDocument.exists) {
            const error = new Error(`Order with the id of ${orderID} was not found`);
            error.status = 400;
            return next(error);
        }
        const orderData = orderDocument.data();
        if (((tokenRole === "admin" || tokenRole === "user") && orderData.status !== "processing" && status !== "cancelled") || (tokenRole === "salesmanager" && (orderData.status !== "delivered" && status !== "refunded")) || (tokenRole === "productmanager" && ((orderData.status !== "processing" && status !== "in-transit") || (orderData.status !== "in-trasmit" && status !== "delivered")))) {
            const error = new Error("Please enter a valid status");
            error.status = 400;
            return next(error);
        }
        if (status === "refunded") {
            //get request
            const requestReference = requestReference.collection("requests").where("order", "==", orderID).where("request", "==", "refund");
            const requestSnapshot = await requestReference.get();
            if (requestSnapshot.empty) {
                const error = new Error(`Request was not found`);
                error.status = 400;
                return next(error);
            }
            const requestDocument = requestSnapshot.docs[0];
        }
        orderData["status"] = status;
        await orderReference.set(orderData);
        log(database, "SET", `orders/${orderID}`, orderData, decodedToken.uid);
        if (status === "cancelled" || status === "refund") {
            //update product stocks
            const productsReference = orderReference.collection("products");
            const productsSnapshot = productsReference.get();
            const productDocuments = productsSnapshot.docs;
            for (let productDocument of productDocuments) {
                const reference = database.collection("products").doc(productDocument.id);
                const document = reference.get();
                const productData = document.data();
                productData["stock"] += productDocument.data().count;
                productData["popularity"] -= productDocument.data().count;
                await reference.set(productData);
                log(database, "SET", `products/${productDocument.id}`, productData, decodedToken.uid);
            }
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