import admin from "../services/auth.js"
import decodeToken from "../services/token.js"
import { createError, extractError } from "../services/error.js";
import log from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   productmanager adds a product
//  @route  PUT  /api/products/
export const addProduct = async (req, res) => {
    const token = req.headers.authorization;
    const { name, category, subcategory, serialnumber, image, stock, description, warranty, distributorname, features } = req.body;
    

    //add the product
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => tokenRole === "productmanager";
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //input check
        if (name === undefined || category === undefined || subcategory === undefined || serialnumber === undefined || image === undefined || stock === undefined || warranty === undefined || distributorname === undefined || features === undefined)
            throw createError("All fields are required", 400);
        else if (typeof name !== "string" || !name.trim())
            throw createError("Please enter a valid name", 400);
        else if (typeof category !== "string" || !category.trim())
            throw createError("Please enter a valid category", 400);
        else if (typeof subcategory !== "string" || !subcategory.trim())
            throw createError("Please enter a valid subcategory", 400);
        else if (typeof serialnumber !== "string" || !serialnumber.trim())
            throw createError("Please enter a valid serialnumber", 400);
        else if (typeof image !== "string" || !image.trim())
            throw createError("Please enter a valid image", 400);
        else if (!Number.isInteger(stock) || stock < 0)
            throw createError("Please enter a valid stock", 400);
        else if (description !== undefined && typeof description !== "string")
            throw createError("Please enter a valid description", 400);
        else if (!Number.isInteger(warranty) || stock < -1)
            throw createError("Please enter a valid warranty", 400);
        else if (typeof distributorname !== "string" || !distributorname.trim())
            throw createError("Please enter a valid distributorname", 400);
        else if (typeof features !== "object")
            throw createError("Please enter a valid features", 400);
        
        //set the product data
        let productData;
        productData = {
            name: name,
            category: category,
            subcategory: subcategory,
            serialnumber: serialnumber,
            image: image,
            price: 0,
            discount: 0,
            stock: stock,
            popularity: 0,
            description: description !== undefined ? description : undefined,
            warranty: warranty,
            distributorname: distributorname,
            features: features
        };

        //add the product
        const productDocument = await database.collection("products").add(productData);
        await log(database, "ADD", `products/${productDocument.id}`, productData, decodedToken.uid);

        //send a response
        res.status(200).json({message: "Successfully added"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}


//  @desc   productmanager/salesmanager sets a product
//  @route  PUT  /api/products/:productID
export const setProduct = async (req, res) => {
    const token = req.headers.authorization;
    const { name, category, subcategory, serialnumber, image, price, discount, stock, description, warranty, distributorname, features } = req.body;
    const productID = req.params.productID;
    

    //set the product
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => tokenRole === "productmanager" || tokenRole === "salesmanager";
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //input check
        if (tokenRole !== "salesmanager") {
            if (name === undefined || category === undefined || subcategory === undefined || serialnumber === undefined || image === undefined || stock === undefined || warranty === undefined || distributorname === undefined || features === undefined)
                throw createError("All fields are required", 400);
            else if (typeof name !== "string" || !name.trim())
                throw createError("Please enter a valid name", 400);
            else if (typeof category !== "string" || !category.trim())
                throw createError("Please enter a valid category", 400);
            else if (typeof subcategory !== "string" || !subcategory.trim())
                throw createError("Please enter a valid subcategory", 400);
            else if (typeof serialnumber !== "string" || !serialnumber.trim())
                throw createError("Please enter a valid serialnumber", 400);
            else if (typeof image !== "string" || !image.trim())
                throw createError("Please enter a valid image", 400);
            else if (!Number.isInteger(stock) || stock < 0)
                throw createError("Please enter a valid stock", 400);
            else if (description !== undefined && typeof description !== "string")
                throw createError("Please enter a valid description", 400);
            else if (!Number.isInteger(warranty) || stock < -1)
                throw createError("Please enter a valid warranty", 400);
            else if (typeof distributorname !== "string" || !distributorname.trim())
                throw createError("Please enter a valid distributorname", 400);
            else if (typeof features !== "object")
                throw createError("Please enter a valid features", 400);
        } else {
            if (price === undefined || discount === undefined)
                throw createError("All fields are required", 400);
            else if (typeof price !== "number" || price < 0)
                throw createError("Please enter a valid price", 400);
            else if (typeof discount !== "number" || 100 < discount < 0)
                throw createError("Please enter a valid discount", 400);
        }
        
        //get the product
        const productReference = database.collection("products").doc(productID);
        const productDocument = await productReference.get();
        if (!productDocument.exists)
            throw createError(`A product with the id of ${productID} was not found`, 404);
        const productData = productDocument.data();
        
        //set the product data
        const oldPrice = productData.price;
        const oldDiscount = productData.discount;
        if (tokenRole === "productmanager") {
            productData.name = name;
            productData.category = category;
            productData.subcategory = subcategory;
            productData.serialnumber = serialnumber;
            productData.image = image;
            productData.stock = stock;
            productData.description = description;
            productData.warranty = warranty;
            productData.distributorname = distributorname;
            productData.features = features;
        } else {
            productData.price = price;
            productData.discount = discount;
        }

        //set the product
        await database.collection("products").doc(productID).set(productData);
        await log(database, "SET", `products/${productID}`, productData, decodedToken.uid);

        //send notifications to users with the product in their wishlist upon price decrease
        if (tokenRole === "salesmanager" && oldPrice*(100-oldDiscount)/100 > price*(100-discount)/100) {
            const userReference = database.collection("users").where("wishlist", "array-contains", productID);
            const usersSnapshot = await userReference.get();
            const userDocuments = usersSnapshot.docs;
            for (const userDocument of userDocuments) {
                const userID = userDocument.id;
                const notificationData = {
                    message: `${productData["name"]} is on sale`,
                    seen: false,
                    date: Date()
                };
                //add the notification
                const notificationDocument = await database.collection("users").doc(userID).collection("notifications").add(notificationData);
                await log(database, "ADD", `users/${userDocument.id}/notifications/${notificationDocument.id}`, notificationData, decodedToken.uid);
            }
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


//  @desc   admin/productmanager deletes a product
//  @route  DELETE  /api/products/:productID
export const deleteProduct = async (req, res) => {
    const token = req.headers.authorization;
    const productID = req.params.productID;
   
    
    //delete the product
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => tokenRole === "admin" || tokenRole === "productmanager";
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //get the product
        const productReference = database.collection("products").doc(productID);
        const productDocument = await productReference.get();
        if (!productDocument.exists)
            throw createError(`A product with the id of ${productID} was not found`, 404);

        //delete the product
        await database.collection("products").doc(productID).delete();
        await log(database, "DELETE", `products/${productID}`, null, decodedToken.uid);

        //send a response
        res.status(200).json({message: "Successfully deleted"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}