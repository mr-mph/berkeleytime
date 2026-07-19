import { useMemo, useState } from "react";

import {
  Clock,
  InfoCircle,
  WarningCircle,
  WarningTriangle,
} from "iconoir-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Input,
  Tooltip,
} from "@repo/theme";

import useClass from "@/hooks/useClass";

import styles from "./Articulations.module.scss";

const FILTER_THRESHOLD = 10;

// distinct icons keyed off ASSIST's recurring note phrasings: triangle for
// extra coursework required after transfer, clock for an agreement about to
// change, circle-! for restricted or partial articulation, circle-i otherwise
const iconForNote = (note: string) => {
  if (/\buniversity course\b/i.test(note)) return WarningTriangle;
  if (/\b(revised|effective)\b/i.test(note)) return Clock;
  if (/\b(only|not articulated|does not include|limitation)\b/i.test(note))
    return WarningCircle;
  return InfoCircle;
};

const groupNotesByIcon = (notes: string[]) => {
  const groups = new Map<typeof InfoCircle, string[]>();
  for (const note of notes) {
    const icon = iconForNote(note);
    groups.set(icon, [...(groups.get(icon) ?? []), note]);
  }
  return [...groups.entries()];
};

export default function Articulations() {
  const { course } = useClass();
  const [filter, setFilter] = useState("");

  const articulations = useMemo(
    () => course.articulations ?? [],
    [course.articulations]
  );

  // agreements are pulled per college and can lag a year behind the rest
  const primaryYear = useMemo(() => {
    const counts = new Map<string, number>();
    for (const articulation of articulations) {
      counts.set(
        articulation.academicYear,
        (counts.get(articulation.academicYear) ?? 0) + 1
      );
    }
    return [...counts.entries()].toSorted((a, b) => b[1] - a[1])[0]?.[0];
  }, [articulations]);

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return articulations;
    return articulations.filter((articulation) =>
      articulation.institutionName.toLowerCase().includes(query)
    );
  }, [articulations, filter]);

  if (articulations.length === 0) return null;

  return (
    <div>
      <p className={styles.sectionLabel}>Transfer Equivalents</p>
      <Accordion type="single" collapsible>
        <AccordionItem value="articulations" className={styles.item}>
          <AccordionTrigger className={styles.trigger}>
            Available at {articulations.length} California community college
            {articulations.length === 1 ? "" : "s"}
          </AccordionTrigger>
          <AccordionContent className={styles.content}>
            {articulations.length > FILTER_THRESHOLD && (
              <Input
                className={styles.filter}
                placeholder="Search colleges..."
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            )}
            <div className={styles.list}>
              {filtered.map((articulation) => (
                <div
                  key={`${articulation.institutionId}-${articulation.seriesWith?.join()}`}
                  className={styles.row}
                >
                  <div className={styles.college}>
                    <a
                      href={articulation.assistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.collegeLink}
                    >
                      {articulation.institutionName}
                    </a>
                    {articulation.academicYear !== primaryYear && (
                      <span className={styles.yearNote}>
                        {articulation.academicYear}
                      </span>
                    )}
                  </div>
                  <div className={styles.equivalent}>
                    <span>
                      {articulation.options.map((option, optionIndex) => (
                        <span key={optionIndex}>
                          {optionIndex > 0 && (
                            <span className={styles.conjunction}> or </span>
                          )}
                          <span className={styles.courses}>
                            {option.courses.map((course, courseIndex) => (
                              <span
                                key={courseIndex}
                                title={course.title ?? undefined}
                              >
                                {courseIndex > 0 && (
                                  <span className={styles.conjunction}>
                                    {" + "}
                                  </span>
                                )}
                                {course.prefix} {course.number}
                              </span>
                            ))}
                          </span>
                        </span>
                      ))}
                    </span>
                    {articulation.notes &&
                      articulation.notes.length > 0 &&
                      groupNotesByIcon(articulation.notes).map(
                        ([NoteIcon, notes]) => (
                          <Tooltip
                            key={notes[0]}
                            trigger={
                              <NoteIcon
                                className={styles.noteIcon}
                                width={14}
                              />
                            }
                            content={notes.join(" ")}
                          />
                        )
                      )}
                    {articulation.seriesWith &&
                      articulation.seriesWith.length > 0 && (
                        <div className={styles.seriesNote}>
                          together with {articulation.seriesWith.join(", ")}
                        </div>
                      )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className={styles.empty}>No colleges match your search.</p>
              )}
            </div>
            <p className={styles.attribution}>
              Course-to-course articulations from{" "}
              <a
                href="https://assist.org"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.collegeLink}
              >
                ASSIST.org
              </a>{" "}
              agreements{primaryYear ? ` (${primaryYear})` : ""}. Click a
              college to verify on the official agreement.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
