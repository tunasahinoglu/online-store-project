import express from "express";
import { setProduct, setUser, deleteProduct } from "../controllers/users.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-put
router.put("/:userID", setUser);
router.put("/:userID/basket/:productID", setProduct);
//-delete
router.delete("/:userID/basket/:productID", deleteProduct);


export default router;