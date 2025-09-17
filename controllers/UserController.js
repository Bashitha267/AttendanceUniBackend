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
  try {
    const { name, email, password, role, dob, reg_no, gender, contact_no, img } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role || !dob || !reg_no || !gender || !contact_no) {
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    // Check if email or reg_no already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const existingReg = await User.findOne({ reg_no });
    if (existingReg) {
      return res.status(400).json({ success: false, message: "Registration number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Create user
    const user = await User.create({
      name,
      email,
      dob,
      reg_no,
      gender,
      role,
      contact_no,
      img,
      password: hashedPassword,
      otp,
    });

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "OTP Verification",
      text: `Hello! Your OTP code is ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    // Save user and generate JWT
    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true });

    // Return success message
    return res.status(200).json({ success: true, message: "OTP sent to your email" });

  } catch (e) {
    console.error("Signup error:", e);
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
}

//admin approve
// Approve a user

async function AdminApprove(req, res) {
  try {
    const { reg_no } = req.params;
    if (!reg_no) {
      return res.status(400).json({ success: false, message: "Registration number is required" });
    }

    // update user
    const updatedUser = await User.findOneAndUpdate(
      { reg_no: reg_no.trim() },
      { isApproved: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (updatedUser.isApproved !== true) {
      return res.status(400).json({ success: false, message: "Approval failed" });
    }

    // send mail only after successful update
    try {
      const mailOptions = {  
        from: process.env.EMAIL,  
        to: updatedUser.email,  
        subject: "Registration Approved - Welcome to Our System",  
        html: `<h2>Registration Approved</h2>
               <p>Dear ${updatedUser.name},</p>
               <p>Your registration has been <strong>successfully approved</strong>.</p>
               <p>You can now log in using your registered email and password.</p>
               <p>Best regards,<br/>Admin / Attendo Registration</p>`
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({ success: true, message: "User approved successfully and email sent" });
    } catch (mailError) {
      console.error("Email sending error:", mailError);
      return res.status(500).json({ success: false, message: "User approved but email sending failed" });
    }

  } catch (error) {
    console.error("AdminApprove Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}



//getusers for testing
async function getUsers(req,res) {
  try{
const user=await User.find({},"name email contact_no reg_no emailVerified")
return   res.json({message:"success",user})
  }catch(e){
    return res.json({message:e})
  }
  
  
}
async function getNotApprovedUsers(req,res){
  try{
    const users=await User.find({isApproved:false,emailVerified:true}) 
    if(users){
      return res.json({success:true,users})
    }
    return res.json({success:true,message:"no users found"})

  }catch(e){
        return res.json({success:true,message:e})

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

    return res.status(200).json({ message: "All users deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error deleting users", error: err.message });
  }
}
async function DeleteUser(req, res) {
  try {
    let { reg_no } = req.params;
    if (!reg_no) {
      return res.status(400).json({ message: "Registration number is required", success: false });
    }

    reg_no = reg_no.trim(); // remove whitespace

    const user = await User.findOne({ reg_no });
    if (!user) {
      return res.status(404).json({ message: "No User Found", success: false });
    }

    await user.deleteOne();
    return res.status(200).json({ message: "User Deleted Successfully", success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", success: false });
  }
}
async function DeleteUserByEmail(req, res) {
  try {
    const { _id } = req.params;
    if (!_id) {
      return res.status(400).json({ message: "email is required", success: false });
    }

    // reg_no = reg_no.trim(); // remove whitespace

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "No User Found", success: false });
    }

    await user.deleteOne();
    return res.status(200).json({ message: "User Deleted Successfully", success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", success: false });
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
      await user.updateOne({emailVerified:true})
       return res.status(200).json({ success: true, message: "Verification Success.Pending Admin Approved" });
       
    }
    else{
       return res.status(200).json({ success: false, message: "Your OTP is incorrect" });
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
  DeleteAllUsers,
  getNotApprovedUsers,
  DeleteUser,
  DeleteUserByEmail
};

export default UserController;
