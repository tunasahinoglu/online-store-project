import admin from "../services/auth.js"
import decodeToken from "../services/token.js"
import { createError, extractError } from "../services/error.js"
import addLog from "../services/log.js"
import { addNotification } from "../services/notification.js"


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   user adds a comment
//  @route  POST  /api/comments
export const addComment = async (req, res) => {
    const token = req.headers.authorization;
    const { order, product, rate, comment } = req.body;
    

    //add the comment
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => userData.active;
        const { decodedToken, tokenRole, isUser } = await decodeToken(admin, database, token, true, tokenCondition);

        //input check
        if (order === undefined || product === undefined || rate === undefined)
            throw createError("All fields are required", 400);
        else if (typeof order !== "string" || !order.trim())
            throw createError("Please enter a valid order", 400);
        else if (typeof product !== "string" || !product.trim())
            throw createError("Please enter a valid product", 400);
        else if (!Number.isInteger(rate) || 10 < rate < 0)
            throw createError("Please enter a valid rate", 400);

        //get the order
        const orderReference = database.collection("orders").doc(order);
        const orderDocument = await orderReference.get();
        if (!orderDocument.exists || orderDocument.data().status !== "delivered")
            throw createError("Please enter a valid order", 400);

        //get the product
        const productReference = orderReference.collection("products").doc(product);
        const productDocument = await productReference.get();
        if (!productDocument.exists)
            throw createError("Please enter a valid product", 400);

        //get the user data
        const userReference = database.collection("users").doc(decodedToken.uid);
        const userDocument = await userReference.get();
        if (!userDocument.exists)
            throw createError(`A user with the id of ${decodedToken.uid} was not found`, 404);
        const userData = userDocument.data();

        //get the comment
        const commentReference = database.collection("comments").where("user", "==", decodedToken.uid).where("order", "==", order).where("product", "==", product);
        const commentSnapshot = await commentReference.get();
        if (!commentSnapshot.empty)
            throw createError(`A comment was already made for this order of the product`, 400);

        //set comment data
        const commentData = {
            user: decodedToken.uid,
            firstname: userData.firstname,
            lastname: userData.lastname,
            order: order,
            product: product,
            rate: rate,
            comment: comment !== undefined || !comment.trim() ? JSON.stringify(comment) : null,
            reviewed: comment !== undefined ? false : true,
            approved: comment !== undefined ? false : true,
            date: Date()
        };

        //add the comment
        const commentDocument = await database.collection("comments").add(commentData);
        await addLog(database, "ADD", commentDocument.path, null, commentData, decodedToken.uid);

        //send notification to user
        const message = commentData.comment === null ?
                        `Rating #${commentDocument.id} has been posted.` :
                        `Comment #${commentDocument.id} has been submitted for approval.`;
        await addNotification(database, decodedToken.uid, decodedToken.uid, message);

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


//  @desc   admin/productmanager sets a specific comment
//  @route  PUT  /api/comments/:commentID
export const setComment = async (req, res) => {
    const token = req.headers.authorization;
    const { approved } = req.body;
    const commentID = req.params.commentID;
    

    //set the comment
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => tokenRole === "admin" && tokenRole === "productmanager";
        const { decodedToken, tokenRole, isUser } = await decodeToken(admin, database, token, false, tokenCondition);

        //input check
        if (approved === undefined)
            throw createError("All fields are required", 400);
        else if (typeof approved !== "boolean")
            throw createError("Please enter a valid approved", 400);

        //get the comment data
        const commentReference = database.collection("comments").doc(commentID);
        const commentDocument = await commentReference.get();
        if (!commentDocument.exists)
            throw createError(`Comment with the id of ${commentID} was not found`, 404);
        const commentData = commentDocument.data();

        //check if already reviewed
        if (tokenRole === "productmanager" && commentData.reviewed)
            throw createError("Comment is already reviewed", 400);

        //set comment data
        commentData["reviewed"] = true;
        commentData["approved"] = approved;

        //set comment
        await commentReference.set(commentData);
        await addLog(database, "SET", commentReference.path, commentDocument.data(), commentData, decodedToken.uid);

        //send notification to user
        const message = commentData["comment"] === null ?
                        `Rating #${commentDocument.id} has been ${approval ? "made visible" : "hidden"}.` :
                        `Comment #${commentDocument.id} has been ${approval ? "approved" : "denied"}.`;
        await addNotification(database, commentData.user, decodedToken.uid, message);

        //send a response
        console.log("Response: Successfully set");
        res.status(200).json({message: "Successfully set"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);
        
        //send response
        res.status(status).json({message: message});
    }
}