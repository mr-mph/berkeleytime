/**
 * One-off SIS enrollment diagnostic. Prints status/error shape only — never secrets.
 * Run from apps/datapuller inside Docker:
 *   npx tsx scripts/diagnose-sis-enrollment.ts
 */
import setup from "../src/shared/index.ts";
import { ClassesAPI } from "@repo/sis-api/classes";
import { TermModel } from "@repo/common/models";
import { DateTime } from "luxon";

function summarizeError(error: unknown) {
  if (error == null) return { type: "nullish" };
  if (typeof error !== "object") {
    return { type: typeof error, value: String(error).slice(0, 200) };
  }
  const e = error as Record<string, unknown>;
  return {
    type: e.constructor?.name ?? typeof error,
    name: typeof e.name === "string" ? e.name : undefined,
    message: typeof e.message === "string" ? e.message : undefined,
    code: typeof e.code === "string" || typeof e.code === "number" ? e.code : undefined,
    status: typeof e.status === "number" ? e.status : undefined,
    statusText: typeof e.statusText === "string" ? e.statusText : undefined,
    keys: Object.keys(e).slice(0, 20),
    stringified: (() => {
      try {
        return JSON.stringify(error).slice(0, 500);
      } catch {
        return String(error).slice(0, 200);
      }
    })(),
  };
}

async function main() {
  const { config } = await setup();
  const { CLASS_APP_ID, CLASS_APP_KEY } = config.sis;

  console.log("=== SIS enrollment diagnostic ===");
  console.log("creds present:", {
    SIS_CLASS_APP_ID: Boolean(CLASS_APP_ID),
    SIS_CLASS_APP_KEY: Boolean(CLASS_APP_KEY),
    idLen: CLASS_APP_ID?.length ?? 0,
    keyLen: CLASS_APP_KEY?.length ?? 0,
  });

  // Network reachability
  try {
    const probe = await fetch("https://gateway.api.berkeley.edu/", {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });
    console.log("gateway probe:", {
      ok: probe.ok,
      status: probe.status,
      statusText: probe.statusText,
      contentType: probe.headers.get("content-type"),
    });
  } catch (error) {
    console.log("gateway probe failed:", summarizeError(error));
  }

  const nowPTDate = DateTime.now().setZone("America/Los_Angeles").toISODate();
  const terms = await TermModel.find({
    academicCareerCode: "UGRD",
    temporalPosition: { $in: ["Current", "Future"] },
    $and: [
      { selfServiceEnrollBeginDate: { $lte: nowPTDate } },
      { selfServiceEnrollEndDate: { $gte: nowPTDate } },
    ],
  })
    .select({ id: 1, name: 1 })
    .lean();

  console.log(
    "terms for enrollment:",
    terms.map((t) => ({ id: t.id, name: t.name }))
  );

  if (terms.length === 0) {
    console.log("No enrollment terms found; aborting API test.");
    process.exit(1);
  }

  const termId = terms.find((t) => /Fall/i.test(t.name))?.id ?? terms[0].id;
  const api = new ClassesAPI();
  const headers = { app_id: CLASS_APP_ID, app_key: CLASS_APP_KEY };

  console.log("requesting one page for term", termId);

  try {
    const response = await api.v1.getClassSectionsUsingGet(
      {
        "term-id": termId,
        "page-number": "1",
        "page-size": "5",
      },
      { headers }
    );

    console.log("raw response meta:", {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      // HttpResponse often has these
      error: response.error ? summarizeError(response.error) : undefined,
    });

    try {
      const data = await response.json();
      const sections = data?.apiResponse?.response?.classSections;
      console.log("json parse ok:", {
        topKeys: data && typeof data === "object" ? Object.keys(data).slice(0, 15) : typeof data,
        httpStatus: data?.apiResponse?.httpStatus,
        hasClassSections: Array.isArray(sections),
        sectionCount: Array.isArray(sections) ? sections.length : null,
        sampleError:
          data?.apiResponse?.httpStatus?.code &&
          data?.apiResponse?.httpStatus?.code !== 200
            ? {
                code: data.apiResponse.httpStatus.code,
                description: data.apiResponse.httpStatus.description,
                message: data?.apiResponse?.message,
              }
            : undefined,
      });
    } catch (error) {
      console.log("response.json() failed:", summarizeError(error));
      if (typeof (response as any).text === "function") {
        const text = await (response as any).text();
        console.log("response text preview:", String(text).slice(0, 400));
      }
    }
  } catch (error) {
    console.log("getClassSectionsUsingGet threw:", summarizeError(error));
  }

  // Also mirror the exact fetchPaginatedData chain for page 1
  console.log("--- mirroring fetchPaginatedData chain ---");
  try {
    const data = await api.v1
      .getClassSectionsUsingGet(
        {
          "term-id": termId,
          "page-number": "1",
          "page-size": "50",
        },
        { headers }
      )
      .then((response: any) => response.json())
      .then((data: any) => data.apiResponse?.response.classSections || []);
    console.log("chain result count:", Array.isArray(data) ? data.length : typeof data);
  } catch (error) {
    console.log("chain failed:", summarizeError(error));
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("diagnostic crashed:", summarizeError(error));
  process.exit(1);
});
