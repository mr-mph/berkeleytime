/**
 * Imports a manually-compiled DRAFT course schedule (e.g. Spring 2027) into
 * Mongo before SIS opens for that term.
 *
 * It seeds Course / Class / Section docs from scripts/data/<term>.json, marks
 * the term (and every class/section it creates) as `isDraft`, then rebuilds the
 * denormalized catalog_classes collection for the term so the data shows up in
 * both catalog search and the class-detail page.
 *
 * Design notes:
 *  - Existing courses are REUSED by (subject, number) so the draft class inherits
 *    the real courseId, title, description, department and grade history. Only
 *    genuinely-new courses get a synthetic `draft-<subject>-<number>` courseId.
 *  - Everything it writes is tagged `isDraft: true`, so re-running only ever
 *    clears its own rows — real SIS data (whenever it lands) is never touched.
 *  - Idempotent: run it as many times as you like; each run fully reflects the
 *    current JSON.
 *  - Datapuller coexistence: the datapuller skips terms flagged isDraft (see
 *    getActiveTerms) and preserves the flag across term pulls, so scheduled
 *    runs won't clobber the seeded data.
 *
 * HANDOFF when SIS opens for this term: the datapuller will keep ignoring the
 * term until its isDraft flag is cleared. To hand it back to SIS, clear the
 * draft rows and flag, then let the datapuller pull real data:
 *   mongosh> db.classes.deleteMany({ year: 2027, semester: "Spring", isDraft: true })
 *   mongosh> db.sections.deleteMany({ year: 2027, semester: "Spring", isDraft: true })
 *   mongosh> db.terms.updateMany({ name: "2027 Spring" }, { $set: { isDraft: false } })
 *
 * Run from repo root:   npx tsx scripts/import-draft-schedule.ts
 * Or in the datapuller container:
 *   npx tsx /datapuller/scripts/import-draft-schedule.ts
 * Local docker compose runs this automatically from the datapuller
 * dev-scheduler after the first terms + courses pull.
 */
import fs from "fs";
import mongoose from "mongoose";
import path from "path";

import {
  CatalogClassModel,
  ClassModel,
  CourseModel,
  SectionModel,
  TermModel,
} from "@repo/common/models";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://localhost:3008/bt?directConnection=true";

const localData =
  typeof __dirname !== "undefined"
    ? path.join(__dirname, "data", "spring-2027-draft.json")
    : "";
const DATA_FILE =
  localData && fs.existsSync(localData)
    ? localData
    : path.resolve(process.cwd(), "scripts/data/spring-2027-draft.json");

// Only needed when creating a synthetic Course (course not already in Mongo).
// Maps our draft subject -> the academicOrganization real courses in that
// department use, so the class is still filterable by department.
const SUBJECT_ORG: Record<string, string> = {
  COMPSCI: "ELENG",
  EECS: "ELENG",
  ELENG: "ELENG",
  PHILOS: "PHILOS",
  MATSCI: "MATSCI",
  EDUC: "EDUCATION",
  CHICANO: "ETHSTD",
  SCMATHE: "GGSME",
  BIOENG: "BIOENG",
  NEU: "NEURO",
  MCELLBI: "MCELLBI",
  BIOLOGY: "MCELLBI",
  PSYCH: "PSYCH",
};

const DAY_INDEX: Record<string, number> = {
  M: 0,
  Tu: 1,
  W: 2,
  Th: 3,
  F: 4,
  Sa: 5,
  Su: 6,
};

interface CourseEntry {
  courseNumber: string;
  number?: string;
  title?: string;
  instructors: string[];
  meeting?: {
    days: string;
    start: string;
    end: string;
    location?: string;
  };
}

interface Department {
  subject: string;
  source: string;
  exhaustive: boolean;
  note: string;
  courses: CourseEntry[];
}

interface DraftData {
  term: { year: number; semester: string; termId: string; name: string };
  departments: Department[];
}

/** "MWF" / "TuTh" -> [Mon..Sun] booleans. */
const parseDays = (s: string): boolean[] => {
  const days = [false, false, false, false, false, false, false];
  let i = 0;
  while (i < s.length) {
    const two = s.slice(i, i + 2);
    if (two in DAY_INDEX) {
      days[DAY_INDEX[two]] = true;
      i += 2;
      continue;
    }
    const one = s[i];
    if (one in DAY_INDEX) days[DAY_INDEX[one]] = true;
    i += 1;
  }
  return days;
};

