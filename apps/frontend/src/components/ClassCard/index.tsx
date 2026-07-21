import { ComponentPropsWithRef, Fragment, ReactNode } from "react";

import classNames from "classnames";
import {
  ArrowSeparateVertical,
  ArrowUnionVertical,
  InfoCircle,
  Lock,
  Star,
  Trash,
} from "iconoir-react";

import { METRIC_ORDER } from "@repo/shared";
import { Badge, Card, Color as ThemeColor, Tooltip } from "@repo/theme";

import { AverageGrade } from "@/components/AverageGrade";
import { AverageRating } from "@/components/AverageRating";
import {
  getMetricStatus,
  getStatusColor,
} from "@/components/Class/Ratings/metricsUtil";
import EnrollmentDisplay from "@/components/EnrollmentDisplay";
import Units from "@/components/Units";
import { IClass, IClassCourse } from "@/lib/api";
import { IEnrollmentSingular } from "@/lib/api/enrollment";
import { Color, Semester } from "@/lib/generated/graphql";
import {
  findBestOpenMatch,
  formatReservedSeatsRemaining,
  getReservedSeatsRemaining,
  getSelectedReservedSeatGroups,
} from "@/lib/reservedSeatGroups";

import styles from "./ClassCard.module.scss";

const formatSemester = (semester: Semester): string => {
  switch (semester) {
    case Semester.Fall:
      return "Fall";
    case Semester.Spring:
      return "Spring";
    case Semester.Summer:
      return "Summer";
    default:
      return semester;
  }
};

const formatClassNumber = (number: string | undefined | null): string => {
  if (!number) return "";
  const num = parseInt(number, 10);
  if (isNaN(num)) return number;
  // If > 99, show as-is. Otherwise pad to 2 digits with leading zeros
  if (num > 99) return num.toString();
  return num.toString().padStart(2, "0");
};

type BaseClassFields = Pick<
  IClass,
  | "subject"
  | "courseNumber"
  | "number"
  | "title"
  | "unitsMax"
  | "unitsMin"
  | "gradeDistribution"
>;

type CourseSummary = Pick<IClassCourse, "title" | "gradeDistribution"> & {
  aggregatedRatings?: {
    metrics: Array<{
      metricName: string;
      count?: number;
      weightedAverage: number;
    }>;
  } | null;
};

type EnrollmentSnapshot = Pick<
  IEnrollmentSingular,
  "enrolledCount" | "maxEnroll" | "endTime" | "activeReservedMaxCount"
> & {
  seatReservations?: {
    description: string;
    enrolledCount: number;
    maxEnroll: number;
  }[];
};

type ClassCardClass = Partial<BaseClassFields> & {
  year?: number;
  semester?: Semester;
  course?: Partial<CourseSummary> | null;
  decal?: { title?: string | null } | null;
  rmpAverageRating?: number | null;
  rmpMatchedInstructorCount?: number | null;
  primarySection?: {
    enrollment?: {
      latest?: Partial<EnrollmentSnapshot> | null;
    } | null;
  } | null;
};

interface ClassProps {
  class?: ClassCardClass;
  expandable?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onDelete?: () => void;
  leftBorderColor?: Color;
  bookmarked?: boolean;
  bookmarkToggle?: () => void;
  active?: boolean;
  wrapDescription?: boolean;
  customActionMenu?: ReactNode;
  onUnlock?: () => void;
  topRightContent?: ReactNode;
  infoContent?: ReactNode;
  replaceInfoContent?: boolean;
  /** Keep footer enrollment/units/info/rating on one line (e.g. narrow sidebar). */
  singleLineInfo?: boolean;
  headingPrefix?: ReactNode;
  subtitle?: ReactNode;
  gradeInFooter?: boolean;
}

