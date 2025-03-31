import admin from "../services/auth.js"
import log from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   admin adds a delivery company
//  @route  POST /api/deliverycompanies
export const addDeliveryCompany = async (req, res, next) => {
    const token = req.headers.authorization;
    const { name, costs, email } = req.body;

    
    //set the user
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
            if (!user.exists || tokenRole !== "admin") {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //input check
        if (name === undefined || costs === undefined || email === undefined) {
            const error = new Error("All fields are required");
            error.status = 400;
            return next(error);
        } else if (typeof name !== "string" || !name.trim()) {
            const error = new Error("Please enter a valid name");
            error.status = 400;
            return next(error);
        } else if (!Array.isArray(costs) || costs.length !== 2 || typeof costs[0] !== "number" || costs[0] < 0 || typeof costs[1] !== "number" || costs[1] < 0) {
            const error = new Error("Please enter a valid costs");
            error.status = 400;
            return next(error);
        } else if (typeof email !== "string" || !email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            const error = new Error("Please enter a valid email address");
            error.status = 400;
            return next(error);
        }

        const deliveryCompanyData = {
            name: name,
            costs: costs,
            email: email
        };

        //add the delivery company
        const deliveryCompanyDocument = await database.collection("users").add(deliveryCompanyData);
        log(database, "ADD", `deliverycompanies/${deliveryCompanyDocument.id}`, deliveryCompanyData, decodedToken.uid);
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


//  @desc   admin deletes a specific delivery company
//  @route  DELETE  /api/deliverycompanies/:deliveryCompanyID
export const deleteDeliveryCompany = async (req, res, next) => {
    const token = req.headers.authorization;
    const deliveryCompanyID = req.params.deliveryCompanyID;
    

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
            if (!user.exists || tokenRole !== "admin") {
                const error = new Error("Unauthorized access");
                error.status = 401;
                return next(error);
            }
        }
        //get the delivery company
        const deliveryCompanyReference = userReference.collection("deliverycompanies").doc(deliveryCompanyID);
        const deliveryCompanyDocument = await deliveryCompanyReference.get();
        if (!deliveryCompanyDocument.exists) {
            const error = new Error(`A delivery company with the id of ${deliveryCompanyID} was not found`);
            error.status = 404;
            return next(error);
        }
        //delete the delivery company
        await database.collection("users").doc(deliveryCompanyID).delete();
        log(database, "DELETE", `deliverycompanies/${deliveryCompanyDocument.id}`, null, decodedToken.uid);
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