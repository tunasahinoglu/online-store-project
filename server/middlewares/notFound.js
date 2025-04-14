import url from "url";
import path from "path";


//set constants
//-path 
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const notFoundHandler = (req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) {
        const error = new Error("API is not found");
        error.status = 404;
        next(error);
    } else {
        res.sendFile(path.join(__dirname, "../../dist", "index.html"));
    }
};
    
export default notFoundHandler;