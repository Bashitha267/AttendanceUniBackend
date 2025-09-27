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
    subjectID:{
                type: mongoose.Schema.Types.ObjectId, ref: 'Subject',

    },
    studentsAttended:[{
                type: mongoose.Schema.Types.ObjectId, ref: 'User',

        
        
    }],
    lecturer : {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
   
        required: true
    },
    registor:{
                type: mongoose.Schema.Types.ObjectId, ref: 'User',

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