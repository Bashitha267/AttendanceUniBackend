import mongoose from "mongoose";
const schema=mongoose.Schema
const UserSchema=new schema(
{
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    contact_no:{type:String,required:true},
    reg_no:{type:String,required:true,unique:true},
    role:{type:String,
        enum:['student','lecturer','registor','admin'],
        required:true
    },
    gender:{type:String,
        enum:['male','female']
    },
    isApproved:{type:Boolean,default:false},
    image:{type:String},
    dob:{type:String,required:true},
    isVerified:{type:Boolean,default:false},
    otp:{type:String,default:""},
    emailVerified:{type:Boolean,default:false},
    enrolledCourses: [{ type: String, default: [] }],

}



)
export const User=mongoose.model('User',UserSchema)