import admin from "../services/auth.js"
import { createError, extractError } from "../services/error.js";
import addLog from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   creates account
//  @route  POST  /api/auth/signup
export const createAccount = async (req, res) => {
    const { firstname, lastname, email, password, country, city, address } = req.body;


    //user creation
    try {
        //input check
        if (firstname === undefined || lastname === undefined || email === undefined || password === undefined || country === undefined || city === undefined || address === undefined)
            throw createError("All fields are required", 400);
        else if (typeof firstname !== "string" || !firstname.trim())
            throw createError("Please enter a valid firstname", 400);
        else if (typeof lastname !== "string" || !lastname.trim())
            throw createError("Please enter a valid lastname", 400);
        else if (typeof email !== "string" || !email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
            throw createError("Please enter a valid email address", 400);
        else if (typeof password !== "string" || password.trim().length < 6)
            throw createError("Password must be at least 6 characters", 400);
        else if (typeof country !== "string" || !country.trim())
            throw createError("Please enter a valid country", 400);
        else if (typeof city !== "string" || !city.trim())
            throw createError("Please enter a valid city", 400);
        else if (typeof address !== "string" || !address.trim())
            throw createError("Please enter a valid address", 400);

        //create token
        const user = await admin.auth().createUser({
            email: email,
            password: password
        });
        const token = await admin.auth().createCustomToken(user.uid);

        //add the user to the database
        const userReference = database.collection("users").doc(user.uid);
        const userData = {
            firstname: firstname,
            lastname: lastname,
            email: email,
            role: "customer",
            address: {
                country: country,
                city: city,
                address: address
            },
            active: true,
            wishlist: []
        };
        await userReference.set(userData);
        await addLog(database, "ADD", userReference.path, null, userData, user.uid);

        //return a response
        console.log("Response: Successfully added");
        res.status(201).json({message: "Successfully added", token: token});
    } catch (error) {
        //handle error
        const { message, status } = extractError(error);
        
        //send a response
        res.status(status).json({message: message});
    }
};