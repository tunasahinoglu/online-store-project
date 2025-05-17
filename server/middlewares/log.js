import colors from 'colors';


const logHandler = (req, res, next) => {
    const colorMap = {
        GET: "green",
        POST: "blue",
        PUT: "yellow",
        DELETE: "red",
    };
    const color = colorMap[req.method] || "white";
    console.log(`${req.method} => ${req.protocol}://${req.get('host')}${req.originalUrl}`[color]);
    next();
};


export default logHandler;