#!/bin/sh
# Local/dev datapuller schedule (lighter than prod; skips last-five-years jobs).
# Intervals:
#   enrollments (SIS)                    disabled locally (needs SIS API keys)
#   ucb-catalog-enrollments              disabled (UC Berkeley IT request)
#   enrollment-from-public-backup        hourly (public daily backup @ 05:00 PT)
#   catalog refresh set                  every 12 hours
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
# Public backups publish ~05:00 America/Los_Angeles; poll hourly and no-op if
# already merged for that date. Merges without --drop so newer local docs win.
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

# Active catalog data: twice daily (staggered start)
(
  sleep 30
  while true; do
    run_puller terms-nearby
    run_puller courses
    run_puller sections-active
    run_puller classes-active
    sleep 43200
  done
) &

# Daily extras (DeCals, recent grades, enrollment windows, RMP, ASSIST)
(
  sleep 90
  while true; do
    run_puller decals
    run_puller grades-recent
    run_puller enrollment-timeframe
    run_puller catalog-sync-grades
    run_puller ratemyprofessors
    run_puller articulations
    sleep 86400
  done
) &

wait
