import express from "express";
import { setProduct, setUser, deleteProduct, setNotification } from "../controllers/users.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-put
router.put("/:userID", setUser);
router.put("/:userID/basket/:productID", setProduct);
router.put("/:userID/notifications/:notificationID", setNotification);
//-delete
router.delete("/:userID/basket/:productID", deleteProduct);


export default router;