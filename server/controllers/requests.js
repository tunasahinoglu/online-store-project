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
            tokenRole = user.id === decodedToken.uid ? "user" : user.data().role;
            if (!user.exists || !user.data().active) {
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
        //get the order company
        const orderReference = database.collection("orders").doc(order);
        const orderDocument = await orderReference.get();
        if (!orderDocument.exists || orderDocument.data().status !== "delivered") {
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

        const requestData = {
            user: userDocument.id,
            firstname: userDocument.data().firstname,
            lastname: userDocument.data().lastname,
            order: order,
            request: request,
            date: Date()
        };

        //add the request
        const requestDocument = await database.collection("requests").add(requestData);
        log(database, "ADD", `requests/${requestDocument.id}`, requestData, decodedToken.uid);
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