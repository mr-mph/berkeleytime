import { gql } from "@apollo/client";

import {
  EnrollmentSingular,
  GetEnrollmentQuery,
  GetEnrollmentTimeframesQuery,
} from "../generated/graphql";

export type IEnrollmentSingular = EnrollmentSingular;

export type IEnrollment = NonNullable<GetEnrollmentQuery["enrollment"]>;

export type ISeatReservationCounts = NonNullable<
  NonNullable<
    GetEnrollmentQuery["enrollment"]
  >["history"][number]["seatReservationCount"]
>[number];

export type IReservationType = NonNullable<
  NonNullable<GetEnrollmentQuery["enrollment"]>["seatReservationTypes"]
>[number];

export type IEnrollmentTimeframe =
  GetEnrollmentTimeframesQuery["enrollmentTimeframes"][number];

export const READ_ENROLLMENT = gql`
  query GetEnrollment(
    $year: Int!
    $semester: Semester!
    $sessionId: SessionIdentifier
    $subject: String!
    $courseNumber: CourseNumber!
    $sectionNumber: SectionNumber!
  ) {
    enrollment(
      year: $year
      semester: $semester
      sessionId: $sessionId
      subject: $subject
      courseNumber: $courseNumber
      sectionNumber: $sectionNumber
    ) {
      year
      semester
      sessionId
      sectionId
      subject
      courseNumber
      sectionNumber
      history {
        startTime
        endTime
        granularitySeconds
        status
        enrolledCount
        waitlistedCount
        reservedCount
        minEnroll
        maxEnroll
        maxWaitlist
        openReserved
        activeReservedMaxCount
        seatReservationCount {
          maxEnroll
          enrolledCount
          requirementGroup {
            description
          }
          isValid
        }
      }
    }
  }
`;

export const READ_ENROLLMENT_TIMEFRAMES = gql`
  query GetEnrollmentTimeframes($year: Int!, $semester: Semester!) {
    enrollmentTimeframes(year: $year, semester: $semester) {
      phase
      isAdjustment
      group
      startDate
      endDate
      startEventSummary
    }
  }
`;

export const REFRESH_CLASS_ENROLLMENT = gql`
  mutation RefreshClassEnrollment(
    $year: Int!
    $semester: Semester!
    $sessionId: SessionIdentifier
    $subject: String!
    $courseNumber: CourseNumber!
    $number: ClassNumber!
  ) {
    refreshClassEnrollment(
      year: $year
      semester: $semester
      sessionId: $sessionId
      subject: $subject
      courseNumber: $courseNumber
      number: $number
    ) {
      year
      semester
      sessionId
      sectionId
      subject
      courseNumber
      sectionNumber
      latest {
        startTime
        endTime
        enrolledCount
        waitlistedCount
        maxEnroll
        maxWaitlist
        activeReservedMaxCount
        status
      }
    }
  }
`;
