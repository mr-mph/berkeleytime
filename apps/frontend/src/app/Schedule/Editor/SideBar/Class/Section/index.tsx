import classNames from "classnames";
import { Eye, EyeClosed } from "iconoir-react";

import { Tooltip } from "@repo/theme";

import CCN from "@/components/CCN";
import {
  getEnrollmentColor,
  getEnrollmentHoverLabel,
} from "@/components/Capacity";
import Time from "@/components/Time";
import { IScheduleClass } from "@/lib/api";

import styles from "./Section.module.scss";

type ScheduleSection = NonNullable<
  IScheduleClass["class"]["sections"]
>[number];
type PrimarySection = NonNullable<IScheduleClass["class"]["primarySection"]>;

interface SectionProps {
  onSectionSelect?: () => void;
  onSectionMouseOver: () => void;
  onSectionMouseOut: () => void;
  onBlockToggle?: () => void;
  active: boolean;
  blocked?: boolean;
  editing?: boolean;
  showCcn?: boolean;
  sectionId: ScheduleSection["sectionId"] | PrimarySection["sectionId"];
  number: ScheduleSection["number"] | PrimarySection["number"];
  meetings: ScheduleSection["meetings"] | PrimarySection["meetings"];
  enrollment?: ScheduleSection["enrollment"] | PrimarySection["enrollment"];
}

export default function Section({
  onSectionSelect,
  onSectionMouseOver,
  onSectionMouseOut,
  onBlockToggle,
  active,
  blocked = false,
  editing = true,
  showCcn = true,
  sectionId,
  number,
  meetings,
  enrollment,
}: SectionProps) {
  const meetingsAdjusted = meetings.length > 0 ? meetings : [null];
  const enrolledCount = enrollment?.latest?.enrolledCount;
  const maxEnroll = enrollment?.latest?.maxEnroll;
  const waitlistedCount = enrollment?.latest?.waitlistedCount;
  const enrollmentColor = getEnrollmentColor(
    enrolledCount ?? undefined,
    maxEnroll ?? undefined
  );
  const enrollmentHoverLabel = getEnrollmentHoverLabel(
    enrolledCount,
    maxEnroll,
    waitlistedCount
  );

  return meetingsAdjusted.map((meeting) => (
    <div
      className={classNames(styles.root, {
        [styles.active]: active && !blocked,
        [styles.blocked]: blocked,
        [styles.noHover]: !editing,
      })}
      key={sectionId}
      onClick={(e) => {
        if (blocked) return;
        e.stopPropagation();
        onSectionSelect?.();
      }}
      onMouseOver={() => !blocked && onSectionMouseOver()}
      onMouseOut={() => !blocked && onSectionMouseOut()}
    >
      <div className={styles.radioButton} />
      {enrollmentHoverLabel ? (
        <Tooltip
          trigger={
            <p className={styles.title} style={{ color: enrollmentColor }}>
              {number}
            </p>
          }
          title={enrollmentHoverLabel}
        />
      ) : (
        <p className={styles.title}>{number}</p>
      )}
      {showCcn && <CCN sectionId={sectionId} tooltip={false} />}
      <Time
        endTime={meeting?.endTime ?? null}
        startTime={meeting?.startTime ?? null}
        days={meeting?.days ?? null}
        className={styles.time}
      />
      {onBlockToggle && (
        <Tooltip
          trigger={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBlockToggle();
              }}
              className={styles.blockButton}
              title={blocked ? "Include section" : "Exclude section"}
            >
              {blocked ? (
                <EyeClosed
                  width={14}
                  height={14}
                  color="var(--paragraph-color)"
                />
              ) : (
                <Eye width={14} height={14} color="var(--paragraph-color)" />
              )}
            </button>
          }
          title={blocked ? "Include section" : "Exclude section"}
        />
      )}
    </div>
  ));
}
