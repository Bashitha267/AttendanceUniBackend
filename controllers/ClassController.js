import Class from "../model/Class.js";
import { Subject } from "../model/Subject.model.js";
import { User } from "../model/User.js";
export const addClass=async (req,res)=>{
    try{
        const {startTime,endTime,subjectID,lecturer,date,registor,pinCode}=req.body
        if(!startTime || !endTime || !subjectID || !lecturer || !date || !registor||!pinCode){
            return res.json({success:false,message:"Missing details"})
        }
        const exis_Lec=await User.findOne({reg_no:lecturer,role:"lecturer"})
        const exis_reg=await User.findOne({reg_no:registor,role:"registor"})
       
        const exis_sub=await Subject.findOne({_id:subjectID})
        if(!exis_Lec){
            return res.json({success:false,message:"Cannot find a lecturer regarding to Lecturer_id"})
            
        }
         if(!exis_reg){
            return res.json({success:false,message:"Cannot find a registor regarding to registor_id"})
            
        }
        if(!exis_sub){
            return res.json({success:false,message:"Cannot find a course regarding to provided ID"})

        }
       const newClass = await Class.create({
      startTime,
      endTime,
      subjectID,
      lecturer: exis_Lec._id,
      registor: exis_reg._id,
      date,
      pinCode
    });
    newClass.save();

        return res.json({success:true,message:"Class Created Successfully"})
        

    }
    catch(e){
        console.log(e);
        return res.json({success:false,message:"Server Error or Validation failed"})

    }
}
// get all classes
export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('lecturer', 'name reg_no')
      .populate('registor', 'name reg_no')
      .populate('subjectID', 'subjectCode name')
      .sort({ createdAt: -1 }); 

    return res.json({ success: true, data: classes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch classes' });
  }
};

// get incomplete classes
export const getIncompleteClasses = async (req, res) => {
  try {
    const incompleteClasses = await Class.find({ isCompleted: false })
   .populate('lecturer', 'name reg_no')
      .populate('registor', 'name reg_no')
      .populate('subjectID', 'subjectCode name')
      .sort({ createdAt: -1 }); 

    return res.json({ success: true, classes: incompleteClasses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch incomplete classes' });
  }
};


// set class to completed
export const markClassAsComplete = async (req, res) => {
  try {
    const { _id } = req.params;

    const updatedClass = await Class.findByIdAndUpdate(
      _id,
      { isCompleted: true },
      { new: true } 
    );

    if (!updatedClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    return res.json({ success: true, message: 'Class marked as completed'});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update class status' });
  }
};

export const deleteAll = async (req, res) => {
  try {
    const result = await Class.deleteMany({}); // Deletes all documents in the Class collection

    return res.json({
      success: true,
      message: `${result.deletedCount} classes deleted successfully`
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: "Failed to delete all classes"
    });
  }
};





export const markAttendance = async (req, res) => {
  try {
    const classId = req.params._id;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(200).json({ success: false, message: "studentId is required" });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(200).json({ success: false, message: "Class not found" });
    }

    const stu = await User.findById(studentId);
    if (!stu) {
      return res.status(200).json({ success: false, message: "Student not found" });
    }

    if (classDoc.studentsAttended.includes(studentId)) {
      return res.status(200).json({ success: false, message: "Student already marked as attended" });
    }

    classDoc.studentsAttended.push(studentId);
    await classDoc.save();

    // Populate studentsAttended with name and reg_no
    const populatedClass = await Class.findById(classId)
      .populate('studentsAttended', 'name reg_no');

    return res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: populatedClass
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return res.status(400).json({ success: false, message: "Internal Server Error" });
  }
};
