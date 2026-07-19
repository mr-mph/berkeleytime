import {
  FINAL_EXAM_CALENDARS,
  FinalExamDayCategory,
  FinalExamSlot,
  TermFinalExamCalendar,
} from "./calendars";

export type { FinalExamSlot, TermFinalExamCalendar };
export { FINAL_EXAM_CALENDARS };

/** A class's resolved final exam sitting. */
export interface ResolvedFinalExam {
  /** ISO date "YYYY-MM-DD". */
  date: string;
  /** "HH:MM" or "HH:MM:SS". */
  startTime: string;
  /** "HH:MM" or "HH:MM:SS". */
  endTime: string;
  location?: string | null;
  /** Registrar exam group number (derived exams only). */
  group?: number;
  /**
   * "sis" when SIS published a scheduled final for the section;
   * "derived" when estimated from the registrar's exam group calendar.
   */
  source: "sis" | "derived";
}

interface FinalExamMeeting {
  days?: (boolean | null)[] | null;
  startTime?: string | null;
}

interface FinalExamExam {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  type?: string | null;
}

/** The class fields needed to resolve a final exam. */
export interface FinalExamClassInput {
  year: number;
  semester: string;
  subject: string;
  courseNumber: string;
  /** Class-level final exam code: "Y" | "N" | "A" | "C" | "L". */
  finalExam?: string | null;
  primarySection?: {
    instructionMode?: string | null;
    meetings?: FinalExamMeeting[] | null;
    exams?: FinalExamExam[] | null;
  } | null;
}

