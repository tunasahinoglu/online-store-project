const log = (database, method, document, data, user) => {
    database.collection("logs").add({
        user: user,
        method: method,
        document: document,
        data: data,
        date: Date()
    });
};

export default log;