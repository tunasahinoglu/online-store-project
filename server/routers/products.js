import express from "express";
import { addProduct, setProduct, deleteProduct } from "../controllers/products.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-post
router.post("/", addProduct);
//-put
router.put("/:productID", setProduct);
//-delete
router.delete("/:productID", deleteProduct);


export default router;