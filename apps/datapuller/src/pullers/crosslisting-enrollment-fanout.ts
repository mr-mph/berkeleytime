import { parseTermName } from "@repo/common";
import { CatalogClassModel } from "@repo/common/models";

import { fanOutCrosslistingEnrollmentForTerm } from "../lib/crosslisting-enrollment-fanout";
import { Config } from "../shared/config";
import { getActiveTerms } from "../shared/term-selectors";

const SEMESTER_ORDER: Record<string, number> = {
  Spring: 1,
  Summer: 2,
  Fall: 3,
};

/**
 * Propagate real enrollment onto 0/0 crosslisting siblings using DB state only
 * (no classes.berkeley.edu requests). Safe to run after any enrollment source.
 */
export const syncCrosslistingEnrollmentFanout = async (config: Config) => {
  const log = config.log.getSubLogger({
    name: "CrosslistingEnrollmentFanout",
  });

  const terms = await getActiveTerms();
  const uniqueTerms = new Map<string, { year: number; semester: string }>();
  for (const term of terms) {
    const parsed = parseTermName(term.name);
    if (!parsed) continue;
    const key = `${parsed.year}:${parsed.semester}`;
    if (!uniqueTerms.has(key)) uniqueTerms.set(key, parsed);
  }

  const termsWithCounts = await Promise.all(
    [...uniqueTerms.values()].map(async (term) => {
      const count = await CatalogClassModel.countDocuments({
        year: term.year,
        semester: term.semester,
      });
      return { ...term, count };
    })
  );

  const currentTerm = termsWithCounts
    .filter((term) => term.count > 0)
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (
        (SEMESTER_ORDER[b.semester] ?? 0) - (SEMESTER_ORDER[a.semester] ?? 0)
      );
    })[0];

  if (!currentTerm) {
    log.warn("No active terms with catalog data; skipping crosslisting fan-out");
    return;
  }

  log.info(
    `Running crosslisting enrollment fan-out for ${currentTerm.semester} ${currentTerm.year}`
  );
  await fanOutCrosslistingEnrollmentForTerm(
    log,
    currentTerm.year,
    currentTerm.semester
  );
};

export default { syncCrosslistingEnrollmentFanout };
