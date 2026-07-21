import { fanOutCrosslistingEnrollmentForTerm } from "../lib/crosslisting-enrollment-fanout";
import { Config } from "../shared/config";
import { getCurrentCatalogTerm } from "../shared/term-selectors";

/**
 * Propagate real enrollment onto 0/0 crosslisting siblings using DB state only
 * (no classes.berkeley.edu requests). Safe to run after any enrollment source.
 */
export const syncCrosslistingEnrollmentFanout = async (config: Config) => {
  const log = config.log.getSubLogger({
    name: "CrosslistingEnrollmentFanout",
  });

  const currentTerm = await getCurrentCatalogTerm();

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
