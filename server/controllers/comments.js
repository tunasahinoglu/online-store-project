import admin from "../services/auth.js"
import log from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   user adds a comment
//  @route  POST  /api/comments
export const addComment = async (req, res, next) => {
    const token = req.headers.authorization;
    const { order, product, rate, comment } = req.body;
    

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
            if (!user.exists || !user.data().active) {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //input check
        if (order === undefined || product === undefined || rate === undefined) {
            const error = new Error("All fields are required");
            error.status = 400;
            return next(error);
        } else if (typeof order !== "string" || !order.trim()) {
            const error = new Error("Please enter a valid order");
            error.status = 400;
            return next(error);
        } else if (typeof product !== "string" || !product.trim()) {
            const error = new Error("Please enter a valid product");
            error.status = 400;
            return next(error);
        } else if (!Number.isInteger(rate) || 10 < rate < 0) {
            const error = new Error("Please enter a valid rate");
            error.status = 400;
            return next(error);
        }
        //get the order company
        const orderReference = database.collection("orders").doc(order);
        const orderDocument = await orderReference.get();
        if (!orderDocument.exists || orderDocument.data().status !== "delivered") {
            const error = new Error("Please enter a valid order");
            error.status = 400;
            return next(error);
        }
        //get the product
        const productReference = orderReference.collection("products").doc(product);
        const productDocument = await productReference.get();
        if (!productDocument.exists) {
            const error = new Error("Please enter a valid product");
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
        //get the comment
        const commentReference = database.collection("comments").where("user", "==", decodedToken.uid);
        const commentSnapshot = await commentReference.get();
        if (!commentSnapshot.empty) {
            const error = new Error(`A comment was already made`);
            error.status = 400;
            return next(error);
        }   

        const commentData = {
            user: userDocument.id,
            firstname: userDocument.data().firstname,
            lastname: userDocument.data().lastname,
            order: order,
            product: product,
            rate: rate,
            comment: comment !== undefined ? JSON.stringify(comment) : "",
            reviewed: comment !== undefined ? false : true,
            approved: comment !== undefined ? false : true,
            date: Date()
        };

        //add the comment
        commentDocument = await database.collection("comments").add(commentData);
        log(database, "ADD", `comments/${commentDocument.id}`, commentData, decodedToken.uid);
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


//  @desc   admin/productmanager sets a specific comment
//  @route  PUT  /api/comments/:commentID
export const setComment = async (req, res, next) => {
    const token = req.headers.authorization;
    const { approved } = req.body;
    const commentID = req.params.commentID;
    

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
            if (!user.exists || (tokenRole !== "admin" && (tokenRole !== "productmanager"))) {
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

        //get the comment
        const commentReference = database.collection("comments").doc(commentID);
        const commentDocument = await commentReference.get();
        if (!commentDocument.exists) {
            const error = new Error(`Comment with the id of ${commentID} was not found`);
            error.status = 400;
            return next(error);
        }
        const commentData = commentDocument.data();
        if (tokenRole === "productmanager" && commentData.reviewed) {
            const error = new Error("Comment is already reviewed");
            error.status = 400;
            return next(error);
        }
        commentData["reviewed"] = true;
        commentData["approved"] = approved;
        await commentReference.set(commentData);
        log(database, "SET", `comments/${commentID}`, commentData, decodedToken.uid);
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