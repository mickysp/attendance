import type { ObjectId } from "mongodb";

export interface IncomingStudent {
  studentId?: string;
  fullName?: string;
  email?: string;
}

export interface UploadStudentsBody {
  classId?: string;
  section?: string;
  major?: string;
  students?: IncomingStudent[];
}

export interface StudentDocument {
  _id?: ObjectId;
  studentId: string;
  fullName: string;
  email?: string;
  section: string;
  major: string;
  academicYear: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface StudentClassDocument {
  _id?: ObjectId;
  studentId: ObjectId | string;
  classId?: ObjectId | string;
  className?: string;
  section?: string;
  academicYear?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentResultItem {
  studentId: string;
  fullName: string;
  email?: string;
  section: string;
  major: string;
  className: string;

  status: "created" | "duplicate";

  relation: "added" | "exists";
}

export interface StudentErrorItem {
  student?: IncomingStudent;
  message: string;
}

export interface MajorDocument {
  _id?: ObjectId;
  name: string;
}

export interface StudentClassUpdate {
  className: string;
  section: string;
  academicYear: number;
}

export interface UpdateStudentBody {
  _id: string;
  studentId: string;
  fullName: string;
  email?: string;
  classes?: StudentClassUpdate[];
}

export type ExcelRow = Record<string, string | number | undefined>;

export interface StudentImportErrorItem {
  student?: IncomingStudent;
  message: string;
}
