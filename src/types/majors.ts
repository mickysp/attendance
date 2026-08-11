export interface Major {
  _id?: string;
  name: string;
  createdAt: Date;
}

export interface CreateMajorBody {
  name: string;
}