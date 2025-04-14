import express from "express";
import { addOrder, setOrder } from "../controllers/orders.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-post
router.post("/", addOrder);
//-put
router.put("/:orderID", setOrder);


export default router;