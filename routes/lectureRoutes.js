import { Router } from "express";
import getSubjectsByLecturer from "../controllers/lectureController.js";
const router = Router();
router.get('/getsubjects/:lec_id',getSubjectsByLecturer);
export default router;