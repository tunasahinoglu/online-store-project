import { doc, getDoc, collection, getDocs, query, where, orderBy, startAfter, limit } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app, database } from "./connect.js"


export const get = async (path, selectConditions = null, whereConditions = null, orderByConditions = null, startAfterDocument = null, limitValue = null) => {
    //construct path and query reference
    path = path.split("/");
    const isDocument = path.length % 2 === 0;
    let queryReference;
    //document
    if (isDocument) {
        queryReference = doc(database, ...path);
        const snapshot = await getDoc(queryReference);
        return snapshot.exists() ? [{[document.id]:snapshot.data()}] : [];
    //collection
    } else {
        queryReference = collection(database, ...path);
        //apply queries
        if (whereConditions) {
            whereConditions.forEach(([field, operator, value]) => {
                queryReference = query(queryReference, where(field, operator, value));
            });
        }
        if (orderByConditions) {
            orderByConditions.forEach(([field, direction]) => {
                queryReference = query(queryReference, orderBy(field, direction));
            });
        }
        if (startAfterDocument) {
            queryReference = query(queryReference, startAfter(startAfterDocument));
        }
        if (limitValue) {
            queryReference = query(queryReference, limit(limitValue));
        }
        const snapshot = await getDocs(queryReference);
        return snapshot.docs.length > 0
            ? snapshot.docs.reduce((documents, document) => {
                documents.push({[document.id]:document.data()});
                return documents;
            }, [])
            : [];
    }
};


export const add = async (path, body) => {
    //send request to set
    const auth = getAuth(app);
    const user = auth.currentUser;
    const res = await fetch(`http://localhost:5000/api/${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "authorization": user ? user.accessToken : ""
        },
        body: JSON.stringify(body)
    })

    const response = await res.json();
    if (!res.ok) {throw new Error(response.message);}
    if (response.alert) {alert(response.alert);}
    return response.message;
};


export const set = async (path, body) => {
    //send request to set
    const auth = getAuth(app);
    const user = auth.currentUser;
    const res = await fetch(`http://localhost:5000/api/${path}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "authorization": user ? user.accessToken : ""
        },
        body: JSON.stringify(body)
    })

    const response = await res.json();
    if (!res.ok) {throw new Error(response.message);}
    if (response.alert) {alert(response.alert);}
    return response.message;
};


export const del = async (path) => {
    //send request to set
    const auth = getAuth(app);
    const user = auth.currentUser;
    const res = await fetch(`http://localhost:5000/api/${path}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "authorization": user ? user.accessToken : ""
        }
    })

    const response = await res.json();
    if (!res.ok) {throw new Error(response.message);}
    if (response.alert) {alert(response.alert);}
    return response.message;
};