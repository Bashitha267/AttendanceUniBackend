import sgMail from '@sendgrid/mail';
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cloudinary from "../middleware/cloudinary.js";
import { Teacher } from "../model/Teacher.js";
import { User } from "../model/User.js";
dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
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
// Replace the existing Signup function with this one

async function Signup(req, res) {
  try {
    const { name, email, password, role, dob, reg_no, gender, contact_no, image } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role || !dob || !reg_no || !gender || !contact_no) {
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const existingUser = await User.findOne({ email });

    // --- NEW LOGIC START ---
    if (existingUser) {
      // If user exists, check if their email is verified
      if (existingUser.emailVerified) {
        // This is a fully registered user, so block them.
        return res.status(400).json({ success: false, message: "Email already registered" });
      } else {
        // This user started registration but didn't finish.
        // Let's update their details and resend the OTP.
        const existingReg = await User.findOne({ reg_no, _id: { $ne: existingUser._id } });
        if (existingReg) {
          return res.status(400).json({ success: false, message: "Registration number is already in use by another account." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Update the existing user's data
        existingUser.name = name;
        existingUser.password = hashedPassword;
        existingUser.role = role;
        existingUser.dob = dob;
        existingUser.reg_no = reg_no;
        existingUser.gender = gender;
        existingUser.contact_no = contact_no;
        existingUser.image = image;
        existingUser.otp = otp; // Assign the new OTP
        
        await existingUser.save();

        // Resend OTP email
        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "Your New OTP Verification Code",
          text: `Hello! Your new OTP code is ${otp}. Please use this to verify your email.`,
        };
        await sgMail.send(mailOptions);
        
        return res.status(200).json({ success: true, message: "A new OTP has been sent to your email" });
      }
    }
    // --- NEW LOGIC END ---

    // If we reach here, it's a completely new user. Proceed as normal.
    const existingReg = await User.findOne({ reg_no });
    if (existingReg) {
      return res.status(400).json({ success: false, message: "Registration number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000);

    const user = await User.create({
      name, email, dob, reg_no, gender, role, contact_no, image,
      password: hashedPassword,
      otp,
      // emailVerified and isApproved will be false by default
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "OTP Verification",
      text: `Hello! Your OTP code is ${otp}`,
    };
    await sgMail.send(mailOptions);

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

      await sgMail.send(mailOptions);

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
const user=await User.find({},"name email contact_no reg_no emailVerified role")
return   res.json({message:"success",user})
  }catch(e){
    return res.json({message:e})
  }
  
  
}
async function getUsersbyID(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findOne({ reg_no: id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Cannot find the user"
      });
    }

    return res.json({
      success: true,
      user
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
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
// async function DeleteAllUsers(req, res) {
//   try {
//     await User.deleteMany({}); // removes all documents from User collection

//     return res.status(200).json({ message: "All users deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Error deleting users", error: err.message });
//   }
// }
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
export const uploadImages = async (req, res) => {
  // 1. Check if files exist on the request
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ success: false, error: "No files were uploaded." });
  }

  // 2. Normalize the files input to always be an array
  const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

  try {
    // 3. Create an array of upload promises
    const uploadPromises = files.map(file => {
      // Create a base64 string from the file buffer for Cloudinary
      const b64 = Buffer.from(file.data).toString("base64");
      let dataURI = "data:" + file.mimetype + ";base64," + b64;
      
      // Return the promise from Cloudinary's uploader
      // The 'folder' property has been removed to upload to the default directory
      return cloudinary.uploader.upload(dataURI, {
        resource_type: "auto", // Automatically detect the resource type
      });
    });

    // 4. Wait for all promises to resolve
    const results = await Promise.all(uploadPromises);

    // 5. Extract the secure URLs from the results
    const urls = results.map(result => result.secure_url);

    // 6. Send a success response with the URLs
    res.json({ success: true, urls });

  } catch (err) {
    console.error("Error during Cloudinary upload:", err);
    res.status(500).json({ success: false, error: "Image upload failed. Please try again." });
  }
};

// controllers/userController.js

export const verifyAllUsersEmail = async (req, res) => {
  try {
    const result = await User.updateMany({}, { $set: { emailVerified: true } });
    res.status(200).json({
      message: "All users' emailVerified set to true successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating emailVerified:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};



async function updateUserByRegNo(req, res) {
  try {
    const { reg_no } = req.params;
    const { name, email, gender, contact_no } = req.body;

    // Basic validation
    if (!reg_no) {
        return res.status(400).json({ success: false, message: "Registration number is required in the URL." });
    }
    if (!name || !email || !gender || !contact_no) {
        return res.status(400).json({ success: false, message: "Please provide all required fields: name, dob, gender, contact_no." });
    }

    // Find the user and update their details
    // The { new: true } option returns the modified document rather than the original
    const updatedUser = await User.findOneAndUpdate(
      { reg_no: reg_no.trim() },
      {
        $set: {
          name,
          email,
          gender,
          contact_no,
         
        },
      },
      { new: true, runValidators: true } // runValidators ensures schema rules are checked
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ 
        success: true, 
        message: "User details updated successfully.",
        user: updatedUser 
    });

  } catch (error) {
    console.error("Error updating user details:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
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
  
  getNotApprovedUsers,
  DeleteUser,
  DeleteUserByEmail,
  getUsersbyID,
  updateUserByRegNo,
 
};

export default UserController;
