import { Document, Model, Schema, model } from "mongoose";

export interface IArticulationCourse {
  // sending institution's course, e.g. prefix "CIS", number "22A"
  prefix: string;
  number: string;
  title?: string;
  minUnits?: number;
  maxUnits?: number;
}

export interface IArticulationOption {
  // courses that must all be completed together (AND)
  courses: IArticulationCourse[];
}

// One document per (receiving Berkeley course, sending community college).
// Sourced from ASSIST.org CCC-to-UCB "AllDepartments" agreements.
export interface IArticulationItem {
  // receiving (Berkeley) course, subject normalized to match `courses` storage
  subject: string;
  number: string;
  courseTitle?: string;
  // other Berkeley courses articulated together with this one as a series,
  // stored as `${subject} ${number}` display strings (e.g. "BIOLOGY 1AL")
  seriesWith?: string[];

  // ASSIST sending institution
  institutionId: number;
  institutionName: string;
  institutionCode?: string;

  // agreement academic year, e.g. "2025-2026" with ASSIST id 76
  academicYear: string;
  academicYearId: number;

  // alternative ways to articulate (OR), each a group of courses (AND)
  options: IArticulationOption[];
  // advisory notes from ASSIST attributes
  notes?: string[];
}

export interface IArticulationItemDocument
  extends IArticulationItem,
    Document {}

const articulationCourseSchema = new Schema<IArticulationCourse>(
  {
    prefix: { type: String, required: true },
    number: { type: String, required: true },
    title: { type: String },
    minUnits: { type: Number },
    maxUnits: { type: Number },
  },
  { _id: false }
);

const articulationSchema = new Schema<IArticulationItem>({
  subject: { type: String, required: true },
  number: { type: String, required: true },
  courseTitle: { type: String },
  seriesWith: { type: [String] },
  institutionId: { type: Number, required: true },
  institutionName: { type: String, required: true },
  institutionCode: { type: String },
  academicYear: { type: String, required: true },
  academicYearId: { type: Number, required: true },
  options: {
    type: [
      new Schema<IArticulationOption>(
        { courses: { type: [articulationCourseSchema], required: true } },
        { _id: false }
      ),
    ],
    required: true,
  },
  notes: { type: [String] },
});

// for course page lookups
articulationSchema.index({ subject: 1, number: 1 });
// for per-college replacement during pulls
articulationSchema.index({ institutionId: 1 });

export const ArticulationModel: Model<IArticulationItem> =
  model<IArticulationItem>("articulations", articulationSchema);
