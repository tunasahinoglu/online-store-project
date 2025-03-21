import { app, auth, database } from "../../services/firebase/connect.js"
import { onAuthStateChanged, createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { mapToUser } from "../../models/user_model.js"


// get parameters
const urlParameters = new URLSearchParams(window.location.search);
let returnURL = urlParameters.get("returnURL")
let tab = urlParameters.get("tab");

if (!returnURL) {returnURL = "/"; urlParameters.set("returnURL", "/")}
if (!tab || (tab !== "login" && tab !== "signup")) {tab = "login"; urlParameters.set("tab", "login")}

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


    const emailInput = loginForm.elements["email-entry-login"]
    const passwordInput =loginForm.elements["password-entry-login"]
    // values
    const email = emailInput.value
    const password = passwordInput.value

    // labels
    const loginFormLabel = loginForm.querySelector("#error-label-login")
    loginFormLabel.innerHTML = ""
    const emailLabel = emailInput.nextElementSibling;
    const passwordLabel = passwordInput.nextElementSibling;


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
signupForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent default form submission

    let isValid = true;

    // Get input fields
    const inputs = {
        firstName: document.getElementById("firstName-entry"),
        lastName: document.getElementById("lastName-entry"),
        country: document.getElementById("country-entry"),
        city: document.getElementById("city-entry"),
        address: document.getElementById("address-entry"),
        email: document.getElementById("email-entry-signup"),
        password: document.getElementById("password-entry-signup"),
    };

    const signupFormLabel = signupForm.querySelector("#error-label-signup")
    signupFormLabel.innerHTML = ""
    // Reset errors
    Object.values(inputs).forEach(input => {
        input.classList.remove("error");
        input.nextElementSibling.innerHTML = "";
    });

    // Validation
    if (!inputs.firstName.value.trim()) {
        isValid = false;
        showError(inputs.firstName, "First Name is required");
    }

    if (!inputs.lastName.value.trim()) {
        isValid = false;
        showError(inputs.lastName, "Last Name is required");
    }

    if (!inputs.country.value.trim()) {
        isValid = false;
        showError(inputs.country, "Country is required");
    }

    if (!inputs.city.value.trim()) {
        isValid = false;
        showError(inputs.city, "City is required");
    }

    if (!inputs.address.value.trim()) {
        isValid = false;
        showError(inputs.address, "Address is required");
    }

    if (!inputs.email.value.trim()) {
        isValid = false;
        showError(inputs.email, "Email is required");
    } else if (!/\S+@\S+\.\S+/.test(inputs.email.value)) {
        isValid = false;
        showError(inputs.email, "Enter a valid email");
    }

    if (!inputs.password.value.trim()) {
        isValid = false;
        showError(inputs.password, "Password is required");
    } else if (inputs.password.value.length < 6) {
        isValid = false;
        showError(inputs.password, "Password must be at least 6 characters");
    }

    // Submit if valid
    if (isValid) {
        createUserWithEmailAndPassword(auth, inputs.email.value, inputs.password.value)
            .then((userCredential) => {
                const user = userCredential.user;
                const basket = localStorage.getItem("basket") 
                    ? JSON.parse(localStorage.getItem("basket")) 
                    : {products: [], counts: {}};

                setDoc(doc(database, "users", user.uid), mapToUser(
                    inputs.firstName.value, 
                    inputs.lastName.value, 
                    inputs.email.value, 
                    inputs.country.value, 
                    inputs.city.value, 
                    inputs.address.value, 
                    basket
                )).then(() => {
                    localStorage.removeItem("basket");
                    redirect();
                }).catch((error) => {
                    deleteUser(user);
                    showError(signupForm, "Account cannot be created, try again later");
                    console.log(error);
                });
            })
            .catch((error) => {
                if (error.code === "auth/email-already-in-use") {
                    showError(inputs.email, "Email is already in use");
                } else {
                    signupFormLabel.innerHTML="Account cannot be created, try again later"
                    console.log(error);
                }
            });
    }
});

// Function to show errors
function showError(inputElement, message) {
    const errorLabel = inputElement.nextElementSibling;
    errorLabel.innerHTML = message;
    inputElement.classList.add("error");
}
