import { ArticulationModel } from "@repo/common/models";

import {
  AssistClient,
  UC_BERKELEY_ASSIST_ID,
  institutionDisplayName,
  parseAgreement,
} from "../lib/articulations";
import { Config } from "../shared/config";

/**
 * Pull CCC-to-Berkeley course articulations from ASSIST.org.
 *
 * For every California community college with a published agreement, fetch
 * its latest all-departments agreement and replace that college's documents
 * in the articulations collection.
 */
export const updateArticulations = async (config: Config) => {
  const log = config.log.getSubLogger({ name: "ArticulationsPuller" });
  const client = new AssistClient();

  log.info("Fetching ASSIST institutions and agreement availability...");
  const institutions = await client.getInstitutions();
  const academicYears = await client.getAcademicYears();
  const availability = await client.getAgreementAvailability(
    UC_BERKELEY_ASSIST_ID
  );

  const yearById = new Map(academicYears.map((year) => [year.id, year]));
  const institutionById = new Map(
    institutions.map((institution) => [institution.id, institution])
  );

  // a college can have multiple availability entries; keep its latest year
  const collegeYearById = new Map<number, number>();
  for (const agreement of availability) {
    const institution = institutionById.get(agreement.institutionParentId);
    if (!institution?.isCommunityCollege) continue;
    if (agreement.sendingYearIds.length === 0) continue;
    const year = Math.max(...agreement.sendingYearIds);
    const existing = collegeYearById.get(agreement.institutionParentId);
    if (!existing || year > existing) {
      collegeYearById.set(agreement.institutionParentId, year);
    }
  }
  const colleges = [...collegeYearById.entries()].map(
    ([institutionId, academicYearId]) => ({
      institution: institutionById.get(institutionId)!,
      academicYearId,
    })
  );

  log.info(`Found ${colleges.length} community colleges with agreements.`);

  let processed = 0;
  let totalDocs = 0;
  const failures: string[] = [];

  for (const { institution, academicYearId } of colleges) {
    const name = institutionDisplayName(institution);
    const fallYear = yearById.get(academicYearId)?.fallYear;
    const academicYear = fallYear
      ? `${fallYear}-${fallYear + 1}`
      : String(academicYearId);

    try {
      const articulations = await client.getAllDepartmentsAgreement(
        institution.id,
        UC_BERKELEY_ASSIST_ID,
        academicYearId
      );

      const docs = parseAgreement({
        articulations,
        institution: {
          id: institution.id,
          name,
          code: institution.code?.trim() || undefined,
        },
        academicYearId,
        academicYear,
      });

      await ArticulationModel.deleteMany({ institutionId: institution.id });
      if (docs.length > 0) {
        await ArticulationModel.insertMany(docs, { ordered: false });
      }

      totalDocs += docs.length;
      processed++;
      if (processed % 25 === 0) {
        log.info(`Processed ${processed}/${colleges.length} colleges...`);
      }
    } catch (error) {
      failures.push(name);
      log.error(`Failed to pull ${name} (${institution.id}): ${error}`);
    }
  }

  log.info(
    `Articulations updated: ${totalDocs.toLocaleString()} documents across ` +
      `${processed}/${colleges.length} colleges.`
  );

  if (failures.length > 0) {
    log.warn(`Colleges skipped (kept previous data): ${failures.join(", ")}`);
  }

  if (processed === 0) {
    throw new Error("Articulations puller failed for every college");
  }
};

export default {
  updateArticulations,
};
