/**
 * Per-term final exam calendars published by the Office of the Registrar.
 * https://registrar.berkeley.edu/calendars/final-exam-groups/
 *
 * To support a new term, add an entry to FINAL_EXAM_CALENDARS keyed by
 * "<year> <semester>" (e.g. "2027 Spring") transcribing the registrar's
 * exam group table for that term.
 */

/** A concrete exam sitting from the registrar's calendar. */
export interface FinalExamSlot {
  /** Exam group number in the registrar's table. */
  group: number;
  /** ISO date, e.g. "2026-12-14". */
  date: string;
  /** 24-hour "HH:MM". */
  startTime: string;
  /** 24-hour "HH:MM". */
  endTime: string;
}

/**
 * Day-pattern category from the registrar's table. Per the registrar,
 * classes meeting on M, W, F, MW, MF, WF, or MTWTF follow the "MWF"
 * groups; classes meeting on Tu, Th, or TuTh follow the "TuTh" groups.
 */
export type FinalExamDayCategory = "MWF" | "TuTh";

/** Maps a day category + class start time to an exam group. */
export interface StartTimeRule {
  category: FinalExamDayCategory;
  /** Exact class start times ("HH:MM") this rule covers. */
  startTimes?: string[];
  /** Covers classes starting at or after this time ("HH:MM"). */
  startAtOrAfter?: string;
  group: number;
}

/** Assigns specific courses to a group regardless of meeting time. */
export interface CourseRule {
  subject: string;
  courseNumbers: string[];
  group: number;
}

export interface TermFinalExamCalendar {
  slots: FinalExamSlot[];
  startTimeRules: StartTimeRule[];
  courseRules: CourseRule[];
  /** Group for online/web-based instruction mode classes. */
  onlineGroup?: number;
  /** Group for classes meeting on Saturday or Sunday. */
  weekendGroup?: number;
}

/**
 * Fall 2026 Final Examination Calendar.
 *
 * Not encoded: "Elementary Foreign Languages" also belong to group 10,
 * but the registrar's own footnote says not all foreign language classes
 * are included and to check with the instructor, and there is no reliable
 * way to identify them from class data — those classes fall through to
 * their day/time group or to "unknown".
 */
const FALL_2026: TermFinalExamCalendar = {
  slots: [
    { group: 1, date: "2026-12-14", startTime: "08:00", endTime: "11:00" },
    { group: 2, date: "2026-12-14", startTime: "11:30", endTime: "14:30" },
    { group: 3, date: "2026-12-14", startTime: "15:00", endTime: "18:00" },
    { group: 4, date: "2026-12-14", startTime: "19:00", endTime: "22:00" },
    { group: 5, date: "2026-12-15", startTime: "08:00", endTime: "11:00" },
    { group: 6, date: "2026-12-15", startTime: "11:30", endTime: "14:30" },
    { group: 7, date: "2026-12-15", startTime: "15:00", endTime: "18:00" },
    { group: 8, date: "2026-12-15", startTime: "19:00", endTime: "22:00" },
    { group: 9, date: "2026-12-16", startTime: "08:00", endTime: "11:00" },
    { group: 10, date: "2026-12-16", startTime: "11:30", endTime: "14:30" },
    { group: 11, date: "2026-12-16", startTime: "15:00", endTime: "18:00" },
    { group: 12, date: "2026-12-16", startTime: "19:00", endTime: "22:00" },
    { group: 13, date: "2026-12-17", startTime: "08:00", endTime: "11:00" },
    { group: 14, date: "2026-12-17", startTime: "11:30", endTime: "14:30" },
    { group: 15, date: "2026-12-17", startTime: "15:00", endTime: "18:00" },
    { group: 16, date: "2026-12-17", startTime: "19:00", endTime: "22:00" },
    { group: 17, date: "2026-12-18", startTime: "08:00", endTime: "11:00" },
    { group: 18, date: "2026-12-18", startTime: "11:30", endTime: "14:30" },
    { group: 19, date: "2026-12-18", startTime: "15:00", endTime: "18:00" },
    { group: 20, date: "2026-12-18", startTime: "19:00", endTime: "22:00" },
  ],
  startTimeRules: [
    { category: "MWF", startTimes: ["10:00"], group: 1 },
    { category: "MWF", startTimes: ["11:00"], group: 2 },
    { category: "MWF", startTimes: ["08:00"], group: 4 },
    { category: "TuTh", startTimes: ["14:00"], group: 5 },
    { category: "TuTh", startTimes: ["09:00", "09:30"], group: 7 },
    { category: "MWF", startTimes: ["15:00", "15:30"], group: 8 },
    { category: "TuTh", startTimes: ["11:00"], group: 9 },
    { category: "TuTh", startTimes: ["08:00"], group: 11 },
    { category: "MWF", startTimes: ["13:00"], group: 12 },
    { category: "MWF", startTimes: ["16:00", "16:30"], group: 13 },
    { category: "TuTh", startAtOrAfter: "17:00", group: 14 },
    { category: "MWF", startTimes: ["14:00"], group: 15 },
    { category: "MWF", startTimes: ["09:00", "09:30"], group: 16 },
    { category: "TuTh", startTimes: ["12:00", "12:30", "13:00"], group: 17 },
    { category: "MWF", startTimes: ["12:00", "12:30"], group: 18 },
    { category: "TuTh", startTimes: ["10:00"], group: 19 },
    { category: "MWF", startAtOrAfter: "17:00", group: 19 },
    { category: "TuTh", startTimes: ["15:00", "15:30", "16:00"], group: 20 },
  ],
  courseRules: [
    {
      subject: "CHEM",
      courseNumbers: ["1A", "1B", "3A", "3B", "4A", "4B", "32"],
      group: 3,
    },
    { subject: "ECON", courseNumbers: ["140"], group: 3 },
    { subject: "ECON", courseNumbers: ["1", "100B"], group: 6 },
    { subject: "UGBA", courseNumbers: ["101B"], group: 6 },
    { subject: "DATA", courseNumbers: ["C8"], group: 6 },
    { subject: "STAT", courseNumbers: ["20"], group: 12 },
    {
      subject: "ENGLISH",
      courseNumbers: ["1A", "1B", "R1A", "R1B"],
      group: 19,
    },
  ],
  onlineGroup: 10,
  weekendGroup: 11,
};

/** Keyed by "<year> <semester>", e.g. "2026 Fall". */
export const FINAL_EXAM_CALENDARS: Record<string, TermFinalExamCalendar> = {
  "2026 Fall": FALL_2026,
};
