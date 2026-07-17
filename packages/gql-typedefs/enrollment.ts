import { gql } from "graphql-tag";

export const enrollmentTypeDef = gql`
  type Query {
    enrollment(
      year: Int!
      semester: Semester!
      sessionId: SessionIdentifier
      subject: String!
      courseNumber: CourseNumber!
      sectionNumber: SectionNumber!
    ): Enrollment

    enrollmentTimeframes(
      year: Int!
      semester: Semester!
    ): [EnrollmentTimeframe!]!
  }

  type Mutation {
    """
    Fetch live enrollment from classes.berkeley.edu for this class's primary
    section, persist it, and return the updated enrollment history.
    """
    refreshClassEnrollment(
      year: Int!
      semester: Semester!
      sessionId: SessionIdentifier
      subject: String!
      courseNumber: CourseNumber!
      number: ClassNumber!
    ): Enrollment!
  }

  type EnrollmentTimeframe {
    phase: Int
    isAdjustment: Boolean!
    group: String!
    startDate: String!
    endDate: String
    startEventSummary: String
  }

  type Enrollment @cacheControl(maxAge: 60) {
    "Identifiers"
    termId: TermIdentifier!
    year: Int!
    semester: Semester!
    sessionId: SessionIdentifier!
    sectionId: SectionIdentifier!
    subject: String!
    courseNumber: CourseNumber!
    sectionNumber: SectionNumber!

    "Attributes"
    history: [EnrollmentSingular!]!
    latest: EnrollmentSingular
  }

  type RequirementGroupDescriptor {
    code: String
    description: String!
  }

  type EnrollmentSingular {
    startTime: String!
    endTime: String!
    granularitySeconds: Int!
    status: EnrollmentStatus
    enrolledCount: Int!
    reservedCount: Int!
    waitlistedCount: Int!
    minEnroll: Int
    maxEnroll: Int!
    maxWaitlist: Int!
    openReserved: Int!
    instructorAddConsentRequired: Boolean
    instructorDropConsentRequired: Boolean
    seatReservationCount: [SeatReservationCounts!]
    activeReservedMaxCount: Int!
  }

  type SeatReservationCounts {
    number: Int!
    maxEnroll: Int!
    enrolledCount: Int!
    requirementGroup: RequirementGroupDescriptor!
    fromDate: String!
    isValid: Boolean!
  }

  enum EnrollmentStatus {
    "Closed"
    C

    "Open"
    O
  }
`;
