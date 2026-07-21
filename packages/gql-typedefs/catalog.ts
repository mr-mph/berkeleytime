import { gql } from "graphql-tag";

export const catalogTypeDef = gql`
  enum CatalogSortBy {
    RELEVANCE
    UNITS
    AVERAGE_GRADE
    OPEN_SEATS
    BERKELEYTIME_AVERAGE_RATING
    BERKELEYTIME_RATING_COUNT
    A_PLUS_A_PERCENT
    RMP_AVERAGE_RATING
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum EnrollmentFilterType {
    OPEN
    NON_RESERVED_OPEN
    WAITLIST_OPEN
    OPEN_FOR_YOU
    RESERVED_SEATS
  }

  input CatalogCourseIdentifierInput {
    subject: String!
    courseNumber: String!
  }

  input CatalogFilters {
    levels: [String!]
    departments: [String!]
    unitsMin: Float
    unitsMax: Float
    days: [Int!]
    timeFrom: String
    timeTo: String
    enrollmentFilter: EnrollmentFilterType
    gradingFilters: [String!]
    breadths: [String!]
    universityRequirements: [String!]
    courseIdentifiers: [CatalogCourseIdentifierInput!]
    online: Boolean
    "Requirement-group descriptions the user identifies with (filter-as-identity)."
    reservedSeatGroups: [String!]
  }

  type CatalogMeeting {
    days: [Boolean!]
    startTime: String
    endTime: String
    location: String
    instructors: [CatalogInstructor!]!
  }

  type CatalogInstructor {
    familyName: String
    givenName: String
  }

  type CatalogExam {
    date: String
    startTime: String
    endTime: String
    location: String
    type: String
  }

  type CatalogSectionAttribute {
    attribute: SectionAttributeInfo
    value: SectionAttributeInfo
  }

  type CatalogSectionEnrollment {
    enrollmentStatus: String
    enrolledCount: Int
    maxEnroll: Int
    waitlistedCount: Int
    maxWaitlist: Int
  }

  type CatalogSection {
    sectionId: String!
    number: String
    component: String
    online: Boolean
    meetings: [CatalogMeeting!]
    enrollmentStatus: String
    enrolledCount: Int
    maxEnroll: Int
    waitlistedCount: Int
    maxWaitlist: Int
  }

  type CatalogDeCal {
    title: String
  }

  type CatalogMetric {
    metricName: String!
    count: Int!
    weightedAverage: Float!
  }

  type CatalogAggregatedRatings {
    metrics: [CatalogMetric!]!
  }

  type CatalogClass {
    "Identity"
    year: Int!
    semester: String!
    termId: String!
    sessionId: String!
    subject: String!
    courseNumber: String!
    number: String!
    courseId: String!

    "Class fields"
    title: String
    description: String
    gradingBasis: String
    finalExam: String
    unitsMin: Float!
    unitsMax: Float!

    "Course fields"
    courseTitle: String
    courseDescription: String
    departmentNicknames: String
    academicCareer: String
    academicOrganization: String
    academicOrganizationName: String
    allTimeAverageGrade: Float
    allTimePassCount: Int
    allTimeNoPassCount: Int

    "Primary section"
    primarySectionId: String
    primaryComponent: String
    primaryOnline: Boolean
    sectionAttributes: [CatalogSectionAttribute!]
    meetings: [CatalogMeeting!]
    exams: [CatalogExam!]

    "Pre-computed"
    level: String
    breadthRequirements: [String!]
    universityRequirements: [String!]

    "Enrollment"
    enrollmentStatus: String
    enrolledCount: Int
    maxEnroll: Int
    waitlistedCount: Int
    maxWaitlist: Int
    activeReservedMaxCount: Int
    "Active reserved-seat groups (same labels as Reserved Seating hover card)"
    seatReservations: [CatalogSeatReservation!]
    "When primary enrollment was last scraped/updated"
    enrollmentUpdatedAt: ISODate

    "DeCal"
    decal: CatalogDeCal

    "Secondary sections"
    sections: [CatalogSection!]

    "Pre-computed sort"
    openSeats: Int
    rmpAverageRating: Float
    "Number of instructors with a real RMP rating (N/A instructors excluded)"
    rmpMatchedInstructorCount: Int

    "Stats"
    viewCount: Int
    aggregatedRatings: CatalogAggregatedRatings

    "Requirement designation"
    requirementDesignation: SectionAttributeInfo
  }

  type CatalogSeatReservation {
    description: String!
    enrolledCount: Int!
    maxEnroll: Int!
  }

  type CatalogResult {
    results: [CatalogClass!]!
    totalCount: Int!
  }

  type CatalogDepartment {
    code: String!
    name: String!
  }

  type CatalogTimeRange {
    minStartTime: String!
    maxEndTime: String!
  }

  type CatalogFilterOptions {
    departments: [CatalogDepartment!]!
    levels: [String!]!
    gradingOptions: [String!]!
    breadthRequirements: [String!]!
    universityRequirements: [String!]!
    reservedSeatGroups: [String!]!
    semesters: [CatalogSemester!]!
    timeRange: CatalogTimeRange
  }

  type CatalogSemester {
    year: Int!
    semester: String!
  }

  type CatalogClassIdentity {
    subject: String!
    courseNumber: String!
    number: String!
    sessionId: String!
  }

  type Query {
    catalog(year: Int!, semester: Semester!): [Class!]!

    catalogSearch(
      year: Int!
      semester: Semester!
      search: String
      filters: CatalogFilters
      sortBy: CatalogSortBy
      sortOrder: SortOrder
      page: Int
      pageSize: Int
      semanticSearch: Boolean
    ): CatalogResult!

    catalogClassIdentities(
      year: Int!
      semester: Semester!
    ): [CatalogClassIdentity!]!

    catalogFilterOptions(year: Int!, semester: Semester!): CatalogFilterOptions!
  }
`;
