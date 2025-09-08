import mongoose from "mongoose";
const schema=mongoose.Schema
const ClassShema=new schema({
    startTime:{
        type:Date,
        required:true
    },
      endTime:{
        type:Date,
        required:true
    },
    subjectName:{
        type:schema.Types.ObjectId,
        ref:'Subject'
    },
    studentsAttended:[{
        type:schema.Types.ObjectId,
        ref:'User',
        required:true
    }],
    lecture : {
        type: schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date:{
        type:Date,
        required:true
    }

},
{ timestamps: true })

const Class = mongoose.model('Class', ClassShema);

export default Class;