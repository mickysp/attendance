export interface CheckInConfigFields {
  prefix: boolean;
  firstname: boolean;
  lastname: boolean;
  studentId: boolean;
  email: boolean;
  section: boolean;
  photo: boolean;
  note: boolean;
  location: boolean;
}

export interface CheckInConfigDocument {
  type: "global_config";
  config: CheckInConfigFields;
  updatedAt: Date;
}

export interface UpdateCheckInConfigBody {
  config: CheckInConfigFields;
}

export const defaultCheckInConfig: CheckInConfigFields = {
  prefix: true,
  firstname: true,
  lastname: true,
  studentId: true,
  email: true,
  section: true,
  photo: true,
  note: true,
  location: true,
};