import express from "express";
import auth from "./routers/auth.js"
import user from "./routers/users.js"
import errorHandler from "./middlewares/error.js"
import cors from "cors";


//set constants
//-secrets
const port = process.env.PORT;


//initialize apps
//-express
const app = express();


//common middlewares
app.use(cors({
    origin: "http://localhost:5173", // Allow your frontend origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true // Allow cookies if needed
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


//routing
//-auth
app.use("/api/auth", auth);
//-users
app.use("/api/users", user)


//error handling middlewares
app.use(errorHandler);


//listen the port
app.listen(port, () => console.log(`Server is running on the port ${port}`));