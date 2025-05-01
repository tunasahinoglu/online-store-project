import admin from "../services/auth.js"
import decodeToken from "../services/token.js"
import { createError, extractError } from "../services/error.js"
import addLog from "../services/log.js"
import { addNotification } from "../services/notification.js"
import createPDFAttachment from "../services/pdf.js"
import sendEmail from "../services/email.js"


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   user adds an order
//  @route  POST  /api/orders
export const addOrder = async (req, res) => {
    const token = req.headers.authorization;
    const { delivery, notes } = req.body;
    

    //add the order
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => userData.active;
        const { decodedToken, tokenRole, isUser } = await decodeToken(admin, database, token, true, tokenCondition);

        //input check
        if (delivery === undefined)
            throw createError("All fields are required", 400);
        else if (typeof delivery !== "object" || delivery.type === undefined || typeof delivery.type !== "string" || !["standard", "express"].includes(delivery.type) || delivery.company === undefined || typeof delivery.company !== "string")
            throw createError("Please enter a valid delivery", 400);
        else if (notes !== undefined && typeof notes !== "string")
            throw createError("Please enter valid notes", 400);

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
            notes: notes !== undefined ? notes : null,
            date: Date()
        };

        //add the order
        let orderReference = await database.collection("orders").add(orderData);

        //calculate total cost & discounted cost
        let totalCost = delivery.type === "standard" ? deliveryCompanyData.costs[0] : deliveryCompanyData.costs[1];
        let totalDiscountedCost = totalCost;
        orderData["deliverycost"] = totalCost;
        const orderID = orderReference.id;
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
            await productReference.set(newProductData);
            await addLog(database, "SET", productReference.path, productData, newProductData, decodedToken.uid);
            
            //add product
            totalCost += basketProductData.count * productData.price;
            totalDiscountedCost += basketProductData.count * productData.price * (100 - productData.discount)/100
            const orderProductData = {
                name: productData.name,
                price: productData.price,
                discount: productData.discount,
                count: basketProductData.count
            };
            const orderProductReference = database.collection("orders").doc(orderID).collection("products").doc(basketProductDocument.id);
            await orderProductReference.set(orderProductData);
            await addLog(database, "ADD", orderProductReference.path, null, orderProductData, decodedToken.uid);
        }

        //delete user basket
        for (let basketProductDocument of basketDocuments) {
            await basketReference.doc(basketProductDocument.id).delete();
            await addLog(database, "DELETE", basketProductDocument.ref.path, basketProductDocument.data(), null, decodedToken.uid);
        }

        //add the order
        orderData["totalcost"] = totalCost;
        orderData["totaldiscountedcost"] = totalDiscountedCost;
        await database.collection("orders").doc(orderReference.id).set(orderData);
        await addLog(database, "ADD", orderReference.path, null, orderData, decodedToken.uid);

        //send an email to user
        const orderDocument = await database.collection("orders").doc(orderReference.id).get();
        const orderProductsSnapshot = await database.collection("orders").doc(orderDocument.id).collection("products").get();
        const orderProductDocuments = orderProductsSnapshot.docs;
        const attachment = createPDFAttachment(orderDocument, orderProductDocuments);
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
        await addNotification(database, decodedToken.uid, decodedToken.uid, `Order #${orderDocument.id} has been placed.`);
        
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


//  @desc   user/productmanager/admin sets an order
//  @route  PUT  /api/orders/:orderID
export const setOrder = async (req, res) => {
    const token = req.headers.authorization;
    const { status } = req.body;
    const orderID = req.params.orderID;
    

    //set the order
    try {
        //get the order data
        const orderReference = database.collection("orders").doc(orderID);
        const orderDocument = await orderReference.get();
        if (!orderDocument.exists)
            throw createError(`Order with the id of ${orderID} was not found`, 404);
        const orderData = orderDocument.data();

        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => tokenRole === "admin" || tokenRole === "productmanager" || isUser;
        const { decodedToken, tokenRole, isUser } = await decodeToken(admin, database, token, orderData.user, tokenCondition);

        //input check
        if (status === undefined)
            throw createError("All fields are required", 400);
        else if (typeof status !== "string" || !["cancelled", "in-transit", "delivered"].includes(status))
            throw createError("Please enter a valid status", 400);

        //status check
        if (!(((tokenRole === "admin" || isUser) && orderData.status === "processing" && status === "cancelled") || (tokenRole === "productmanager" && ((orderData.status === "processing" && status === "in-transit") || (orderData.status === "in-transit" && status === "delivered")))))
            throw createError("Please enter a valid status", 400);

        //check existence of products
        if (status === "cancelled") {
            const orderProductsReference = orderReference.collection("products");
            const orderProductsSnapshot = await orderProductsReference.get();
            const orderProductDocuments = orderProductsSnapshot.docs;
            for (let orderProductDocument of orderProductDocuments) {
                const productReference = database.collection("products").doc(orderProductDocument.id);
                const productDocument = await productReference.get();
                if (!productDocument.exists)
                    throw createError("Some products are not suitable for the cancellation request", 400);
            }
        }

        //set the order data
        if (status === "delivered")
            orderData["deliverydate"] = Date();
        orderData["status"] = status;

        //set the order
        await orderReference.set(orderData);
        await addLog(database, "SET", orderReference.path, orderDocument.data(), orderData, decodedToken.uid);

        //update product stocks
        if (status === "cancelled") {
            const orderProductsReference = orderReference.collection("products");
            const orderProductsSnapshot = await orderProductsReference.get();
            const orderProductDocuments = orderProductsSnapshot.docs;
            for (let orderProductDocument of orderProductDocuments) {
                const productReference = database.collection("products").doc(orderProductDocument.id);
                const productDocument = await productReference.get();
                const orderProductData = orderProductDocument.data();
                const productData = productDocument.data();
                productData["stock"] += orderProductData.count;
                productData["popularity"] -= orderProductData.count;
                await productReference.set(productData);
                await addLog(database, "SET", productReference.path, productDocument.data(), productData, decodedToken.uid);
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
        await addNotification(database, orderData.user, decodedToken.uid, message);
        
        //send a response
        console.log("Response: Successfully set");
        res.status(200).json({message: "Successfully set"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}