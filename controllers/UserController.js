import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
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
    const user=await User.create({name,email,password,dob,reg_no,gender,role,contact_no,img,password:hashedPassWord})
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
const user=await User.find({},"name email contact_no")
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

//send mail
function SendMail(req, res) {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "OTP for registration",
    text: `Your OTP is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      res.status(400).json({ message: error.message });
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).json({ message: "OTP sent successfully", otp: otp });
    }
  });
}

const UserController = {
  Login,
  Signup,
  ForgotPassword,
  EditUserDetails,
  SendMail,
  AdminApprove,
  getUsers
};

export default UserController;
