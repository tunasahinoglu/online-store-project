import express from "express";
import { addRequest, setRequest } from "../controllers/requests.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-post
router.post("/", addRequest);
//-put
router.put("/:requestID", setRequest);


export default router;