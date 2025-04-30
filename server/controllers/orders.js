import admin from "../services/auth.js"
import decodeToken from "../services/token.js"
import { createError, extractError } from "../services/error.js";
import log from "../services/log.js";
import createPDFAttachment from "../services/pdf.js";
import sendEmail from "../services/email.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   user adds an order
//  @route  POST  /api/orders
export const addOrder = async (req, res) => {
    const token = req.headers.authorization;
    const { notes } = req.body;
    let { delivery } = req.body;
    

    //add the order
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => userData.active;
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //input check
        if (delivery === undefined)
            throw createError("All fields are required", 400);
        else if (typeof delivery !== "object" || delivery.type === undefined || typeof delivery.type !== "string" || !["standard", "express"].includes(delivery.type) || delivery.company === undefined || typeof delivery.company !== "string")
            throw createError("Please enter a valid delivery", 400);

        //get the delivery company data
        const deliveryCompanyReference = database.collection("deliverycompanies").doc(delivery.company);
        const deliveryCompanyDocument = await deliveryCompanyReference.get();
        if (!deliveryCompanyDocument.exists)
            throw createError("Please enter a valid delivery", 400);
        const deliveryCompanyData = deliveryCompanyDocument.data();
        
        //get the user
        const userReference = database.collection("users").doc(decodedToken.uid);
        const userDocument = await userReference.get();
        if (!userDocument.exists)
            throw createError(`A user with the id of ${decodedToken.uid} was not found`, 404);

        //get the basket
        const basketReference = userReference.collection("basket");
        const basketSnapshot = await basketReference.get();
        const basketDocuments = basketSnapshot.docs;
        if (basketDocuments.empty)
            throw createError(`Basket is empty`, 400);

        //check for an unavailable item
        for (let productDocument of basketDocuments) {
            //get the product
            const reference = database.collection("products").doc(productDocument.id);
            const document = await reference.get();
            if (!document.exists || document.data().price === 0 || document.data().stock < productDocument.data().count)
                throw createError(`Basket contains an unavailable item`, 400);
        }

        //set order data
        delivery.name = deliveryCompanyData.name;
        const orderData = {
            user: userDocument.id,
            firstname: userDocument.data().firstname,
            lastname: userDocument.data().lastname,
            totalcost: 0,
            totaldiscountedcost: 0,
            deliverycost: 0,
            status: "processing",
            address: userDocument.data().address,
            billingaddress: userDocument.data().address,
            delivery: delivery,
            notes: notes ? JSON.stringify(notes) : "",
            date: Date()
        };

        //add the order
        let orderDocument = await database.collection("orders").add(orderData);

        //calculate total cost & discounted cost
        let totalCost = delivery.type === "standard" ? deliveryCompanyData.costs[0] : deliveryCompanyData.costs[1];
        let totalDiscountedCost = totalCost;
        orderData["deliverycost"] = totalCost;
        const orderID = orderDocument.id;
        for (let basketProductDocument of basketDocuments) {
            //get the product
            const productReference = database.collection("products").doc(basketProductDocument.id);
            const productDocument = await productReference.get();
            const productData = productDocument.data();
            const basketProductData = basketProductDocument.data();

            //update product
            const newProductData = productDocument.data();
            newProductData["stock"] = productData.stock - basketProductData.count;
            newProductData["popularity"] = productData.popularity + basketProductData.count;
            await database.collection("products").doc(basketProductDocument.id).set(newProductData);
            await log(database, "SET", `products/${productDocument.id}`, newProductData, decodedToken.uid);
            
            //add product
            totalCost += basketProductData.count * productData.price;
            totalDiscountedCost += basketProductData.count * productData.price * (100 - productData.discount)/100
            const orderProductData = {
                name: productData.name,
                price: productData.price,
                discount: productData.discount,
                count: basketProductData.count
            };
            await database.collection("orders").doc(orderID).collection("products").doc(basketProductDocument.id).set(orderProductData);
            await log(database, "ADD", `orders/${orderID}/products/${basketProductDocument.id}`, orderProductData, decodedToken.uid);
        }

        //delete user basket
        for (let basketProductDocument of basketDocuments) {
            await basketReference.doc(basketProductDocument.id).delete();
            await log(database, "DELETE", `users/${userDocument.id}/basket/${basketProductDocument.id}`, null, decodedToken.uid);
        }

        //add the order
        orderData["totalcost"] = totalCost;
        orderData["totaldiscountedcost"] = totalDiscountedCost;
        await database.collection("orders").doc(orderDocument.id).set(orderData);
        await log(database, "ADD", `orders/${orderID}`, orderData, decodedToken.uid);

        //send an email to user
        orderDocument = await database.collection("orders").doc(orderDocument.id).get();
        const productsSnapshot = await database.collection("orders").doc(orderDocument.id).collection("products").get();
        const productDocuments = productsSnapshot.docs;
        const attachment = createPDFAttachment(orderDocument, productDocuments);
        const content = `
            <p>Hello ${userDocument.data().firstname},</p>
        
            <p>Thank you for your order! We are pleased to confirm that your order #${orderDocument.id} has been successfully placed.</p>
        
            <p><strong>Order Details:</strong></p>
            <ul>
                <li><strong>Order ID:</strong> ${orderDocument.id}</li>
                <li><strong>Order Date:</strong> ${orderDocument.data().date}</li>
                <li><strong>Total Amount:</strong> $${orderDocument.data().totaldiscountedcost.toFixed(2)}</li>
            </ul>
        
            <p>You can expect to receive your order soon. The tracking information will be sent once your order has been shipped.</p>
            <p>Please find the invoice attached.</p>
        
            <p>Best regards,</p>
            <p><strong>Teknosu Team</strong></p>
        `;
        await sendEmail(userDocument.data().email, "We have received your order", content, [attachment]);

        //send notification to user
        const notificationData = {
            message: `Order #${orderDocument.id} has been placed.`,
            seen: false,
            date: Date()
        };
        const notificationDocument = await database.collection("users").doc(decodedToken.uid).collection("notifications").add(notificationData);
        await log(database, "ADD", `users/${decodedToken.uid}/notifications/${notificationDocument.id}`, notificationData, decodedToken.uid);
        
        //send a response
        res.status(201).json({message: "Successfully added"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}


//  @desc   user/productmanager/admin sets an order
//  @route  PUT  /api/orders/:orderID
export const setOrder = async (req, res) => {
    const token = req.headers.authorization;
    const { status } = req.body;
    const orderID = req.params.orderID;
    

    //set the order
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => tokenRole === "admin" || tokenRole === "productmanager" || isUser;
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //input check
        if (status === undefined)
            throw createError("All fields are required", 400);
        else if (typeof status !== "string" || !["cancelled", "in-transit", "delivered"].includes(status))
            throw createError("Please enter a valid status", 400);

        //get the order data
        const orderReference = database.collection("orders").doc(orderID);
        const orderDocument = await orderReference.get();
        if (!orderDocument.exists)
            throw createError(`Order with the id of ${orderID} was not found`, 400);
        const orderData = orderDocument.data();

        //status check
        if (!(((tokenRole === "admin" || isUser) && orderData.status === "processing" && status === "cancelled") || (tokenRole === "productmanager" && ((orderData.status === "processing" && status === "in-transit") || (orderData.status === "in-transit" && status === "delivered")))))
            throw createError("Please enter a valid status", 400);

        //check existence of products
        if (status === "cancelled") {
            const productsReference = orderReference.collection("products");
            const productsSnapshot = await productsReference.get();
            const productDocuments = productsSnapshot.docs;
            for (let productDocument of productDocuments) {
                const reference = database.collection("products").doc(productDocument.id);
                const document = await reference.get();
                if (!document.exists)
                    throw createError("Some products are not suitable for the cancellation request", 400);
            }
        }

        //set the order data
        if (status === "delivered")
            orderData["deliverydate"] = Date();
        orderData["status"] = status;

        //set the order
        await orderReference.set(orderData);
        await log(database, "SET", `orders/${orderID}`, orderData, decodedToken.uid);

        //update product stocks
        if (status === "cancelled") {
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

        //send notification to user
        let message;
        switch (status) {
          case "cancelled":
            message = `Order #${orderDocument.id} has been cancelled.`;
            break;
          case "in-transit":
            message = `Order #${orderDocument.id} is on the way.`;
            break;
          case "delivered":
            message = `Order #${orderDocument.id} has been delivered.`;
            break;
          default:
            message = `Order #${orderDocument.id} status has been updated.`;
        }
        const notificationData = {
            message: message,
            seen: false,
            date: Date()
        };
        const notificationDocument = await database.collection("users").doc(orderData.user).collection("notifications").add(notificationData);
        await log(database, "ADD", `users/${orderData.user}/notifications/${notificationDocument.id}`, notificationData, decodedToken.uid);
        
        //send a response
        res.status(200).json({message: "Successfully set"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}