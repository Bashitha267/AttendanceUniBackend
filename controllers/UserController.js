import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import transporter from "../middleware/Mailer.js";
import { Teacher } from "../model/Teacher.js";
import { User } from "../model/User.js";
dotenv.config();

//login
async function Login(req, res) {
  const { email, password } = req.body;
  
  //check if user is a student
  let user = await User.findOne({ email });
  

  if (user) {
   if(user.isApproved){
      const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({reg_no:user.reg_no,email:user.email,role:user.role,name:user.name,image:user.image,gender:user.gender},process.env.JWT_SECRET,{expiresIn:"7d"});
      
        res.cookie('token',token,{
            httpOnly:true,
        })
        res.status(200).json({
  message: "Login successful",
  success:true,
  token,
});
    } else {
      res.status(400).json({ success:false,message: "Invalid  password" });
    }
   }
   else{
    res.status(400).json({ success:false,message: "Admin not approved.Try again later" });
   }
  
  } else {
    res.status(400).json({ success:false,message: "No such User" });
  }


}
// Create a new user
async function Signup(req, res) {
  const {name,email,password,role,dob,reg_no,gender,contact_no,img } = req.body;
    if(!name||!email||!password||!role||!dob||!reg_no|!gender||!contact_no){
      return res.json({message:"Missing Credentials"})
    }
    try{
      const existingUser=await User.findOne({email});
    const exisitingReg=await User.findOne({reg_no})
    if(existingUser){
      return res.json({message:"Email  already registered"});
    }
    if(exisitingReg){
      return res.json({message:"Registration number  already registered"});
      
    }
    const hashedPassWord=await bcrypt.hash(password,10)
    const otp = Math.floor(100000 + Math.random() * 900000);
    const user=await User.create({name,email,password,dob,reg_no,gender,role,contact_no,img,password:hashedPassWord,otp:otp})
 
      const mailOptions = {
      from: process.env.EMAIL, // use your env variable
      to: email,               // now dynamic
      subject: "OTP Verification",
      text: `Hello! Your OTP code is ${user.otp}`,
    };

    // use await instead of callback
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent:", info.response);

    // return res.json({
    //   success: true,
    //   message: "Verification email sent",
    //   otp, // ⚠️ remove in production, store securely instead
    // });
    await user.save()
    const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
    res.cookie('token',token)
    return res.json({success:true})

    }
    catch(e){
      res.json({message:e})
    }

}
//admin approve
async function AdminApprove(req,res) {
  const {reg_no}=req.params
  const existingUser=await User.findOne({ reg_no: reg_no.trim() })
  try{
       if(existingUser){
          if(existingUser.isApproved){
            return  res.json({message:"User Already Registered"})
          }
          else{
             existingUser.isApproved=true;
             await existingUser.save();
             return res.json({ message: "User approved successfully" });
            

          }
      } 
      else{
        return res.json({ message: "User not found" });
      }
       
  }
 
  
  catch(e){
        return res.json({message:e})

  }
  
}

//getusers for testing
async function getUsers(req,res) {
  try{
const user=await User.find({},"name email contact_no reg_no")
return   res.json({message:"success",user})
  }catch(e){
    return res.json({message:e})
  }
  
  
}
//change password
async function ForgotPassword(req, res) {
  const { email, password } = req.body;
  //check if user is a student
  let user = await User.findOneAndUpdate({ email }, { password }).exec();
  if (!user) {
    user = await Teacher.findOneAndUpdate({ email }, { password }).exec();
  }
  if (user) {
    res.status(200).json({ message: "Password changed successfully" });
  } else {
    res.status(400).json({ message: "No such User" });
  }
}

//edit user details
async function EditUserDetails(req, res) {
  const { email, name, pno, dob } = req.body;
  //check if user is a student
  let user = await User.findOne
    .findOneAndUpdate({ email }, { name, pno, dob })
    .exec();
  if (!user) {
    user = await Teacher.findOneAndUpdate
      .findOneAndUpdate({ email }, { name, pno, dob })
      .exec();
  }
  if (user) {
    res.status(200).json({ message: "User updated" });
  }
}
// DELETE all users
async function DeleteAllUsers(req, res) {
  try {
    await User.deleteMany({}); // removes all documents from User collection

    res.status(200).json({ message: "All users deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting users", error: err.message });
  }
}


//send mail
async function SendMail(req, res) {
  try {
    const { email,otp } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const user=await User.findOne({email})
    if(!user){
      return res.status(400).json({ success: false, message: "No user found" });
    }
    if(user.otp===otp){
       return res.status(200).json({ success: success, message: "Verification Success.Pending Admin Approved" });
    }
    

    

    

  } catch (error) {
    return res.status(400).json({ success: false, message: error })
  }
}

const UserController = {
  Login,
  Signup,
  ForgotPassword,
  EditUserDetails,
  SendMail,
  AdminApprove,
  getUsers,
  DeleteAllUsers
};

export default UserController;
