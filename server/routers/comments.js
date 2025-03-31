import express from "express";
import { addComment, setComment } from "../controllers/comments.js";


//initialize apps
//-express
const router = express.Router();


//handle requests
//-post
router.post("/", addComment);
//-put
router.delete("/:commentID", setComment);


export default router;