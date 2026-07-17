// Seed local-only accounts for the DevAuthBanner user switcher.
// Clears existing users first so the switcher only shows these accounts.

// db.users.deleteMany({});
// print("Cleared existing users.");

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
  const result = db.users.insertOne({
    googleId: user.googleId,
    email: user.email,
    name: user.name,
    staff: user.staff,
    lastSeenAt: now,
  });
  print(`Dev user ready: ${user.name} <${user.email}> (${result.insertedId})`);
}
