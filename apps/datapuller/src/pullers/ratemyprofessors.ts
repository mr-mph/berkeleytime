import { RmpProfessorModel } from "@repo/common/models";

import { updateCatalogRmpRatings } from "../lib/catalog-denormalize";
import {
  UC_BERKELEY_RMP_SCHOOL_ID,
  fetchAllProfessorsForSchool,
} from "../lib/ratemyprofessors";
import { Config } from "../shared/config";

/**
 * Pull all UC Berkeley professors from Rate My Professors and sync catalog
 * rmpAverageRating fields. Inspired by https://github.com/tisuela/ratemyprof-api
 */
export const syncRateMyProfessors = async (config: Config) => {
  const log = config.log.getSubLogger({ name: "RateMyProfessorsPuller" });
  log.info("Fetching UC Berkeley professors from Rate My Professors...");

  const professors = await fetchAllProfessorsForSchool(
    UC_BERKELEY_RMP_SCHOOL_ID,
    {
      delayMs: 250,
      onPage: (fetched) => {
        if (fetched % 500 === 0) {
          log.info(`Fetched ${fetched.toLocaleString()} professors so far...`);
        }
      },
    }
  );

  log.info(
    `Fetched ${professors.length.toLocaleString()} professors. Upserting into rmp_professors...`
  );

  const bulkOps = professors.map((professor) => ({
    updateOne: {
      filter: { legacyId: professor.legacyId },
      update: {
        $set: {
          legacyId: professor.legacyId,
          firstName: professor.firstName,
          lastName: professor.lastName,
          department: professor.department,
          avgRating: professor.avgRating,
          numRatings: professor.numRatings,
          schoolId: UC_BERKELEY_RMP_SCHOOL_ID,
        },
      },
      upsert: true,
    },
  }));

  const BULK_BATCH_SIZE = 500;
  let upserted = 0;
  for (let i = 0; i < bulkOps.length; i += BULK_BATCH_SIZE) {
    const batch = bulkOps.slice(i, i + BULK_BATCH_SIZE);
    const result = await RmpProfessorModel.bulkWrite(batch, { ordered: false });
    upserted += result.upsertedCount + result.modifiedCount;
  }

  log.info(
    `Upserted ${upserted.toLocaleString()} RMP professor rows. Updating catalog class averages...`
  );

  await updateCatalogRmpRatings(log);
};

export default {
  syncRateMyProfessors,
};
