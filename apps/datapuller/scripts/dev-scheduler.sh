#!/bin/sh
# Local/dev datapuller schedule (lighter than prod; skips last-five-years jobs).
# Intervals:
#   enrollments (SIS)                    disabled locally (needs SIS API keys)
#   ucb-catalog-enrollments              disabled (UC Berkeley IT request)
#   SIS catalog (terms/courses/…)        disabled (avoid gateway.api.berkeley.edu load)
#   enrollment-from-public-backup        hourly (probe for newest public daily backup)
#   decals                               disabled locally for now
#   grades-recent / catalog-sync-grades  disabled locally (AWS Athena)
#   daily extras                         every 24 hours

set -eu

run_puller() {
  puller="$1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting ${puller}..."
  if turbo run main --filter=datapuller --env-mode=loose -- --puller="${puller}"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Finished ${puller}"
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Failed ${puller} (will retry on next cycle)"
  fi
}

echo "Datapuller dev scheduler started."

# Seed Spring 2027 draft schedule on every container start (idempotent).
# Public backup merges --drop shared catalog collections, so compose-up and
# post-merge reseed are both required for draft offerings to stick locally.
seed_draft_schedule() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Seeding Spring 2027 draft schedule..."
  if npx tsx /datapuller/scripts/import-draft-schedule.ts; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Spring 2027 draft schedule ready"
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: Spring 2027 draft seed failed (will retry after backup merge)"
  fi
}

seed_draft_schedule

# Enrollment: SIS Classes API (disabled locally — requires real SIS_CLASS_APP_* keys).
# (
#   while true; do
#     run_puller enrollments
#     sleep 300
#   done
# ) &

# Enrollment: classes.berkeley.edu scrape (disabled — UC Berkeley IT request).
# (
#   sleep 15
#   while true; do
#     run_puller ucb-catalog-enrollments
#   done
# ) &

# Enrollment: merge berkeleytime.com public daily backup when available.
# Publish time is unreliable, so probe recent PT dates each hour and no-op if
# already merged for that file. Uses mongorestore --drop for a clean refresh
# (this mongorestore has no --upsert). Preserves users / rmp_professors /
# articulations, then re-seeds the Spring 2027 draft schedule. Crosslisting
# fan-out runs after each merge.
(
  sleep 20
  while true; do
    run_puller enrollment-from-public-backup
    # Keep fan-out fresh even when the backup is unchanged.
    run_puller crosslisting-enrollment-fanout
    sleep 3600
  done
) &

# Active catalog data via SIS (disabled — hits gateway.api.berkeley.edu/sis).
# Roughly ~1k–3k HTTP requests per cycle: courses ~200–400; sections/classes
# ~hundreds per UGRD current/future term (paginated 50 pages × 50 items at a time).
# Spring 2027 draft schedule is re-seeded by enrollment-from-public-backup after
# each merge (not here) so backup --drop does not wipe local draft offerings.
# (
#   sleep 30
#   while true; do
#     run_puller terms-nearby
#     run_puller courses
#     run_puller sections-active
#     run_puller classes-active
#     sleep 43200
#   done
# ) &

# Daily extras (enrollment windows, RMP, ASSIST)
# DeCals + Athena grades disabled locally for now.
(
  sleep 90
  while true; do
    # run_puller decals
    # run_puller grades-recent
    run_puller enrollment-timeframe
    # run_puller catalog-sync-grades
    run_puller ratemyprofessors
    run_puller articulations
    sleep 86400
  done
) &

wait
