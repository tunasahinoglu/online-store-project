import { signInWithCustomToken, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

export const signUp = async (auth, firstname, lastname, email, password, country, city, address) => {
    //send request to register
    const res = await fetch("http://localhost:5001/api/auth/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: password,
            role: "customer",
            country: country,
            city: city,
            address: address
        })
    })

    const response = await res.json();
    if (!res.ok) {throw new Error(response.message)}

    //sign in with the custom token
    signInWithCustomToken(auth, response.token);
    
    if (response.alert) {alert(response.alert);}
}

export const signIn = async (auth, email, password) => signInWithEmailAndPassword(auth, email, password);