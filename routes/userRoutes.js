import { Router } from "express";
import UserController from "../controllers/UserController.js";
const router = Router();

//login
router.post("/login", UserController.Login);
// Create a new user
router.post("/signup", UserController.Signup);
// getuser
router.get('/getusers',UserController.getUsers)
// forgot password
router.post("/forgotpassword", UserController.ForgotPassword);
router.put('/approve/:reg_no',UserController.AdminApprove)
router.delete('/deleteUsers',UserController.DeleteAllUsers)
//edit user details
// router.post(
//   "/edituserdetails",
//   JWT.verifyToken,
//   UserController.EditUserDetails
// );
// send mail
router.post("/sendmail", UserController.SendMail);

export default router;
