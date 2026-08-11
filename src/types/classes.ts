import type { ObjectId } from "mongodb";

export interface Branch {
  _id: string;
  name: string;
}

export interface Teacher {
  _id: string;
  name: string;
}

export interface IncomingClassCode {
  code?: string;
  section?: number;
  branchIds?: string[];
}

export interface ClassCodePayload {
  code: string;
  section: number;
  branches: Branch[];
}

export interface IncomingClass {
  className?: string;
  classCodes?: IncomingClassCode[];
  teacherId?: string;
  description?: string;
}

export interface ClassDocument {
  className: string;
  classCodes: ClassCodePayload[];
  description?: string;
  teacher?: Teacher;
  createdAt: Date;
  updatedAt?: Date;
  academicYear?: number;
  isOpen?: boolean;
}

export interface MongoClassDocument {
  _id: ObjectId;
  className: string;
  classCodes: ClassCodePayload[];
  description?: string;
  teacher?: Teacher;
  createdAt: Date;
  updatedAt?: Date;
  academicYear?: number;
  isOpen?: boolean;
}

export interface ScheduleDocument {
  _id?: ObjectId;
  classId: ObjectId | string;
  className?: string;
  date: string;
  startTime: string;
  endTime: string;
  lateAfter?: number;
  allowCheckIn?: boolean;
  isOpen?: boolean;
  academicYear?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentClassAggregate {
  _id: string;
}

export interface ClassResponse {
  _id: string;
  className: string;
  academicYear?: number;
  teacher?: Teacher;
  classCodes: ClassCodePayload[];
  isOpen?: boolean;
  createdAt?: Date;
  hasStudents?: boolean;
}