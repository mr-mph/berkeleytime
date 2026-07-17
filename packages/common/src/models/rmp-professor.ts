import { Document, Model, Schema, model } from "mongoose";

export interface IRmpProfessorItem {
  legacyId: number;
  firstName: string;
  lastName: string;
  department?: string;
  avgRating: number | null;
  numRatings: number;
  schoolId: string;
  updatedAt?: Date;
}

export interface IRmpProfessorItemDocument
  extends IRmpProfessorItem,
    Document {}

const rmpProfessorSchema = new Schema<IRmpProfessorItem>(
  {
    legacyId: { type: Number, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    department: { type: String },
    avgRating: { type: Number, default: null },
    numRatings: { type: Number, required: true, default: 0 },
    schoolId: { type: String, required: true },
  },
  { timestamps: true }
);

rmpProfessorSchema.index({
  lastName: 1,
  firstName: 1,
});

export const RmpProfessorModel: Model<IRmpProfessorItem> =
  model<IRmpProfessorItem>("rmp_professors", rmpProfessorSchema);
