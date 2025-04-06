import express from "express";
import { createAccount } from "../controllers/auth.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-post
router.post("/signup", createAccount);


export default router;