import { Subject } from "../model/Subject.model.js";

const getSubjectsByLecturer = async (req, res) => {
  const { lec_id } = req.params;

  try {
    const subjects = await Subject.find({ lecturerId: lec_id });

    if (!subjects || subjects.length === 0) {
      return res.status(404).json({ message: "No subjects found for this lecturer" });
    }

    
    const formattedSubjects = subjects.map((sub) => ({
      ...sub.toObject(), 
      studentCount: sub.studentsEnrolled.length,
    }));

    res.status(200).json(formattedSubjects);
  } catch (error) {
    console.error("Error fetching subjects by lecturer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default getSubjectsByLecturer;
