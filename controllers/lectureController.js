import Class from "../model/Class.js";
import { Subject } from "../model/Subject.model.js";

export const getSubjectsByLecturer = async (req, res) => {
  const { lec_id } = req.params;

  try {
    // 1. Find all subjects taught by this lecturer
    const subjects = await Subject.find({ lecturerId: lec_id });

    if (!subjects || subjects.length === 0) {
      return res.status(404).json({ message: "No subjects found for this lecturer" });
    }

    // 2. For each subject, calculate stats
    const formattedSubjects = await Promise.all(
      subjects.map(async (sub) => {
        // Number of students enrolled
        const studentCount = sub.studentsEnrolled.length;

        // Number of classes held for this subject
        const classes = await Class.find({ subjectID: sub._id });
        const numberOfClasses = classes.length;

        // Total number of students attended across all classes
        let totalAttendanceCount = 0;
        classes.forEach((cls) => {
          totalAttendanceCount += cls.studentsAttended.length;
        });

        // Average attendance = total attendance / number of classes
        let avgAttendance = 0;
        if (numberOfClasses > 0) {
          avgAttendance = totalAttendanceCount / numberOfClasses;
        }

        return {
          ...sub.toObject(),
          studentCount,
          numberOfClasses,
          avgAttendance: Number(avgAttendance.toFixed(2)), // keep 2 decimals
        };
      })
    );

    res.status(200).json(formattedSubjects);
  } catch (error) {
    console.error("Error fetching subjects by lecturer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
