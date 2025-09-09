import { Router } from "express";
// 1. Correct the import path to point to your subject controller
import { createSubject, deleteSubjects, enrollMultipleStudents, enrollStudent, getSubjects } from "../controllers/SubjectController.js";

const router = Router();

// 2. The route is now simply '/', because the '/api/subjects' prefix
// will be added in your main server file.
router.post('/create', createSubject);
router.post("/:subjectCode/enroll/:reg_no", enrollStudent);

// Enroll multiple students
router.post("/:subjectCode/:batchYear/:year/enroll", enrollMultipleStudents);
// You can add other routes for this resource here, for example:
// router.get('/', getAllSubjects);
// router.get('/:id', getSubjectById);
router.get("/getsubjects",getSubjects)
router.delete("/deletesubjects",deleteSubjects)
export default router;