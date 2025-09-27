import { Router } from "express";
import { addClass, deleteAll, getAllClasses, getIncompleteClasses, markAttendance, markClassAsComplete } from "../controllers/ClassController.js";

const router=Router()

router.post('/addClass',addClass)
router.get('/getAll',getAllClasses)
router.get('/getActive',getIncompleteClasses)
router.patch("/setComplete/:_id", markClassAsComplete);
router.delete('/deleteAll',deleteAll)
router.post('/addattendance/:_id',markAttendance)
export default router;