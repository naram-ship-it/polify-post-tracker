// Team roster config. This is the source of truth for who can be picked in
// the "log a post" dropdown.
//
// To add/remove people:
//   1. Edit this list.
//   2. Run `npm run seed` locally with DATABASE_URL pointed at production
//      (or run it via `vercel env pull` + `npm run seed`), OR just redeploy —
//      the seed also runs automatically after build (see package.json).
//   3. Removing someone here sets them `active: false` in the database
//      instead of deleting them, so their past posts/comments are kept.

export type TeamMemberConfig = {
  name: string;
  xHandle?: string;
  linkedinUrl?: string;
};

export const team: TeamMemberConfig[] = [
  { name: "Adam", xHandle: "AdamPolify" },
  { name: "Todelsz", xHandle: "todelsz" },
  { name: "Nimo", xHandle: "Nimo_13" },
];
