import { app, auth, database } from "/src/services/firebase/connect.js"
import { onAuthStateChanged, createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { mapToUser } from "/src/models/user_model.js"


// get parameters
const urlParameters = new URLSearchParams(window.location.search);
let returnURL = urlParameters.get("returnURL")
let tab = urlParameters.get("tab");

if (!returnURL) {returnURL = "index.html"; urlParameters.set("returnURL", returnURL)}
if (!tab || (tab !== "login" && tab !== "signup")) {tab = "login"; urlParameters.set("tab", tab)}

//to update url
function updateURL() {
    const newURL = `${window.location.pathname}?${urlParameters.toString()}`
    window.history.replaceState(null, "", newURL);
}
updateURL()


//to redirect after login
function redirect() {
    document.getElementById("login-form").hidden = true
    document.getElementById("signup-form").hidden = true
    document.getElementById("auth-info").hidden = false

    setTimeout(() => window.location.assign(returnURL), 2500)
}


//to check whether already signed in
onAuthStateChanged(auth, (user) => {

    if (user) {
        getDoc(doc(database, "users", user.uid))
        .then((userDocument) => {
            if (userDocument.exists()) {redirect()}
            else {deleteUser(user)}
        })
        .catch((error) => console.log(error.code))
    } else {switchForm(tab)}
});


// to switch between login and sign up
function switchForm(type) {
        document.getElementById("login-form").hidden = type === "login" ? false : true
        document.getElementById("signup-form").hidden = type === "login" ? true : false

        tab = type
        urlParameters.set("tab", type)
        updateURL()
}


// form/tab references
const loginForm = document.querySelector("#login-form")
const signupForm = document.querySelector("#signup-form")
const loginTab = document.querySelector("#login-tab")
const signupTab = document.querySelector("#signup-tab")

//to perform switch between tabs
loginTab.addEventListener("click", () => switchForm("login"));
signupTab.addEventListener("click", () => switchForm("signup"));

// to perform database related login operation
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
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {

        })
        .catch((error) => {
            console.log(error.code)
            if (error.code === "auth/invalid-login-credentials") {
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

    // values
    const firstName = signupForm.elements["firstName-entry"].value
    const lastName = signupForm.elements["lastName-entry"].value
    const country = signupForm.elements["country-entry"].value
    const city = signupForm.elements["city-entry"].value
    const address = signupForm.elements["address-entry"].value
    const email = signupForm.elements["email-entry-signup"].value
    const password = signupForm.elements["password-entry-signup"].value

    // labels
    const signupFormLabel = signupForm.querySelector("#error-label-signup")
    signupFormLabel.innerHTML = ""
    const firstNameLabel = signupForm.elements["firstName-entry"].labels[0]
    const lastNameLabel = signupForm.elements["lastName-entry"].labels[0]
    const countryLabel = signupForm.elements["country-entry"].labels[0]
    const cityLabel = signupForm.elements["city-entry"].labels[0]
    const addressLabel = signupForm.elements["address-entry"].labels[0]
    const emailLabel = signupForm.elements["email-entry-signup"].labels[0]
    const passwordLabel = signupForm.elements["password-entry-signup"].labels[0]

    // validation
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
    } else {emailLabel.innerHTML = ""}

    if (!password) {
        isValid = false
        passwordLabel.innerHTML = "Password field cannot be empty"
    } else if (password.length < 6) {
        isValid = false
        passwordLabel.innerHTML = "Password must be at least six-character long"
    } else {passwordLabel.innerHTML = ""}

    // to sign up
    if (isValid) {
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {

            const user = userCredential.user;
            const basket = localStorage.getItem("basket") ? JSON.parse(localStorage.getItem("basket")) : {products: [], counts: {}};

            setDoc(doc(database, "users", user.uid), mapToUser(firstName, lastName, email, country, city, address, basket))
            .then(() => {localStorage.removeItem("basket"); redirect();})
            .catch((error) => {
                deleteUser(user);
                signupFormLabel.innerHTML = "Account cannot be created, try again later";
                console.log(error);
            });
        })
        .catch((error) => {
            if (error.code === "auth/email-already-in-use") {
                emailLabel.innerHTML = "Email is already in use";
            } else {
                signupFormLabel.innerHTML = "Account cannot be created, try again later";
                console.log(error);
            }
        });
    }
});