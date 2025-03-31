import admin from "../services/auth.js"
import log from "../services/log.js";


//initialize apps
//-firebase
const database = admin.firestore();


//  @desc   creates account
//  @route  POST  /api/auth/signup
export const createAccount = async (req, res, next) => {
    const { firstname, lastname, email, password, country, city, address, basket } = req.body;

    if (firstname === undefined || lastname === undefined || email === undefined || password === undefined || country === undefined || city === undefined || address === undefined) {
        const error = new Error("All fields are required");
        error.status = 400;
        return next(error);
    } else if (typeof firstname !== "string" || !firstname.trim()) {
        const error = new Error("Please enter a valid firstname");
        error.status = 400;
        return next(error);
    } else if (typeof lastname !== "string" || !lastname.trim()) {
        const error = new Error("Please enter a valid lastname");
        error.status = 400;
        return next(error);
    } else if (typeof email !== "string" || !email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        const error = new Error("Please enter a valid email address");
        error.status = 400;
        return next(error);
    } else if (typeof password !== "string" || password.trim().length < 6) {
        const error = new Error("Password must be at least 6 characters");
        error.status = 400;
        return next(error);
    } else if (typeof country !== "string" || !country.trim()) {
        const error = new Error("Please enter a valid country");
        error.status = 400;
        return next(error);
    } else if (typeof city !== "string" || !city.trim()) {
        const error = new Error("Please enter a valid city");
        error.status = 400;
        return next(error);
    } else if (typeof address !== "string" || !address.trim()) {
        const error = new Error("Please enter a valid address");
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
        log(database, "SET", `users/${user.uid}`, userData, user.uid);

        //add its basket to the database
        let invalidProduct = false;
        if (basket || typeof basket === "object") {
            for (let [productID, count] of Object.entries(basket)) {
                //product check
                if (typeof productID !== 'string' || !Number.isInteger(count) || count <= 0) {
                    invalidProduct = true;
                    continue;
                }
                const productReference = database.collection("products").doc(productID);
                const product = await productReference.get();
                if (!product.exists || product.exists && (product.data().price === 0 || count > product.data().stock)) {
                    invalidProduct = true;
                    continue;
                }

                const basketReference = userReference.collection("basket").doc(productID);
                try {
                    const productData = {count: count};
                    await basketReference.set(productData);
                    log(database, "SET", `users/${user.uid}/basket/${productID}`, productData, user.uid);
                } catch (error) {
                    invalidProduct = true;
                }
            };
        }

        //return response
        res.status(201).json({
            message: "Successfully set",
            alert: invalidProduct ? "Some products in your basket may get lost" : "",
            token: token,
        });
    } catch (error) {
        console.log(error);
        //extract error message and return response
        let message = "Registration failed. Please try again.";
        let status = 500;
        switch (error.code) {
            case "auth/email-already-exists":
                message = "This email is already registered";
                status = 400;
                break;
            case "auth/invalid-email":
                message = "Please enter a valid email address";
                status = 400;
                break;
            case "auth/weak-password":
                message = "Password should be at least 6 characters";
                status = 400;
                break;
        }
        res.status(status).json({
          message: message
        });
    }
};