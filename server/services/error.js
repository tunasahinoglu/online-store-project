export const createError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    return error;
}


export const extractError = (error) => {
    console.error(error.message || error);
        
    //extract error message and return 
    let message = "Internal server error", status = 500;

    switch (error.code) {
        case "auth/id-token-expired":
            message = "Invalid or expired token"; status = 401;
            break;
        case "auth/email-already-exists":
            message = "This email is already registered"; status = 400;
            break;
        case "auth/invalid-email":
            message = "Please enter a valid email address"; status = 400;
            break;
        case "auth/weak-password":
            message = "Password should be at least 6 characters"; status = 400;
            break;
        default:
            message = error.message; status = error.status
            break;
    }

    return { message, status };
}