export default function ClassCard({
  class: _class,
  expandable = false,
  expanded,
  onExpandedChange,
  onDelete,
  leftBorderColor = undefined,
  bookmarked = false,
  children,
  active = false,
  wrapDescription = false,
  customActionMenu,
  onUnlock = undefined,
  topRightContent,
  infoContent,
  replaceInfoContent = false,
  singleLineInfo = false,
  headingPrefix,
  subtitle,
  gradeInFooter = false,
  ...props
}: ClassProps & Omit<ComponentPropsWithRef<"div">, keyof ClassProps>) {
  // bookmarked is part of the interface but not used in this component
  void bookmarked;
  const gradeDistribution =
    _class?.course?.gradeDistribution ?? _class?.gradeDistribution;
  const formattedClassNumber = formatClassNumber(_class?.number);

  const activeReservedMaxCount =
    _class?.primarySection?.enrollment?.latest?.activeReservedMaxCount ?? 0;
  const maxEnroll = _class?.primarySection?.enrollment?.latest?.maxEnroll ?? 0;
  const seatReservations =
    _class?.primarySection?.enrollment?.latest?.seatReservations;
  const openReservedMatch = findBestOpenMatch(
    seatReservations,
    getSelectedReservedSeatGroups()
  );
  const ratingsCount = _class?.course?.aggregatedRatings
    ? Math.max(
        0,
        ..._class.course.aggregatedRatings.metrics.map(
          (metric) => metric.count ?? 0
        )
      )
    : 0;

  return (
    <Card.RootColumn
      style={{ overflow: "visible", position: "relative", ...props?.style }}
      active={active}
      {...props}
    >
      {leftBorderColor && (
        <Card.LeftBorder
          color={leftBorderColor}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            height: "100%",
            backgroundColor: `var(--${leftBorderColor}-500)`,
          }}
        />
      )}
      <Card.ColumnHeader
        style={{
          overflow: "visible",
          // Offset content past the absolute 8px color bar
          marginLeft: leftBorderColor ? 8 : undefined,
        }}
      >
        <Card.Body>
          <div className={styles.cardContent}>
            <div className={styles.topRow}>
              <div className={styles.titleDescription}>
                <Card.Heading>
                  {headingPrefix ? (
                    <span className={styles.headingWithPrefix}>
                      <span className={styles.headingPrefix}>
                        {headingPrefix}
                      </span>
                      <span>
                        {_class?.subject} {_class?.courseNumber}
                        {formattedClassNumber && (
                          <>
                            {" "}
                            <span className={styles.sectionNumber}>
                              #{formattedClassNumber}
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                  ) : (
                    <>
                      {_class?.subject} {_class?.courseNumber}
                      {formattedClassNumber && (
                        <>
                          {" "}
                          <span className={styles.sectionNumber}>
                            #{formattedClassNumber}
                          </span>
                        </>
                      )}
                    </>
                  )}
                  {_class?.decal != null && (
                    <Badge
                      label="DeCal"
                      color={Color.Blue}
                      variant="filled"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </Card.Heading>
                <Card.Description wrapDescription={wrapDescription}>
                  {_class?.decal?.title ??
                    _class?.title ??
                    _class?.course?.title}
                </Card.Description>
                {subtitle ? (
                  <span className={styles.semester}>{subtitle}</span>
                ) : (
                  _class?.semester &&
                  _class?.year && (
                    <span className={styles.semester}>
                      {formatSemester(_class.semester)} {_class.year}
                    </span>
                  )
                )}
              </div>
              {((!gradeInFooter && gradeDistribution) || topRightContent) && (
                <div className={styles.gradeContainer}>
                  {!gradeInFooter && gradeDistribution && (
                    <AverageGrade
                      gradeDistribution={gradeDistribution}
                      style={{
                        marginTop: 0.5,
                        fontSize: 14,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        textAlign: "right",
                      }}
                    />
                  )}
                  {topRightContent}
                </div>
              )}
            </div>
            <Card.Footer
              className={classNames(styles.infoRow, {
                [styles.singleLine]: singleLineInfo,
              })}
            >
              {!replaceInfoContent && (
                <>
                  {gradeInFooter && gradeDistribution && (
                    <AverageGrade
                      gradeDistribution={gradeDistribution}
                      style={{
                        fontSize: 14,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <EnrollmentDisplay
                    enrolledCount={
                      _class?.primarySection?.enrollment?.latest?.enrolledCount
                    }
                    maxEnroll={
                      _class?.primarySection?.enrollment?.latest?.maxEnroll
                    }
                    time={_class?.primarySection?.enrollment?.latest?.endTime}
                  />
                  {_class?.unitsMin !== undefined &&
                    _class.unitsMax !== undefined && (
                      <Units
                        unitsMin={_class.unitsMin}
                        unitsMax={_class.unitsMax}
                      />
                    )}
                  {!singleLineInfo &&
                    (_class?.primarySection?.enrollment?.latest
                      ?.activeReservedMaxCount ?? 0) > 0 && (
                      <Tooltip
                        trigger={
                          <span
                            className={classNames(styles.reservedSeating, {
                              [styles.reservedSeatingHighlight]:
                                !!openReservedMatch,
                            })}
                          >
                            <InfoCircle className={styles.reservedSeatingIcon} />
                            {openReservedMatch
                              ? `${getReservedSeatsRemaining(openReservedMatch.enrolledCount, openReservedMatch.maxEnroll).toLocaleString()} Rsvd`
                              : "Rsvd"}
                          </span>
                        }
                        title="Reserved Seating"
                        description={
                          openReservedMatch
                            ? `${openReservedMatch.description}: ${formatReservedSeatsRemaining(openReservedMatch.enrolledCount, openReservedMatch.maxEnroll)} reserved seats left.`
                            : `${activeReservedMaxCount.toLocaleString()} out of ${maxEnroll.toLocaleString()} seats for this class are reserved.`
                        }
                      />
                    )}
                  {ratingsCount > 0 && (
                    <Tooltip
                      trigger={
                        <span className={styles.ratingsCount}>
                          <Star className={styles.ratingsIcon} />
                          {ratingsCount}
                        </span>
                      }
                      title="Ratings"
                      description={
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "auto max-content",
                            gap: "8px 12px",
                            alignItems: "center",
                            width: "max-content",
                          }}
                        >
                          {METRIC_ORDER.map((metricName) => {
                            const metric =
                              _class?.course?.aggregatedRatings?.metrics?.find(
                                (m) => m.metricName === metricName
                              );
                            if (!metric) return null;
                            const status = getMetricStatus(
                              metricName,
                              metric.weightedAverage
                            );
                            const color = getStatusColor(
                              metricName,
                              metric.weightedAverage
                            );
                            return (
                              <Fragment key={metricName}>
                                <span>{metricName}</span>
                                <div style={{ width: "fit-content" }}>
                                  <Badge
                                    color={color as ThemeColor}
                                    label={status}
                                  />
                                </div>
                              </Fragment>
                            );
                          })}
                        </div>
                      }
                    />
                  )}
                </>
              )}
              {infoContent}
              <div className={styles.ratingEnd}>
                <AverageRating
                  rating={
                    _class?.rmpMatchedInstructorCount === 0
                      ? null
                      : _class?.rmpAverageRating
                  }
                  showNA
                  style={{
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                />
              </div>
            </Card.Footer>
          </div>
        </Card.Body>
        {(onUnlock || customActionMenu || onDelete || expandable) && (
          <div className={styles.actionsColumn} data-actions>
            <div className={styles.actionsTop}>
              {onUnlock && (
                <Card.ActionIcon
                  data-action-icon
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onUnlock();
                  }}
                >
                  <Lock />
                </Card.ActionIcon>
              )}
              {customActionMenu ? (
                customActionMenu
              ) : (
                <>
                  {onDelete && (
                    <Card.ActionIcon
                      data-action-icon
                      isDelete
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDelete();
                      }}
                    >
                      <Trash />
                    </Card.ActionIcon>
                  )}
                </>
              )}
            </div>
            {expandable && onExpandedChange !== undefined && (
              <div className={styles.actionsBottom}>
                <Card.ActionIcon
                  data-action-icon
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onExpandedChange(!expanded);
                  }}
                >
                  {expanded ? (
                    <ArrowUnionVertical />
                  ) : (
                    <ArrowSeparateVertical />
                  )}
                </Card.ActionIcon>
              </div>
            )}
          </div>
        )}
      </Card.ColumnHeader>
      {expanded && <Card.ColumnBody>{children}</Card.ColumnBody>}
    </Card.RootColumn>
  );
}
