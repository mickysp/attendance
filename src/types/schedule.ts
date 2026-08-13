import type { ObjectId } from "mongodb";

export interface ScheduleDocument {
  _id?: ObjectId;
  classId: ObjectId | string;
  className?: string;
  date: string;
  startTime: string;
  endTime: string;
  lateAfter: number;
  allowCheckIn: boolean;
  isOpen: boolean;
  academicYear: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScheduleQuery {
  classId: ObjectId | string;
  academicYear: number;
  date?: string;
}

export interface CreateScheduleBody {
  classId: string;
  className?: string;
  date: string;
  startTime: string;
  endTime: string;
  lateAfter?: number;
  allowCheckIn?: boolean;
  isOpen?: boolean;
}
