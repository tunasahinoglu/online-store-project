import express from "express";
import { checkBasket, setUser, setProduct, deleteProduct, setNotification } from "../controllers/users.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-get
router.get("/:userID/basket-check", checkBasket);
//-put
router.put("/:userID", setUser);
router.put("/:userID/basket/:productID", setProduct);
router.put("/:userID/notifications/:notificationID", setNotification);
//-delete
router.delete("/:userID/basket/:productID", deleteProduct);


export default router;