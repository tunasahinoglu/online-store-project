import express from "express";
import { addDeliveryCompany, deleteDeliveryCompany } from "../controllers/deliveryCompanies.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-post
router.post("/", addDeliveryCompany);
//-delete
router.delete("/:deliveryCompanyID", deleteDeliveryCompany);


export default router;