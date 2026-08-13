import type { ObjectId } from "mongodb";

export type AttendanceStatus = "มาเรียน" | "มาสาย" | "ลา" | "ขาด";
export interface StudentAttendance {
  studentId: string;
  name: string;
  email: string;
  attendanceDate?: string | null;
  section: string;
  major: string;
  status: AttendanceStatus;
  score: number;
  checkInTime: string | null;
  totalScore: number;
  days: number;
  absentDays: number;
  lateDays: number;
  averageScore: number;
}
export interface AttendanceDocument {
  _id?: ObjectId;
  sessionId: ObjectId;
  classId: ObjectId | string;
  className: string;
  studentId: string;
  name: string;
  section: string;
  email?: string;
  academicYear: number;
  date: string;
  checkInTime: Date;
  checkInHour: string;
  status: AttendanceStatus;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface CheckInRequestBody {
  classId: string;
  sessionId: string;
  studentId: string;
  name?: string;
  section?: string;
  email?: string;
}
export interface AttendanceResult {
  success: boolean;
  message?: string;
  status?: AttendanceStatus;
  score?: number;
}
export interface AttendanceResponse {
  success: boolean;
  message: string;
  data?: {
    studentId: string;
    sessionId: string;
    sessionDate: string;
    checkInTime: Date;
    status: AttendanceStatus;
    score: number;
  };
}
