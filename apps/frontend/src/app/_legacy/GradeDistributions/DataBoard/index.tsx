import { useMemo } from "react";

import { AverageGrade, ColoredGrade } from "@/components/AverageGrade";
import CourseSideMetrics, {
  type CourseMetric,
} from "@/components/CourseSideMetrics";
import { useReadCourseGradeDist, useReadCourseTitle } from "@/hooks/api";
import { IGradeDistribution } from "@/lib/api";
import { Semester } from "@/lib/generated/graphql";
import { LETTER_GRADES } from "@/lib/grades";

interface DataBoardProps {
  color: string;
  subject: string;
  courseNumber: string;
  gradeDistribution?: IGradeDistribution;
  givenName?: string;
  familyName?: string;
  semester?: Semester;
  year?: number;
  hoveredLetter: string | null;
}

const GRADE_STYLE = { display: "inline-block", marginRight: "4px" };

function addOrdinalSuffix(n: string) {
  if (n === "11" || n === "12" || n === "13") return n + "th";

  switch (n.charAt(n.length - 1)) {
    case "1":
      return n + "st";
    case "2":
      return n + "nd";
    case "3":
      return n + "rd";
    default:
      return n + "th";
  }
}

export default function DataBoard({
  color,
  subject,
  courseNumber,
  gradeDistribution,
  givenName,
  familyName,
  semester,
  year,
  hoveredLetter,
}: DataBoardProps) {
  const { data: courseData } = useReadCourseGradeDist(subject, courseNumber);
  const { data: courseTitleData } = useReadCourseTitle(subject, courseNumber);

  const courseGradeDist = useMemo(
    () => courseData?.gradeDistribution ?? null,
    [courseData]
  );

  const {
    lower: lowerPercentile,
    upper: upperPercentile,
    count: hoveredCount,
    total: gradeDistTotal,
    percent: hoveredPercent,
  } = useMemo(() => {
    const ret: {
      lower: string | null;
      upper: string | null;
      count: number | null;
      total: number;
      percent: number;
    } = { lower: null, upper: null, count: null, total: 0, percent: 0 };
    if (!gradeDistribution || !hoveredLetter) return ret;

    // Raw counts feed the "count/total" display; percentile and percentage
    // math follow the API's recency-weighted percentage field so they agree
    // with the chart bars. Both exclude P/NP grades.
    let letterShare = 0;
    gradeDistribution.distribution?.forEach((g) => {
      // Only count letter grades (A+ through F), exclude P and NP
      if (LETTER_GRADES.includes(g.letter as (typeof LETTER_GRADES)[number])) {
        ret.total += g.count;
        letterShare += g.percentage;
      }
    });

    // Use only letter grades for percentile calculation
    LETTER_GRADES.reduce((acc, grade) => {
      if (grade === hoveredLetter) {
        const upperValue =
          letterShare > 0
            ? (((letterShare - acc) * 100) / letterShare).toFixed(0)
            : "0";
        ret.upper = addOrdinalSuffix(upperValue);
      }
      const hoveredGrade = gradeDistribution.distribution?.find(
        (g) => g.letter === grade
      );
      acc += hoveredGrade?.percentage ?? 0;
      if (grade === hoveredLetter) {
        const lowerValue =
          letterShare > 0
            ? (((letterShare - acc) * 100) / letterShare).toFixed(0)
            : "0";
        ret.lower = addOrdinalSuffix(lowerValue);
        ret.count = hoveredGrade?.count ?? 0;
        ret.percent =
          letterShare > 0
            ? ((hoveredGrade?.percentage ?? 0) / letterShare) * 100
            : 0;
      }
      return acc;
    }, 0);
    return ret;
  }, [hoveredLetter, gradeDistribution]);

  const title = gradeDistribution
    ? `${subject} ${courseNumber}`
    : "No Class Selected";

  const metadata = gradeDistribution
    ? `${semester && year ? `${semester} ${year}` : "All Semesters"} • ${
        givenName && familyName
          ? `${givenName} ${familyName}`
          : "All Instructors"
      }`
    : "No Semester or Instructor Data";

  const metrics: CourseMetric[] = [
    {
      label: "Course Average",
      value: courseGradeDist ? (
        <span>
          <AverageGrade
            style={GRADE_STYLE}
            gradeDistribution={courseGradeDist}
          />
          ({courseGradeDist.average?.toFixed(3)})
        </span>
      ) : (
        "No data"
      ),
    },
    {
      label: "Section Average",
      value: gradeDistribution ? (
        <>
          <AverageGrade
            style={GRADE_STYLE}
            gradeDistribution={gradeDistribution}
            tooltip="for this instructor/semester combination"
          />
          ({gradeDistribution.average?.toFixed(3)})
        </>
      ) : (
        "No data"
      ),
    },
  ];

  if (hoveredLetter) {
    // Only show percentile for letter grades (not P/NP)
    if (
      LETTER_GRADES.includes(hoveredLetter as (typeof LETTER_GRADES)[number])
    ) {
      metrics.push({
        label: `${lowerPercentile} - ${upperPercentile} Percentile`,
        value: (
          <>
            <ColoredGrade style={GRADE_STYLE} grade={hoveredLetter} />(
            {hoveredCount}/{gradeDistTotal}, {hoveredPercent.toFixed(1)}%)
          </>
        ),
      });
    } else {
      // For P/NP grades, just show the count without percentile
      const pnpGrade = gradeDistribution?.distribution?.find(
        (g) => g.letter === hoveredLetter
      );
      const pnpCount = pnpGrade?.count ?? 0;
      const totalAll =
        gradeDistribution?.distribution?.reduce((acc, g) => acc + g.count, 0) ??
        0;
      metrics.push({
        label: hoveredLetter,
        value: (
          <>
            <ColoredGrade style={GRADE_STYLE} grade={hoveredLetter} />(
            {pnpCount}/{totalAll}, {((pnpGrade?.percentage ?? 0) * 100).toFixed(1)}
            %)
          </>
        ),
      });
    }
  }

  return (
    <CourseSideMetrics
      color={color}
      courseTitle={title}
      classTitle={courseTitleData?.title ?? undefined}
      metadata={metadata}
      metrics={metrics}
    />
  );
}
