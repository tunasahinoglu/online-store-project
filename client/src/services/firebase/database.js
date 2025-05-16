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
        return snapshot.exists() ? [{[snapshot.id]:snapshot.data()}] : [];
    //collection
    } else {
        queryReference = collection(database, ...path);
        //apply queries
        const constraints = [];
        if (whereConditions) {
          whereConditions.forEach(([field, operator, value]) => {
            constraints.push(where(field, operator, value));
          });
        }
        if (orderByConditions) {
          orderByConditions.forEach(([field, direction]) => {
            constraints.push(orderBy(field, direction));
          });
        }
        if (startAfterDocument) {
          constraints.push(startAfter(startAfterDocument));
        }
        if (limitValue) {
          constraints.push(limit(limitValue));
        }
        if (constraints.length > 0) {
          queryReference = query(queryReference, ...constraints);
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
    //send request to add
    const auth = getAuth(app);
    const user = auth.currentUser;
    const res = await fetch(`http://localhost:5001/api/${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "authorization": user ? await user.getIdToken(true) : ""
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
    const res = await fetch(`http://localhost:5001/api/${path}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "authorization": user ? await user.getIdToken(true) : ""
        },
        body: JSON.stringify(body)
    })

    const response = await res.json();
    if (!res.ok) {throw new Error(response.message);}
    if (response.alert) {alert(response.alert);}
    return response.message;
};


export const del = async (path) => {
    //send request to delete
    const auth = getAuth(app);
    const user = auth.currentUser;
    const res = await fetch(`http://localhost:5001/api/${path}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "authorization": user ? await user.getIdToken(true) : ""
        }
    })

    const response = await res.json();
    if (!res.ok) {throw new Error(response.message);}
    if (response.alert) {alert(response.alert);}
    return response.message;
};


export const basketCheck = async (path) => {
    //send request to get
    const auth = getAuth(app);
    const user = auth.currentUser;
    const res = await fetch(`http://localhost:5001/api/${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "authorization": user ? await user.getIdToken(true) : ""
        }
    });

    const response = await res.json();
    if (!res.ok) {throw new Error(response.message);}
    if (response.alert) {alert(response.alert);}
    return response.message;
};
