import { OpenNewWindow } from "iconoir-react";

import { Breakpoint, Flex, useBreakpointMatch } from "@repo/theme";

import { AverageRating } from "@/components/AverageRating";
import { IInstructor } from "@/lib/api";

import Location from "../Location";
import Time from "../Time";
import styles from "./Details.module.scss";

interface DetailsProps {
  days?: boolean[] | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  instructors?: IInstructor[] | null;
}

export default function Details({
  days,
  startTime,
  endTime,
  location,
  instructors,
}: DetailsProps) {
  const breakpointMatch = useBreakpointMatch(Breakpoint.Medium);

  return (
    <Flex direction={{ initial: "column", md: "row" }} gap="4">
      <Flex
        direction="column"
        gap="2"
        flexGrow="1"
        flexShrink="1"
        flexBasis="0"
      >
        <p className={styles.title}>Time</p>
        <Time days={days} startTime={startTime} endTime={endTime} />
      </Flex>
      {breakpointMatch && <div className={styles.divider} />}
      <Flex
        direction="column"
        gap="2"
        flexGrow="1"
        flexShrink="1"
        flexBasis="0"
      >
        <p className={styles.title}>Location</p>
        <Location location={location} />
      </Flex>
      {breakpointMatch && <div className={styles.divider} />}
      <Flex
        direction="column"
        gap="2"
        flexGrow="1"
        flexShrink="1"
        flexBasis="0"
      >
        <p className={styles.title}>
          {instructors && instructors?.length > 1
            ? "Instructors"
            : "Instructor"}
        </p>
        {instructors && instructors.length > 0 ? (
          <div className={styles.instructorList}>
            {instructors.map((instructor, index) => {
              const name = [instructor.givenName, instructor.familyName]
                .filter(Boolean)
                .join(" ")
                .trim();
              const rmpUrl = instructor.rmpUrl ?? null;
              return (
                <div
                  key={`${name}-${index}`}
                  className={styles.instructorRow}
                >
                  <div className={styles.instructorName}>
                    <p className={styles.description}>{name || "Unknown"}</p>
                    {rmpUrl && (
                      <a
                        className={styles.rmpLink}
                        href={rmpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${name || "instructor"} on Rate My Professor`}
                        title="Rate My Professor"
                      >
                        <OpenNewWindow />
                      </a>
                    )}
                  </div>
                  <AverageRating
                    rating={instructor.rmpRating}
                    showNA
                    style={{ fontSize: 14, flexShrink: 0 }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p
            className={styles.description}
            style={{
              WebkitLineClamp: 2,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
            }}
          >
            To be determined
          </p>
        )}
      </Flex>
    </Flex>
  );
}
