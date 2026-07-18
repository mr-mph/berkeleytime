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
    # When true with both breadths and courseIdentifiers, match either (OR).
    # Default / false keeps the usual AND between those filters.
    orBreadthsWithCourseIdentifiers: Boolean
    online: Boolean
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
    enrollmentUpdatedAt: ISODate

    "Secondary sections"
    sections: [CatalogSection!]

    "Pre-computed sort"
    openSeats: Int
    rmpAverageRating: Float
    rmpMatchedInstructorCount: Int

    "Stats"
    viewCount: Int
    aggregatedRatings: CatalogAggregatedRatings

    "Requirement designation"
    requirementDesignation: SectionAttributeInfo
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
    ): CatalogResult! @cacheControl(maxAge: 300, scope: PUBLIC)

    catalogClassIdentities(
      year: Int!
      semester: Semester!
    ): [CatalogClassIdentity!]! @cacheControl(maxAge: 300, scope: PUBLIC)

    catalogFilterOptions(
      year: Int!
      semester: Semester!
    ): CatalogFilterOptions! @cacheControl(maxAge: 3600, scope: PUBLIC)
  }
`;