/** "Family, Given" -> parts; a comma-less string is treated as a family name. */
const parseInstructor = (raw: string) => {
  const s = raw.trim();
  const comma = s.indexOf(",");
  const [familyName, givenName] =
    comma >= 0
      ? [s.slice(0, comma).trim(), s.slice(comma + 1).trim()]
      : [s, ""];
  return {
    printInScheduleOfClasses: true,
    familyName,
    givenName,
    role: "PI",
  };
};

/** 200+ catalog number => graduate. Strips leading letters (C/H/W/R...). */
const inferCareer = (courseNumber: string): string => {
  const m = courseNumber.match(/\d+/);
  return m && parseInt(m[0], 10) >= 200 ? "GRAD" : "UGRD";
};

const unitsFromCredit = (
  credit: { value?: { fixed?: number; range?: { minUnits?: number; maxUnits?: number } } } | undefined
): { minimum: number; maximum: number } | undefined => {
  const v = credit?.value;
  if (!v) return undefined;
  if (typeof v.fixed === "number") return { minimum: v.fixed, maximum: v.fixed };
  if (v.range && (v.range.minUnits != null || v.range.maxUnits != null)) {
    return {
      minimum: v.range.minUnits ?? 0,
      maximum: v.range.maxUnits ?? v.range.minUnits ?? 0,
    };
  }
  return undefined;
};

