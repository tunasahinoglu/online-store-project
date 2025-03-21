import { auth, database } from "../../services/firebase/connect.js"
import { onAuthStateChanged, createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";


/* parameters */
//redirection parameters
let redirectionType = "auth"

//GET parameters
const urlParameters = new URLSearchParams(window.location.search);
let returnURL = urlParameters.get("returnURL")
let tab = urlParameters.get("tab");

//form/tab references
const loginForm = document.querySelector("#login-form")
const signupForm = document.querySelector("#signup-form")
const loginTab = document.querySelector("#login-tab")
const signupTab = document.querySelector("#signup-tab")


/* functions */
//to update url
function updateURL() {
    const newURL = `${window.location.pathname}?${urlParameters.toString()}`
    window.history.replaceState(null, "", newURL);
}

//to redirect after login
function redirect() {
    document.getElementById("login-form").hidden = true
    document.getElementById("signup-form").hidden = true
    document.getElementById("error-label-auth").hidden = false
    document.getElementById("info-auth").hidden = false

    setTimeout(() => window.location.assign(returnURL), 2500)
}

// to switch between login and sign up
function switchForm(type) {
        document.getElementById("login-form").hidden = type === "login" ? false : true
        document.getElementById("signup-form").hidden = type === "login" ? true : false

        tab = type
        urlParameters.set("tab", type)
        updateURL()
}

/* code */
//to validate/correct GET parameters
if (!returnURL) {returnURL = "../../../"; urlParameters.set("returnURL", returnURL)}
if (!tab || (tab !== "login" && tab !== "signup")) {tab = "login"; urlParameters.set("tab", tab)}
updateURL()

/* listeners */
//to check whether already signed in
onAuthStateChanged(auth, (user) => {

    if (user) {
        getDoc(doc(database, "users", user.uid))
        .then((userDocument) => {
            if (userDocument.exists()) {
                if (redirectionType == "auth") {
                    redirect();
                };
            }
            else {deleteUser(user);}
        })
        .catch((error) => console.log(error))
    } else {switchForm(tab);}
});

//to perform switch between tabs
loginTab.addEventListener("click", () => {if (auth.currentUser == null) {switchForm("login");};});
signupTab.addEventListener("click", () => {if (auth.currentUser == null) {switchForm("signup");};});

//to perform database related login operation
loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    let isValid = true

    // values
    const email = loginForm.elements["email-entry-login"].value
    const password = loginForm.elements["password-entry-login"].value

    // labels
    const loginFormLabel = loginForm.querySelector("#error-label-login")
    loginFormLabel.innerHTML = ""
    const emailLabel = loginForm.elements["email-entry-login"].labels[0]
    const passwordLabel = loginForm.elements["password-entry-login"].labels[0]

    // validation
    if (!email) {
        isValid = false
        emailLabel.innerHTML = "Email field cannot be empty"
    } else {emailLabel.innerHTML = ""}

    if (!password) {
        isValid = false
        passwordLabel.innerHTML = "Password field cannot be empty"
    } else {passwordLabel.innerHTML = ""}

    // to login
    if (isValid) {
        redirectionType = "login"
        signInWithEmailAndPassword(auth, email, password).then(() => {
            redirect();
        })
        .catch((error) => {
            redirectionType = "auth"
            if (error.code === "auth/invalid-login-credentials" || error.code === "auth/invalid-email" || error.code === "auth/invalid-password") {
                loginFormLabel.innerHTML = "Invalid email or password"
            }
            else {console.log(error);}
        });
    }
});

// to perform database related sign-up operation
signupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    let isValid = true

    //values
    const firstName = signupForm.elements["firstName-entry"].value
    const lastName = signupForm.elements["lastName-entry"].value
    const country = signupForm.elements["country-entry"].value
    const city = signupForm.elements["city-entry"].value
    const address = signupForm.elements["address-entry"].value
    const email = signupForm.elements["email-entry-signup"].value
    const password = signupForm.elements["password-entry-signup"].value

    //labels
    const signupFormLabel = signupForm.querySelector("#error-label-signup")
    const firstNameLabel = signupForm.elements["firstName-entry"].labels[0]
    const lastNameLabel = signupForm.elements["lastName-entry"].labels[0]
    const countryLabel = signupForm.elements["country-entry"].labels[0]
    const cityLabel = signupForm.elements["city-entry"].labels[0]
    const addressLabel = signupForm.elements["address-entry"].labels[0]
    const emailLabel = signupForm.elements["email-entry-signup"].labels[0]
    const passwordLabel = signupForm.elements["password-entry-signup"].labels[0]

    //to clear previous error message
    signupFormLabel.innerHTML = ""

    //validation
    if (!firstName) {
        isValid = false
        firstNameLabel.innerHTML = "First Name field cannot be empty"
    } else {firstNameLabel.innerHTML = ""}

    if (!lastName) {
        isValid = false
        lastNameLabel.innerHTML = "Last Name field cannot be empty"
    } else {lastNameLabel.innerHTML = ""}

    if (!country) {
        isValid = false
        countryLabel.innerHTML = "Country field cannot be empty"
    } else {countryLabel.innerHTML = ""}

    if (!city) {
        isValid = false
        cityLabel.innerHTML = "City field cannot be empty"
    } else {cityLabel.innerHTML = ""}

    if (!address) {
        isValid = false
        addressLabel.innerHTML = "Address field cannot be empty"
    } else {addressLabel.innerHTML = ""}

    if (!email) {
        isValid = false
        emailLabel.innerHTML = "Email field cannot be empty"
    } else if (!email.match(/.+@.+[.].+/)) {
        isValid = false
        emailLabel.innerHTML = "Email format should be email@domain.com"
    } else {emailLabel.innerHTML = ""}

    if (!password) {
        isValid = false
        passwordLabel.innerHTML = "Password field cannot be empty"
    } else if (password.length < 6) {
        isValid = false
        passwordLabel.innerHTML = "Password must be at least six-character long"
    } else {passwordLabel.innerHTML = ""}

    //to sign up
    if (isValid) {
        redirectionType = "signup"
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            setDoc(doc(database, "users", user.uid), {
                firstname: firstName,
                lastname: lastName,
                email: email,
                role: "customer",
                address: {
                    country: country,
                    city: city,
                    address: address,
                },
                wishlist: []
            })
            .then(() => {
                const authErrorLabel = document.querySelector("#error-label-auth")
                const basket = localStorage.getItem("basket") ? new Map(Object.entries(JSON.parse(localStorage.getItem("basket")))) : new Map();
                if (basket.size > 0) {
                    basket.forEach((count, productID) => {
                        setDoc(doc(database, "users", user.uid, "basket", productID), {
                            count: count
                        })
                        .catch((error) => {
                            authErrorLabel.innerHTML = "Some products in your basket may get lost";
                            console.log(error);
                        });
                    });
                    localStorage.removeItem("basket");
                }
                redirect();
            })
            .catch((error) => {
                redirectionType = "auth"
                deleteUser(user);
                signupFormLabel.innerHTML = "Account cannot be created, try again later";
                console.log(error);
            });
        })
        .catch((error) => {
            redirectionType = "auth"
            if (error.code === "auth/email-already-in-use") {
                emailLabel.innerHTML = "Email address is already in use";
            } else if (error.code === "auth/invalid-email") {
                emailLabel.innerHTML = "Invalid email address";
            } else {
                signupFormLabel.innerHTML = "Account cannot be created, try again later";
                console.log(error);
            }
        });
    }
});