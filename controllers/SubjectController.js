import { Subject } from '../model/Subject.model.js'; // Make sure the path to your model is correct

import { User } from '../model/User.js';
export const createSubject = async (req, res) => {
    try {
        // 1. Get the data from the request body
        const { subjectCode, name, year, semester, lecturerId,batchYear } = req.body;

        // 2. Perform basic validation to ensure required fields are present
        if (!subjectCode || !name || !year || !semester || !lecturerId||!batchYear) {
            return res.status(400).json({ 
                message: 'Please provide all required fields: subjectCode, name, year, semester, and lecturerId.' 
            });
        }

        // 3. Check if this specific subject offering already exists
        // The unique index in your model also protects against this, but this provides a clearer error message.
        const subjectExists = await Subject.findOne({ subjectCode, year, semester,batchYear });
        if (subjectExists) {
            return res.status(409).json({ // 409 Conflict
                message: 'This subject offering already exists for the specified year and semester.' 
            });
        }
        const lec=await User.findOne({reg_no:lecturerId,isApproved:true,role:"lecturer"})
        if(!lec){
            return res.status(400).json({ 
                message: 'Lecturer is not registered' 
            });
        }

        // 4. Create a new subject instance
        const newSubject = new Subject({
            subjectCode,
            name,
            year,
            semester,
            lecturerId,
            batchYear
        });

        // 5. Save the new subject to the database
        const savedSubject = await newSubject.save();

        // 6. Send a success response with the newly created data
        res.status(201).json({success:true,message:"New Subject Added Successfully"});

    } catch (error) {
        // Handle any potential errors during the process
        console.error('Error creating subject:', error);
        res.status(500).json({ 
            message: 'Server error while creating the subject.', 
            error: error.message 
        });
    }
};

//one student
export const enrollStudent = async (req, res) => {
  try {
    const { subjectCode, reg_no } = req.params;

    if (!subjectCode || !reg_no) {
      return res.status(400).json({ success: false,message: "Please provide subjectCode and reg_no in params." });
    }

    const subject = await Subject.findOne({ subjectCode });
    if (!subject) return res.status(404).json({ success: false,message: "Subject not found." });

    if (subject.studentsEnrolled.includes(reg_no)) {
      return res.status(409).json({ success: false,message: "Student is already enrolled." });
    }

    subject.studentsEnrolled.push(reg_no);
    await subject.save();

    res.status(200).json({ success: true, message: "Student enrolled successfully."});
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ success:false,message: "Server error while enrolling student.", error: error.message });
  

}
};

//multiple students
export const enrollMultipleStudents = async (req, res) => {
  try {
    const { subjectCode,batchYear,year } = req.params;
    const { reg_nos } = req.body; // array of reg_no

    if (!subjectCode || !reg_nos ||!batchYear||!year|| !Array.isArray(reg_nos) || reg_nos.length === 0) {
      return res.status(400).json({ success: false,message: "Provide subjectCode  " });
    }

    const subject = await Subject.findOne({ subjectCode,batchYear,year });
    if (!subject) return res.status(404).json({success: false, message: "Subject not found." });

    // Filter out already enrolled students
    const newStudents = reg_nos.filter(reg_no => !subject.studentsEnrolled.includes(reg_no));
    if (newStudents.length === 0) {
      return res.status(200).json({ success: false,message: "All students were already enrolled." });
    }

    subject.studentsEnrolled.push(...newStudents);
    await subject.save();

    res.status(200).json({ success: true, message: "Students enrolled successfully.", enrolled: newStudents });
  } catch (error) {
    console.error("Error enrolling students:", error);
    res.status(500).json({ success: false,message: "Server error while enrolling students.", error: error.message });
  }
};

export const getSubjects=async(req,res)=>{
    try{
        const subjects=await Subject.find()
        if(subjects){
            return res.status(202).json({success:true,subjects})
        }
        return res.status(400).json({success:false,message:"No Subjects"})
    }catch(e){
        return res.status(500).json({success:false,message:e})
    }
}

export const deleteSubjects=async(req,res)=>{
    try{
        const result = await Subject.deleteMany();
        if (result.deletedCount > 0) {
      return res.status(200).json({
        success: true,
        message: `${result.deletedCount} subject(s) deleted successfully.`
      });
    }
         return res.status(404).json({
      success: false,
      message: "No subjects found to delete."
    });
    }catch(e){
        return res.status(500).json({success:false,message:e})
    }
}