async function main() {
  console.log("Connecting to MongoDB...", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const data: DraftData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const { year, semester, termId, name } = data.term;

  // Session start/end dates for meeting bounds (SIS already seeds the term).
  const termDoc = await TermModel.findOne({
    name,
    academicCareerCode: "UGRD",
  }).lean();
  if (!termDoc) {
    throw new Error(
      `Term "${name}" not found in Mongo. SIS must have created the term row ` +
        `before draft classes can be attached to it.`
    );
  }
  const session =
    termDoc.sessions?.find((s) => s.id === "1") ?? termDoc.sessions?.[0];
  const startDate = session?.beginDate ?? termDoc.beginDate;
  const endDate = session?.endDate ?? termDoc.endDate;

  // Clear any prior draft rows for this term (never touches real SIS data).
  const delClasses = await ClassModel.deleteMany({
    year,
    semester,
    isDraft: true,
  });
  const delSections = await SectionModel.deleteMany({
    year,
    semester,
    isDraft: true,
  });
  console.log(
    `Cleared ${delClasses.deletedCount} prior draft classes, ` +
      `${delSections.deletedCount} draft sections.\n`
  );

  const classDocs: Record<string, unknown>[] = [];
  const sectionDocs: Record<string, unknown>[] = [];
  // Class numbers already used per courseId — avoids section-map collisions when
  // two subjects share one courseId (cross-listings, e.g. BIOENG/MATSCI C216).
  const usedNumbers = new Map<string, Set<string>>();
  const syntheticCourses: string[] = [];
  const reusedNotPrinted: string[] = [];

  const nextNumber = (courseId: string): string => {
    const used = usedNumbers.get(courseId) ?? new Set<string>();
    let n = 1;
    let num = String(n).padStart(3, "0");
    while (used.has(num)) {
      n += 1;
      num = String(n).padStart(3, "0");
    }
    return num;
  };

  for (const dept of data.departments) {
    const subject = dept.subject;
    for (const entry of dept.courses) {
      const courseNumber = entry.courseNumber;

      // Resolve (or create) the Course, reusing real SIS data where possible.
      // A (subject, number) pair can map to several Course docs (renumbered or
      // retired courses keep their own courseId), so prefer the one that is
      // catalog-visible and active — otherwise a stale hidden course would win
      // nondeterministically and the class would be dropped from the catalog.
      const candidates = await CourseModel.find({
        subject,
        number: courseNumber,
      }).lean();
      const existing =
        candidates.find(
          (c) => c.printInCatalog === true && c.status === "ACTIVE"
        ) ??
        candidates.find((c) => c.printInCatalog === true) ??
        candidates.find((c) => c.status === "ACTIVE") ??
        candidates[0];

      let courseId: string;
      let component = "LEC";
      let allowedUnits: { minimum: number; maximum: number } | undefined;
      let gradingBasis: string | undefined;
      let finalExam: string | undefined;

      if (existing) {
        courseId = existing.courseId;
        component = existing.primaryInstructionMethod || "LEC";
        allowedUnits = unitsFromCredit(existing.credit);
        gradingBasis = existing.gradingBasis;
        finalExam = existing.finalExam;
        if (existing.printInCatalog !== true) {
          reusedNotPrinted.push(`${subject} ${courseNumber}`);
        }
      } else {
        courseId = `draft-${subject}-${courseNumber}`;
        await CourseModel.updateOne(
          { courseId },
          {
            $set: {
              courseId,
              subject,
              number: courseNumber,
              title: entry.title || `${subject} ${courseNumber}`,
              academicCareer: inferCareer(courseNumber),
              academicOrganization: SUBJECT_ORG[subject],
              status: "ACTIVE",
              printInCatalog: true,
              gradingBasis: "OPT",
            },
          },
          { upsert: true }
        );
        syntheticCourses.push(`${subject} ${courseNumber}`);
        gradingBasis = "OPT";
      }

      // Allocate a unique class number within this courseId.
      const used = usedNumbers.get(courseId) ?? new Set<string>();
      const number = entry.number ?? nextNumber(courseId);
      used.add(number);
      usedNumbers.set(courseId, used);

      const instructors = entry.instructors.map(parseInstructor);
      const meeting = entry.meeting
        ? {
            number: 1,
            days: parseDays(entry.meeting.days),
            startTime: entry.meeting.start,
            endTime: entry.meeting.end,
            startDate,
            endDate,
            location: entry.meeting.location,
            instructors,
          }
        : { number: 1, startDate, endDate, instructors };

      classDocs.push({
        courseId,
        courseNumber,
        year,
        semester,
        subject,
        termId,
        sessionId: "1",
        number,
        title: entry.title,
        allowedUnits,
        gradingBasis,
        status: "A",
        finalExam,
        instructionMode: "P",
        anyPrintInScheduleOfClasses: true,
        isDraft: true,
      });

      sectionDocs.push({
        termId,
        sessionId: "1",
        sectionId: `d-${subject}-${courseNumber}-${number}`,
        courseId,
        classNumber: number,
        subject,
        courseNumber,
        number,
        primary: true,
        year,
        semester,
        component,
        status: "A",
        instructionMode: "P",
        printInScheduleOfClasses: true,
        startDate,
        endDate,
        meetings: [meeting],
        isDraft: true,
      });
    }
  }

  await ClassModel.insertMany(classDocs);
  await SectionModel.insertMany(sectionDocs);
  console.log(
    `Inserted ${classDocs.length} draft classes and ${sectionDocs.length} sections.`
  );
  if (syntheticCourses.length) {
    console.log(
      `\nCreated ${syntheticCourses.length} synthetic course(s) (not found in SIS):`
    );
    console.log("  " + syntheticCourses.join(", "));
  }
  if (reusedNotPrinted.length) {
    console.log(
      `\nWARNING: ${reusedNotPrinted.length} reused course(s) have printInCatalog!=true ` +
        `and will be dropped from the catalog:`
    );
    console.log("  " + reusedNotPrinted.join(", "));
  }

  // Mark the term as draft + catalog-bearing so it appears in the selector.
  const termUpdate = await TermModel.updateMany(
    { name },
    { $set: { hasCatalogData: true, isDraft: true } }
  );
  console.log(
    `\nMarked term "${name}" as draft + hasCatalogData (${termUpdate.modifiedCount} docs).`
  );

  // Rebuild the denormalized catalog for this term.
  const { buildCatalogClasses, updateCatalogRmpRatings } = await import(
    "../apps/datapuller/src/lib/catalog-denormalize"
  );
  console.log(`\nBuilding catalog_classes for ${year} ${semester}...`);
  const docs = await buildCatalogClasses(year, semester);
  await CatalogClassModel.deleteMany({ year, semester });
  const BATCH_SIZE = 2000;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const result = await CatalogClassModel.insertMany(
      docs.slice(i, i + BATCH_SIZE),
      { ordered: false }
    );
    inserted += result.length;
  }
  console.log(`  Inserted ${inserted} catalog classes.`);

  // buildCatalogClasses leaves rmpAverageRating null; the datapuller fills it in a
  // separate pass. Run that pass so instructor RMP ratings show on catalog cards.
  await updateCatalogRmpRatings(
    {
      info: console.log,
      trace: () => {},
      warn: console.warn,
      error: console.error,
    } as unknown as Parameters<typeof updateCatalogRmpRatings>[0],
    year,
    semester
  );
  console.log("  Updated RMP ratings on catalog classes.");

  if (inserted < classDocs.length) {
    console.log(
      `\nNOTE: ${classDocs.length - inserted} class(es) did not make it into the ` +
        `catalog (missing Course.printInCatalog or primary Section). See warnings above.`
    );
  }

  console.log("\nDone!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
