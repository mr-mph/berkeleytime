import classNames from "classnames";
import { Calendar, WarningTriangle } from "iconoir-react";

import { Tooltip } from "@repo/theme";

import {
  ResolvedFinalExam,
  formatFinalExamDate,
  formatFinalExamTime,
} from "@/lib/finalExam";

import styles from "./FinalExamChip.module.scss";

interface FinalExamChipProps {
  exam: ResolvedFinalExam;
  /** Display names of classes whose finals overlap with this one. */
  conflicts: string[];
}

export default function FinalExamChip({ exam, conflicts }: FinalExamChipProps) {
  const date = formatFinalExamDate(exam.date);
  const time = formatFinalExamTime(exam.startTime, exam.endTime);
  if (!date || !time) return null;

  const hasConflict = conflicts.length > 0;

  return (
    <Tooltip
      trigger={
        <span
          className={classNames(styles.chip, {
            [styles.conflict]: hasConflict,
          })}
        >
          {hasConflict ? (
            <WarningTriangle className={styles.icon} />
          ) : (
            <Calendar className={styles.icon} />
          )}
          {date}
        </span>
      }
      title="Final Exam"
      description={
        <div className={styles.details}>
          <span>
            {date} · {time}
          </span>
          {exam.source === "sis" ? (
            exam.location && <span>{exam.location}</span>
          ) : (
            <span className={styles.estimated}>
              Estimated from the UC Berkeley final exam schedule; confirm with
              the instructor.
            </span>
          )}
          {hasConflict && (
            <span className={styles.conflictText}>
              Overlaps with {conflicts.join(", ")}
            </span>
          )}
        </div>
      }
    />
  );
}
