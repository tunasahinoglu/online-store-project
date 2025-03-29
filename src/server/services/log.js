const log = (database, method, document, user) => {
    database.collection("logs").add({
        user: user,
        method: method,
        document: document
    });
};

export default log;