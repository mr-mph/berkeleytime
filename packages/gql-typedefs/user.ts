import { gql } from "graphql-tag";

export const userTypeDef = gql`
  enum StudentLevel {
    UNDERGRAD
    MASTERS
    PHD
    GRADUATE
  }

  enum DormRoomId {
    BLACKWELL
    UNIT_TRIPLE
    UNIT_DOUBLE
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
    isTransfer: Boolean!
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
    dormRoomLayout(roomId: DormRoomId!): String
      @auth
      @cacheControl(maxAge: 0, scope: PRIVATE)
  }

  input UpdateUserInput {
    majors: [String!]
    minors: [String!]
    studentLevel: StudentLevel
    colleges: [String!]
    termsInAttendance: Int
    isTransfer: Boolean
    reservedSeatGroups: [String!]
  }

  input ReservedSeatProfileInput {
    studentLevel: StudentLevel
    colleges: [String!]
    majors: [String!]
    minors: [String!]
    termsInAttendance: Int
    isTransfer: Boolean
  }

  type Mutation {
    updateUser(user: UpdateUserInput!): User @auth
    saveDormRoomLayout(roomId: DormRoomId!, layout: String): String @auth
    deleteAccount: Boolean @auth
  }
`;
