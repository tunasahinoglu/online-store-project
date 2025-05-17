const addLog = async (database, method, document, oldData, newData, user) => {
    await database.collection("logs").add({
        user: user,
        method: method,
        document: document,
        olddata: oldData,
        newdata: newData,
        date: Date()
    });
};


export default addLog;