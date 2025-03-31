import admin from "../services/auth.js"
import log from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   admin/productmanager/salesmanager sets a product
//  @route  PUT  /api/products/:productID
export const setProduct = async (req, res, next) => {
    const token = req.headers.authorization;
    const { name, category, subcategory, serialnumber, image, price, discount, stock, description, warranty, distributername, features } = req.body;
    const productID = req.params.productID;
    

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
            if (!user.exists || (tokenRole !== "admin" && tokenRole !== "productmanager" && tokenRole !== "salesmanager")) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //input check
        if (tokenRole !== "salesmanager") {
            if (name === undefined || category === undefined || subcategory === undefined || serialnumber === undefined || image === undefined || stock === undefined || warranty === undefined || distributername === undefined || features === undefined || (tokenRole === "admin" && (price === undefined || discount === undefined))) {
                const error = new Error("All fields are required");
                error.status = 400;
                return next(error);
            } else if (typeof name !== "string" || !name.trim()) {
                const error = new Error("Please enter a valid name");
                error.status = 400;
                return next(error);
            } else if (typeof category !== "string" || !category.trim()) {
                const error = new Error("Please enter a valid category");
                error.status = 400;
                return next(error);
            } else if (typeof subcategory !== "string" || !subcategory.trim()) {
                const error = new Error("Please enter a valid subcategory");
                error.status = 400;
                return next(error);
            } else if (typeof serialnumber !== "string" || !serialnumber.trim()) {
                const error = new Error("Please enter a valid serialnumber");
                error.status = 400;
                return next(error);
            } else if (typeof image !== "string" || !image.trim()) {
                const error = new Error("Please enter a valid image");
                error.status = 400;
                return next(error);
            } else if (!Number.isInteger(stock) || stock < 0) {
                const error = new Error("Please enter a valid stock");
                error.status = 400;
                return next(error);
            } else if (description !== undefined && typeof description !== "string") {
                const error = new Error("Please enter a valid description");
                error.status = 400;
                return next(error);
            } else if (!Number.isInteger(warranty) || stock < -1) {
                const error = new Error("Please enter a valid warranty");
                error.status = 400;
                return next(error);
            } else if (typeof distributername !== "string" || !distributername.trim()) {
                const error = new Error("Please enter a valid distributername");
                error.status = 400;
                return next(error);
            } else if (typeof features !== "object") {
                const error = new Error("Please enter a valid features");
                error.status = 400;
                return next(error);
            } else if (tokenRole === "admin" && typeof price !== "number" || price < 0) {
                const error = new Error("Please enter a valid price");
                error.status = 400;
                return next(error);
            } else if (tokenRole === "admin" && typeof discount !== "number" || 100 < discount < 0) {
                const error = new Error("Please enter a valid discount");
                error.status = 400;
                return next(error);
            }
        } else {
            if (price === undefined || discount === undefined) {
                const error = new Error("All fields are required");
                error.status = 400;
                return next(error);
            } else if (typeof price !== "number" || price < 0) {
                const error = new Error("Please enter a valid price");
                error.status = 400;
                return next(error);
            } else if (typeof discount !== "number" || 100 < discount < 0) {
                const error = new Error("Please enter a valid discount");
                error.status = 400;
                return next(error);
            }
        }
        
        let productData;
        //get the product
        if (tokenRole === "admin") {
            productData = {
                name: name,
                category: category,
                subcategory: subcategory,
                serialnumber: serialnumber,
                image: image,
                price: price,
                discount: discount,
                stock: stock,
                description: description !== undefined ? description : "",
                warranty: warranty,
                distributername: distributername,
                features: features
            };
        } else if (tokenRole === "productmanager") {
            const productReference = database.collection("products").doc(productID);
            const productDocument = await productReference.get();
            productData = {
                name: name,
                category: category,
                subcategory: subcategory,
                serialnumber: serialnumber,
                image: image,
                price: productDocument.exists ? productDocument.data().price : 0,
                discount: productDocument.exists ? productDocument.data().discount : 0,
                stock: stock,
                description: description !== undefined ? description : "",
                warranty: warranty,
                distributername: distributername,
                features: features
            };
        } else {
            const productReference = database.collection("products").doc(productID);
            const productDocument = await productReference.get();
            if (!productDocument.exists) {
                const error = new Error(`A product with the id of ${productID} was not found`);
                error.status = 404;
                return next(error);
            }
            productData = productDocument.data();
            productData["price"] = price;
            productData["discount"] = discount;
        }

        //set the product
        await database.collection("products").doc(productID).set(productData);
        log(database, "SET", `products/${productID}`, productData, decodedToken.uid);
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


//  @desc   admin/productmanager deletes a product
//  @route  DELETE  /api/products/:productID
export const deleteProduct = async (req, res, next) => {
    const token = req.headers.authorization;
    const productID = req.params.productID;
   
    
    //delete the product
    try {
        //token check
        let decodedToken;
        if (!token) {
            const error = new Error("No token provided");
            error.status = 401;
            return next(error);
        } else {
            decodedToken = await admin.auth().verifyIdToken(token);
            const userReference = database.collection("users").doc(decodedToken.uid);
            const user = await userReference.get();
            const tokenRole = user.data().role;
            if (!user.exists || (tokenRole !== "admin" && tokenRole !== "productmanager")) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //get the product
        const productReference = database.collection("products").doc(productID);
        const productDocument = await productReference.get();
        if (!productDocument.exists) {
            const error = new Error(`A product with the id of ${productID} was not found`);
            error.status = 404;
            return next(error);
        }
        //delete the product
        await database.collection("products").doc(productID).delete();
        log(database, "DELETE", `products/${productID}`, null, decodedToken.uid);
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