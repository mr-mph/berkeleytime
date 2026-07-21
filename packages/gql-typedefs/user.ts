import { gql } from "graphql-tag";

export const userTypeDef = gql`
  enum StudentLevel {
    UNDERGRAD
    MASTERS
    PHD
    GRADUATE
  }

  type User @cacheControl(scope: PRIVATE) {
    _id: ID!
    email: String!
    name: String!
    staff: Boolean!
    student: Boolean!
    majors: [String!]!
    minors: [String!]!
    studentLevel: StudentLevel
    colleges: [String!]!
    termsInAttendance: Int
    isNewTransfer: Boolean!
    reservedSeatGroups: [String!]!
  }

  """
  Minimal user data point for analytics
  """
  type UserCreationDataPoint @cacheControl(maxAge: 0) {
    "Timestamp when the user was created"
    createdAt: String!
  }

  """
  User activity data point for analytics (tracks login activity)
  """
  type UserActivityDataPoint @cacheControl(maxAge: 0) {
    "Timestamp when the user was last seen (logged in)"
    lastSeenAt: String!
    "Timestamp when the user was created"
    createdAt: String!
  }

  type Query {
    user: User @auth
  }

  input UpdateUserInput {
    majors: [String!]
    minors: [String!]
    studentLevel: StudentLevel
    colleges: [String!]
    termsInAttendance: Int
    isNewTransfer: Boolean
    reservedSeatGroups: [String!]
  }

  input ReservedSeatProfileInput {
    studentLevel: StudentLevel
    colleges: [String!]
    majors: [String!]
    minors: [String!]
    termsInAttendance: Int
    isNewTransfer: Boolean
  }

  type Mutation {
    updateUser(user: UpdateUserInput!): User @auth
    deleteAccount: Boolean @auth
  }
`;
