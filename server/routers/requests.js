import express from "express";
import { addRequest } from "../controllers/requests.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-post
router.post("/", addRequest);


export default router;