import { Fragment } from "react";

import classNames from "classnames";
import { Eye, EyeClosed } from "iconoir-react";
import { HoverCard } from "radix-ui";

import { Tooltip } from "@repo/theme";

import {
  getEnrollmentColor,
  getEnrollmentHoverLabel,
} from "@/components/Capacity";
import Time from "@/components/Time";
import { IScheduleClass } from "@/lib/api";

import styles from "./TimeSlotGroup.module.scss";

type ScheduleSection = NonNullable<
  IScheduleClass["class"]["sections"]
>[number];
type PrimarySection = NonNullable<IScheduleClass["class"]["primarySection"]>;
type GroupableSection = ScheduleSection | PrimarySection;

interface TimeSlotGroupProps {
  sections: GroupableSection[];
  selectedSectionId?: number | null;
  blockedSectionIds: number[];
  editing?: boolean;
  onSectionSelect: (sectionNumber: string) => void;
  onSectionMouseOver: (sectionNumber: string) => void;
  onSectionMouseOut: () => void;
  onBlockToggle?: (blocked: boolean) => void;
}

const getPrimaryMeeting = (section: GroupableSection) =>
  section.meetings?.[0] ?? null;

function getSectionEnrollment(section: GroupableSection) {
  const enrolledCount = section.enrollment?.latest?.enrolledCount;
  const maxEnroll = section.enrollment?.latest?.maxEnroll;
  const waitlistedCount = section.enrollment?.latest?.waitlistedCount;
  return {
    color: getEnrollmentColor(
      enrolledCount ?? undefined,
      maxEnroll ?? undefined
    ),
    hoverLabel: getEnrollmentHoverLabel(
      enrolledCount,
      maxEnroll,
      waitlistedCount
    ),
  };
}

export default function TimeSlotGroup({
  sections,
  selectedSectionId = null,
  blockedSectionIds,
  editing = true,
  onSectionSelect,
  onSectionMouseOver,
  onSectionMouseOut,
  onBlockToggle,
}: TimeSlotGroupProps) {
  if (sections.length === 0) return null;

  const meeting = getPrimaryMeeting(sections[0]);
  const selectedSection =
    sections.find((section) => section.sectionId === selectedSectionId) ?? null;
  const allBlocked = sections.every((section) =>
    blockedSectionIds.includes(section.sectionId)
  );
  const active = selectedSection !== null && !allBlocked;

  return (
    <div
      className={classNames(styles.root, {
        [styles.active]: active,
        [styles.blocked]: allBlocked,
        [styles.noHover]: !editing,
      })}
    >
      <HoverCard.Root openDelay={150} closeDelay={100}>
        <HoverCard.Trigger asChild>
          <button
            type="button"
            className={styles.main}
            disabled={allBlocked || !editing}
            onClick={(e) => {
              e.stopPropagation();
              if (allBlocked || !editing) return;
              if (selectedSection) {
                onSectionSelect(selectedSection.number);
                return;
              }
              const firstOpen = sections.find(
                (section) => !blockedSectionIds.includes(section.sectionId)
              );
              if (firstOpen) onSectionSelect(firstOpen.number);
            }}
            onMouseOver={() => {
              if (allBlocked || !editing) return;
              const preview = selectedSection ?? sections[0];
              onSectionMouseOver(preview.number);
            }}
            onMouseOut={() => {
              if (!allBlocked && editing) onSectionMouseOut();
            }}
          >
            <div className={styles.radioButton} />
            <p className={styles.title}>
              {sections.map((section, index) => {
                const { color } = getSectionEnrollment(section);
                return (
                  <span key={section.sectionId}>
                    {index > 0 && ", "}
                    <span style={{ color }}>{section.number}</span>
                  </span>
                );
              })}
            </p>
            <Time
              endTime={meeting?.endTime ?? null}
              startTime={meeting?.startTime ?? null}
              days={meeting?.days ?? null}
              className={styles.time}
            />
          </button>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content
            className={styles.hoverContent}
            side="right"
            align="start"
            sideOffset={8}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.hoverTitle}>Choose a section</div>
            {sections.map((section) => {
              const sectionMeeting = getPrimaryMeeting(section);
              const blocked = blockedSectionIds.includes(section.sectionId);
              const selected = section.sectionId === selectedSectionId;
              const { color, hoverLabel } = getSectionEnrollment(section);
              const option = (
                <button
                  type="button"
                  className={classNames(styles.option, {
                    [styles.selected]: selected,
                  })}
                  disabled={blocked || !editing}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (blocked || !editing) return;
                    onSectionSelect(section.number);
                  }}
                  onMouseOver={() => {
                    if (!blocked && editing) onSectionMouseOver(section.number);
                  }}
                  onMouseOut={() => {
                    if (!blocked && editing) onSectionMouseOut();
                  }}
                >
                  <span className={styles.optionNumber} style={{ color }}>
                    {section.number}
                  </span>
                  <span className={styles.optionLocation}>
                    {sectionMeeting?.location?.trim() || "Location TBD"}
                  </span>
                </button>
              );

              if (!hoverLabel) {
                return <Fragment key={section.sectionId}>{option}</Fragment>;
              }

              return (
                <Tooltip
                  key={section.sectionId}
                  trigger={option}
                  title={hoverLabel}
                  side="left"
                />
              );
            })}
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>
      {onBlockToggle && editing && (
        <Tooltip
          trigger={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBlockToggle(!allBlocked);
              }}
              className={styles.blockButton}
              title={allBlocked ? "Include sections" : "Exclude sections"}
            >
              {allBlocked ? (
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
          title={allBlocked ? "Include sections" : "Exclude sections"}
        />
      )}
    </div>
  );
}

export function getSectionMeetingKey(section: GroupableSection): string {
  const meeting = getPrimaryMeeting(section);
  if (!meeting) return `unscheduled:${section.sectionId}`;
  const daysKey = (meeting.days ?? []).map((day) => (day ? "1" : "0")).join("");
  return `${daysKey}|${meeting.startTime ?? ""}|${meeting.endTime ?? ""}`;
}

export function groupSectionsByMeetingTime(
  sections: GroupableSection[]
): GroupableSection[][] {
  const groups = new Map<string, GroupableSection[]>();
  for (const section of sections) {
    const key = getSectionMeetingKey(section);
    const existing = groups.get(key);
    if (existing) existing.push(section);
    else groups.set(key, [section]);
  }
  return [...groups.values()];
}
