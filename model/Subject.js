import mongoose from "mongoose";
const schema = mongoose.Schema;

const subjectSchema = new schema(
  {
    subjectCode: { type: String, required: true, unique:true },
    name: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    studentsEnrolled : [{
        type: schema.Types.ObjectId,
        ref: 'User'
    }],
    lecture : {
        type: schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", subjectSchema);