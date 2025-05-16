import express from "express";
import auth from "./routers/auth.js"
import user from "./routers/users.js"
import deliveryCompany from "./routers/deliveryCompanies.js"
import product from "./routers/products.js"
import order from "./routers/orders.js"
import request from "./routers/requests.js"
import comment from "./routers/comments.js"
import notFoundHandler from "./middlewares/notFound.js"
import logHandler from "./middlewares/log.js"
import cors from "cors";
import url from "url";
import path from "path";


//set constants
//-path 
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//-secrets
const port = process.env.PORT || 5001;


//initialize apps
//-express
const app = express();


//common middlewares
app.use(cors({origin: "http://localhost:5173", methods: "GET,PUT,POST,DELETE", credentials: true}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logHandler);


//routing
//-index.html
// app.use(express.static(path.join(__dirname, "../dist")));
//-auth
app.use("/api/auth", auth);
//-users
app.use("/api/users", user);
//-deliverycompanies
app.use("/api/deliverycompanies", deliveryCompany);
//-products
app.use("/api/products", product);
//-orders
app.use("/api/orders", order);
//-requests
app.use("/api/requests", request);
//-comments
app.use("/api/comments", comment);


//error handling middlewares
app.use(notFoundHandler);


//listen the port
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));