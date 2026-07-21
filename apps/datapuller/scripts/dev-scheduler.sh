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
# already merged for that file. Merges without --drop so newer local docs win.
# Crosslisting fan-out also runs after each successful merge.
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
# After terms + courses, seed the draft Spring 2027 schedule (idempotent) so
# local/dev has tentative offerings before SIS opens for that term.
# (
#   sleep 30
#   while true; do
#     run_puller terms-nearby
#     run_puller courses
#     echo "[$(date '+%Y-%m-%d %H:%M:%S')] Importing draft Spring 2027 schedule..."
#     if npx tsx /datapuller/scripts/import-draft-schedule.ts; then
#       echo "[$(date '+%Y-%m-%d %H:%M:%S')] Draft schedule import finished"
#     else
#       echo "[$(date '+%Y-%m-%d %H:%M:%S')] Draft schedule import failed (will retry next cycle)"
#     fi
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
