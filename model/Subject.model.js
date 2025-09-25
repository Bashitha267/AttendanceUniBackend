import mongoose from "mongoose";
const schema = mongoose.Schema;

const subjectSchema = new schema(
  {
    subjectCode: { type: String, required: true},
    name: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
     batchYear: { type: Number, required: true },
    studentsEnrolled : [{
        type: String, 
      default:[]
    }],
    lecturerId : {
       type:String,

        required: true
    },
    subpinCode:{
      type:String,
      required
    }
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", subjectSchema);

