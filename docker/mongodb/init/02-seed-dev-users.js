// Seed the default local Oski account for DevAuthBanner auto-login.
// Idempotent: upserts by email so re-runs / post-restore seeding keep existing _ids.

const now = new Date();

const seedUsers = [
  {
    googleId: "dev-2",
    email: "oski@berkeleytime.local",
    name: "Oski",
    staff: false,
  },
];

for (const user of seedUsers) {
  const result = db.users.findOneAndUpdate(
    { email: user.email },
    {
      $set: {
        eecsTimeUser: true,
      },
      $setOnInsert: {
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        staff: user.staff,
        lastSeenAt: now,
        eecsTimeUser: true,
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  print(`Dev user ready: ${result.name} <${result.email}> (${result._id})`);
}
