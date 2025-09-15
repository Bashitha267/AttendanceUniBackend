import { Subject } from '../model/Subject.model.js';

import { User } from '../model/User.js';
export const createSubject = async (req, res) => {
    try {
        // 1. You correctly get the data here
        const { subjectCode, name, year, semester, lecturerId, batchYear, subpinCode } = req.body;

        // 2. Your validation is fine
        if (!subjectCode || !name || !year || !semester || !lecturerId || !batchYear || !subpinCode) {
            return res.status(400).json({
                message: 'Please provide all required fields: subjectCode, name, year, semester, and lecturerId.'
            });
        }

        // ... (rest of the checks are fine)
        const subjectExists = await Subject.findOne({ subjectCode, year, semester, batchYear });
        if (subjectExists) {
            return res.status(409).json({
                message: 'This subject offering already exists for the specified year and semester.'
            });
        }
        const lec = await User.findOne({ reg_no: lecturerId, isApproved: true, role: "lecturer" })
        if (!lec) {
            return res.status(400).json({
                message: 'Lecturer is not registered'
            });
        }

        // 4. Create a new subject instance -- THIS IS THE FIX
        const newSubject = new Subject({
            subjectCode,
            name,
            year,
            semester,
            lecturerId,
            batchYear,
            subpinCode // ✨ ADD THIS LINE
        });

        // 5. Save the new subject to the database
        const savedSubject = await newSubject.save();

        // 6. Send a success response
        res.status(201).json({ success: true, message: "New Subject Added Successfully" });

    } catch (error) {
        // Handle any potential errors
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


// Enroll a single student by email and subjectcode
export const enrollStudentByEmail = async (req, res) => {
  try {
    const { email, subjectCode } = req.body;

    
    if (!email || !subjectCode) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and subjectCode in body.",
      });
    }

    // Find the student
    const student = await User.findOne({ email, role: "student", isApproved: true });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found or not approved.",
      });
    }

    // Find the subject
    const subject = await Subject.findOne({ subjectCode });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found.",
      });
    }

    // Check  already enrolled User
    if (student.enrolledCourses.includes(subjectCode)) {
      return res.status(409).json({
        success: false,
        message: "Student is already enrolled in this subject.",
      });
    }

    // Check already enrolled 
    if (subject.studentsEnrolled.includes(student.reg_no)) {
      return res.status(409).json({
        success: false,
        message: "Student is already enrolled in subject record.",
      });
    }

    // add subject to student and student to subject
    student.enrolledCourses.push(subjectCode);
    subject.studentsEnrolled.push(student.reg_no);

    await student.save();
    await subject.save();

    res.status(200).json({
      success: true,
      message: `Student ${student.reg_no} enrolled into ${subjectCode} successfully.`,
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({
      success: false,
      message: "Server error while enrolling student.",
      error: error.message,
    });
  }
};


export const getEnrolledSubjects = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    // 1. Find the student
    const student = await User.findOne({ email, role: "student" });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // 2. If no courses enrolled
    if (!student.enrolledCourses || student.enrolledCourses.length === 0) {
      return res.status(200).json({ success: true, subjects: [] });
    }

    // 3. Get subject details
    const subjects = await Subject.find({
      subjectCode: { $in: student.enrolledCourses },
    })

    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    console.error("Error fetching enrolled subjects:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching enrolled subjects.",
      error: error.message,
    });
  }
};