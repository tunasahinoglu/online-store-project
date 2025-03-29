import url from "url";
import path from "path";
import admin from "../services/auth.js"
import log from "../services/log.js";


//set constants
//-path 
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   creates account
//  @route  POST  /api/auth/signup
export const createAccount = async (req, res, next) => {
    const { firstname, lastname, email, password, role, country, city, address, basket } = req.body;
    
    //input validation
    if (!firstname || !lastname || !email || !password || !country || !city || !address) {
        const error = new Error("All fields are required");
        error.status = 400;
        return next(error);
    }
    if (password.length < 6) {
        const error = new Error("Password must be at least 6 characters");
        error.status = 400;
        return next(error);
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        const error = new Error("Please enter a valid email address");
        error.status = 400;
        return next(error);
    }

    //user creation
    try {
        //create token
        const user = await admin.auth().createUser({
            email: email,
            password: password
        });
        const token = await admin.auth().createCustomToken(user.uid);

        //add the user to the database
        const userReference = database.collection("users").doc(user.uid);
        await userReference.set({
            firstname: firstname,
            lastname: lastname,
            email: email,
            role: role,
            address: {
                country: country,
                city: city,
                address: address
            },
            wishlist: []
        });
        log(database, "CREATE", `users/${user.uid}`, user.uid);

        //add its basket to the database
        let invalidProduct = false;
        if (basket) {
            for (let [productID, count] of Object.entries(basket)) {
                //product check
                const productReference = database.collection("products").doc(productID);
                const product = await productReference.get();
                if (!product.exists) {
                    invalidProduct = true
                    continue
                }

                const basketReference = userReference.collection("basket").doc(productID);
                try {
                    await basketReference.set({
                        count: count
                    })
                }
                catch (error) {
                    invalidProduct = true;
                }
            };
        }

        //return response
        res.status(201).json({
            message: "User created successfully!",
            alert: invalidProduct ? "Some products in your basket may get lost" : "",
            token: token,
        });
    }
    catch (error) {
        console.log(error.code);
        //extract error message and return response
        let message = "Registration failed. Please try again.";
        switch (error.code) {
            case "auth/email-already-exists":
                message = "This email is already registered";
                break;
            case "auth/invalid-email":
                message = "Please enter a valid email address";
                break;
            case "auth/weak-password":
                message = "Password should be at least 6 characters";
                break;
        }
        res.status(500).json({
          message: message
        });
    }
};