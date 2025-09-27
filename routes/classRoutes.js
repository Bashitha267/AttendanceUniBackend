import { Router } from "express";
import { addClass, getAllClasses, getIncompleteClasses, markClassAsComplete } from "../controllers/ClassController.js";

const router=Router()

router.post('/addClass',addClass)
router.get('/getAll',getAllClasses)
router.get('/getActive',getIncompleteClasses)
router.patch("/setComplete/:_id", markClassAsComplete);

export default router;