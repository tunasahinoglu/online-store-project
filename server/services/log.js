const log = async (database, method, document, data, user) => {
    await database.collection("logs").add({
        user: user,
        method: method,
        document: document,
        data: data,
        date: Date()
    });
};


export default log;