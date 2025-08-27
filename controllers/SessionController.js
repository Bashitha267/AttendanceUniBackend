import dotenv from "dotenv";
import querystring from "querystring";
import { Student } from "../model/Student.js";
import { Teacher } from "../model/Teacher.js";
dotenv.config();

// Helper to generate QR URL
function getQR(session_id, email) {
  let url = `${process.env.CLIENT_URL}/login?${querystring.stringify({
    session_id,
    email,
  })}`;
  return url;
}

// Haversine formula to calculate distance
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check distance between student and session location
function checkStudentDistance(Location1, Location2) {
  Location1 = Location1.split(",");
  Location2 = Location2.split(",");
  const locationLat1 = parseFloat(Location1[0]);
  const locationLon1 = parseFloat(Location1[1]);
  const locationLat2 = parseFloat(Location2[0]);
  const locationLon2 = parseFloat(Location2[1]);

  const distance = haversineDistance(
    locationLat1,
    locationLon1,
    locationLat2,
    locationLon2
  );
  return distance.toFixed(2);
}

// Controller functions

// Create a new session
async function CreateNewSession(req, res) {
  let { session_id, name, duration, location, radius, date, time } = req.body;
  let tokenData = req.user;

  let newSession = {
    session_id,
    date,
    time,
    name,
    duration,
    location,
    radius,
    attendance: [], // initialize empty attendance
  };

  try {
    await Teacher.findOneAndUpdate(
      { email: tokenData.email },
      { $push: { sessions: newSession } }
    );

    res.status(200).json({
      url: getQR(session_id, tokenData.email),
      message: "Session created successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get all sessions for a teacher
async function GetAllTeacherSessions(req, res) {
  try {
    let tokenData = req.user;
    const teacher = await Teacher.findOne({ email: tokenData.email });
    res.status(200).json({ sessions: teacher.sessions });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get QR code for a session
async function GetQR(req, res) {
  try {
    let tokenData = req.user;
    let url = getQR(req.body.session_id, tokenData.email);
    res.status(200).json({ url });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Mark attendance for a session
async function AttendSession(req, res) {
  let tokenData = req.user;
  let { session_id, teacher_email, regno, IP, student_email, Location, date } =
    req.body;

  try {
    let present = false;
    const teacher = await Teacher.findOne({ email: teacher_email });
    let session_details = {};

    teacher.sessions.forEach((session) => {
      if (session.session_id === session_id) {
        let distance = checkStudentDistance(Location, session.location);

        // Check if student already marked
        session.attendance.forEach((student) => {
          if (student.regno === regno || student.student_email === student_email) {
            present = true;
          }
        });

        if (!present) {
          // Mark attendance
          session.attendance.push({
            regno,
            date,
            IP,
            student_email: tokenData.email,
            Location,
            distance,
          });

          session_details = {
            session_id: session.session_id,
            teacher_email: teacher.email,
            name: session.name,
            date: session.date,
            time: session.time,
            duration: session.duration,
            distance: distance,
            radius: session.radius,
          };
        }
      }
    });

    // Update teacher and student
    if (!present) {
      await Teacher.findOneAndUpdate(
        { email: teacher_email },
        { sessions: teacher.sessions }
      );

      await Student.findOneAndUpdate(
        { email: student_email },
        { $push: { sessions: session_details } }
      );

      res.status(200).json({ message: "Attendance marked successfully" });
    } else {
      res.status(200).json({ message: "Attendance already marked" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get sessions for a student
async function GetStudentSessions(req, res) {
  let tokenData = req.user;
  try {
    const student = await Student.findOne({ email: tokenData.email });
    res.status(200).json({ sessions: student.sessions });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

const SessionController = {
  CreateNewSession,
  GetAllTeacherSessions,
  GetQR,
  AttendSession,
  GetStudentSessions,
};

export default SessionController;
