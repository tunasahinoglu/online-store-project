import admin from "../services/auth.js"
import decodeToken from "../services/token.js"
import { createError, extractError } from "../services/error.js";
import log from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   admin adds a delivery company
//  @route  POST /api/deliverycompanies
export const addDeliveryCompany = async (req, res) => {
    const token = req.headers.authorization;
    const { name, costs, email } = req.body;

    
    //add the delivery company
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => tokenRole === "admin";
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //input check
        if (name === undefined || costs === undefined || email === undefined)
            throw createError("All fields are required", 400);
        else if (typeof name !== "string" || !name.trim())
            throw createError("Please enter a valid name", 400);
        else if (!Array.isArray(costs) || costs.length !== 2 || typeof costs[0] !== "number" || costs[0] < 0 || typeof costs[1] !== "number" || costs[1] < 0)
            throw createError("Please enter a valid costs", 400);
        else if (typeof email !== "string" || !email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
            throw createError("Please enter a valid email address", 400);
        
        //set delivery company data
        const deliveryCompanyData = {
            name: name,
            costs: costs,
            email: email
        };

        //add the delivery company
        const deliveryCompanyDocument = await database.collection("deliverycompanies").add(deliveryCompanyData);
        await log(database, "ADD", `deliverycompanies/${deliveryCompanyDocument.id}`, deliveryCompanyData, decodedToken.uid);

        //send a response
        res.status(201).json({message: "Successfully added"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}


//  @desc   admin deletes a specific delivery company
//  @route  DELETE  /api/deliverycompanies/:deliveryCompanyID
export const deleteDeliveryCompany = async (req, res) => {
    const token = req.headers.authorization;
    const deliveryCompanyID = req.params.deliveryCompanyID;
    

    //add the product
    try {
        //token check
        const tokenCondition = (decodedToken, tokenRole, isUser, userData) => tokenRole === "admin";
        const { decodedToken, tokenRole, isUser } = decodeToken(admin, database, token, tokenCondition);

        //get the delivery company
        const deliveryCompanyReference = userReference.collection("deliverycompanies").doc(deliveryCompanyID);
        const deliveryCompanyDocument = await deliveryCompanyReference.get();
        if (!deliveryCompanyDocument.exists)
            throw createError(`A delivery company with the id of ${deliveryCompanyID} was not found`, 404);

        //delete the delivery company
        await database.collection("users").doc(deliveryCompanyID).delete();
        await log(database, "DELETE", `deliverycompanies/${deliveryCompanyDocument.id}`, null, decodedToken.uid);

        //send a response
        res.status(200).json({message: "Successfully deleted"});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);

        //send a response
        res.status(status).json({message: message});
    }
}