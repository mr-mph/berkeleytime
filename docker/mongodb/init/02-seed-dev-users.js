// Seed local-only accounts for the DevAuthBanner user switcher.
// Idempotent: upserts by email so re-runs / post-restore seeding keep existing _ids.

const now = new Date();

const seedUsers = [
  {
    googleId: "dev-1",
    email: "dev@berkeleytime.local",
    name: "Dev",
    staff: false,
  },
  {
    googleId: "dev-2",
    email: "oski@berkeleytime.local",
    name: "Oski",
    staff: false,
  },
  {
    googleId: "dev-3",
    email: "fred@berkeley.edu",
    name: "Fred",
    staff: false,
  },
];

for (const user of seedUsers) {
  const result = db.users.findOneAndUpdate(
    { email: user.email },
    {
      $setOnInsert: {
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        staff: user.staff,
        lastSeenAt: now,
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  print(`Dev user ready: ${result.name} <${result.email}> (${result._id})`);
}
