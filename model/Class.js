import mongoose from "mongoose";
const schema=mongoose.Schema
const ClassShema=new schema({
    startTime:{
        type:String,
        required:true
    },
      endTime:{
        type:String,
        required:true
    },
    subjectName:{
        type:String
    },
    studentsAttended:[{
        type:String
        
        
    }],
    lecturer : {
        type: String,
   
        required: true
    },
    registor:{
        type: String,
        required: true
    },
    date:{
        type:Date,
        required:true
    },
    isCompleted:{
        type:Boolean,
        default:false
    },
    pinCode:{
        type:String,
        required:true
    }

},
{ timestamps: true })

const Class = mongoose.model('Class', ClassShema);

export default Class;