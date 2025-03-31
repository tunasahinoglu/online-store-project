import express from "express";
import { setProduct, deleteProduct } from "../controllers/products.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-put
router.put("/:productID", setProduct);
//-delete
router.delete("/:productID", deleteProduct);


export default router;