/** Parse "HH:MM" or "HH:MM:SS" to minutes since midnight. */
const toMinutes = (time: string): number | null => {
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

/** Normalize an exam date ("YYYYMMDD" or ISO) to "YYYY-MM-DD". */
const normalizeDate = (date: string): string =>
  /^\d{8}$/.test(date)
    ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
    : date;

const MONDAY = 0;
const FRIDAY = 4;
const SATURDAY = 5;
const SUNDAY = 6;
const TUESDAY = 1;
const THURSDAY = 3;

/**
 * Classify meeting days (Monday-first boolean array) per the registrar:
 * M, W, F, MW, MF, WF, and MTWTF follow the MWF groups; Tu, Th, and TuTh
 * follow the TuTh groups; Saturday/Sunday classes have their own group.
 * Other combinations (e.g. MTuTh) are not covered by the calendar.
 */
const getDayCategory = (
  days: (boolean | null)[]
): FinalExamDayCategory | "weekend" | null => {
  if (days[SATURDAY] || days[SUNDAY]) return "weekend";

  const weekdays = [];
  for (let day = MONDAY; day <= FRIDAY; day++) {
    if (days[day]) weekdays.push(day);
  }
  if (weekdays.length === 0) return null;
  if (weekdays.length === 5) return "MWF"; // MTWTF

  const isMwf = weekdays.every((day) => day % 2 === 0); // Mon, Wed, Fri
  const isTuTh = weekdays.every(
    (day) => day === TUESDAY || day === THURSDAY
  );
  return isMwf ? "MWF" : isTuTh ? "TuTh" : null;
};

const getSlot = (
  calendar: TermFinalExamCalendar,
  group: number | undefined
): FinalExamSlot | null =>
  calendar.slots.find((slot) => slot.group === group) ?? null;

const asDerived = (slot: FinalExamSlot | null): ResolvedFinalExam | null =>
  slot ? { ...slot, source: "derived" } : null;

/**
 * Derive a class's final exam sitting from the registrar's per-term exam
 * group calendar. Returns null when the term has no calendar, the class
 * has no seated final during the exam period (codes N/A/L), or the
 * meeting pattern/start time is not covered by the calendar.
 */
export const getDerivedFinalExam = (
  _class: FinalExamClassInput
): ResolvedFinalExam | null => {
  const calendar = FINAL_EXAM_CALENDARS[`${_class.year} ${_class.semester}`];
  if (!calendar) return null;

  // N: no final; A: alternative assessment; L: final at last class meeting.
  // None of these sit during the scheduled exam period.
  if (
    _class.finalExam === "N" ||
    _class.finalExam === "A" ||
    _class.finalExam === "L"
  ) {
    return null;
  }

  const courseRule = calendar.courseRules.find(
    (rule) =>
      rule.subject === _class.subject &&
      rule.courseNumbers.includes(_class.courseNumber)
  );
  if (courseRule) return asDerived(getSlot(calendar, courseRule.group));

  // C: common final scheduled by the department; not derivable from the
  // meeting pattern unless the course is explicitly listed above.
  if (_class.finalExam === "C") return null;

  const instructionMode = _class.primarySection?.instructionMode;
  if (instructionMode === "O" || instructionMode === "W") {
    return asDerived(getSlot(calendar, calendar.onlineGroup));
  }

  const meeting = _class.primarySection?.meetings?.find((meeting) =>
    meeting.days?.some((day) => day)
  );
  if (!meeting?.days) return null;

  const category = getDayCategory(meeting.days);
  if (category === null) return null;
  if (category === "weekend") {
    return asDerived(getSlot(calendar, calendar.weekendGroup));
  }

  if (!meeting.startTime) return null;
  const startMinutes = toMinutes(meeting.startTime);
  // 00:00 is SIS's "time to be determined" placeholder.
  if (!startMinutes) return null;

  const rule = calendar.startTimeRules.find((rule) => {
    if (rule.category !== category) return false;
    if (rule.startTimes) {
      return rule.startTimes.some(
        (time) => toMinutes(time) === startMinutes
      );
    }
    if (rule.startAtOrAfter) {
      const threshold = toMinutes(rule.startAtOrAfter);
      return threshold !== null && startMinutes >= threshold;
    }
    return false;
  });
  return asDerived(getSlot(calendar, rule?.group));
};

/** The SIS-published final exam for a section, if scheduled. */
export const getSisFinalExam = (
  exams: FinalExamExam[] | null | undefined
): ResolvedFinalExam | null => {
  const exam = exams?.find(
    (exam) =>
      exam.type === "FIN" && exam.date && exam.startTime && exam.endTime
  );
  if (!exam) return null;
  return {
    date: normalizeDate(exam.date!),
    startTime: exam.startTime!,
    endTime: exam.endTime!,
    location: exam.location,
    source: "sis",
  };
};

/**
 * Resolve a class's final exam: prefer the SIS-published exam on the
 * primary section, falling back to the registrar's exam group calendar.
 */
export const getClassFinalExam = (
  _class: FinalExamClassInput
): ResolvedFinalExam | null =>
  getSisFinalExam(_class.primarySection?.exams) ?? getDerivedFinalExam(_class);

interface ScheduleClassLike {
  hidden?: boolean | null;
  class: Omit<FinalExamClassInput, "year" | "semester"> & { number: string };
}

export interface ScheduleFinalExamEntry {
  exam: ResolvedFinalExam | null;
  /** Display names of classes whose finals overlap with this one. */
  conflicts: string[];
}

/** Key identifying a class within a schedule's final exam map. */
export const finalExamKey = (_class: {
  subject: string;
  courseNumber: string;
  number: string;
}): string => `${_class.subject}-${_class.courseNumber}-${_class.number}`;

/**
 * Resolve the final exam for every class in a schedule and find overlaps
 * between them. Hidden classes get their exam resolved but do not
 * participate in conflicts, mirroring meeting-time conflict behavior.
 */
export const getScheduleFinalExams = (schedule: {
  year: number;
  semester: string;
  classes: ScheduleClassLike[];
}): Map<string, ScheduleFinalExamEntry> => {
  const entries = schedule.classes.map(({ class: _class, hidden }) => ({
    key: finalExamKey(_class),
    label: `${_class.subject} ${_class.courseNumber}`,
    hidden: hidden ?? false,
    exam: getClassFinalExam({
      ..._class,
      year: schedule.year,
      semester: schedule.semester,
    }),
  }));

  const map = new Map<string, ScheduleFinalExamEntry>();
  for (const entry of entries) {
    map.set(entry.key, { exam: entry.exam, conflicts: [] });
  }
  for (const entry of entries) {
    if (entry.hidden || !entry.exam) continue;
    for (const other of entries) {
      if (other === entry || other.hidden || !other.exam) continue;
      if (finalExamsOverlap(entry.exam, other.exam)) {
        map.get(entry.key)?.conflicts.push(other.label);
      }
    }
  }
  return map;
};

/** Whether two final exam sittings overlap in time on the same day. */
export const finalExamsOverlap = (
  a: ResolvedFinalExam,
  b: ResolvedFinalExam
): boolean => {
  if (a.date !== b.date) return false;
  const aStart = toMinutes(a.startTime);
  const aEnd = toMinutes(a.endTime);
  const bStart = toMinutes(b.startTime);
  const bEnd = toMinutes(b.endTime);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
    return false;
  }
  return aStart < bEnd && bStart < aEnd;
};

/** Format "YYYY-MM-DD" as e.g. "Mon 12/14" without timezone pitfalls. */
export const formatFinalExamDate = (date: string): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const [, year, month, day] = match;
  const local = new Date(Number(year), Number(month) - 1, Number(day));
  const weekday = local.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday} ${Number(month)}/${Number(day)}`;
};

/** Format "HH:MM(:SS)" start/end as e.g. "8–11 AM" or "11:30 AM–2:30 PM". */
export const formatFinalExamTime = (
  startTime: string,
  endTime: string
): string | null => {
  const format = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    const base = `${hours % 12 || 12}${minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : ""}`;
    return { base, meridiem: hours < 12 ? "AM" : "PM" };
  };
  const start = format(startTime);
  const end = format(endTime);
  if (!start || !end) return null;
  return start.meridiem === end.meridiem
    ? `${start.base}–${end.base} ${end.meridiem}`
    : `${start.base} ${start.meridiem}–${end.base} ${end.meridiem}`;
};
