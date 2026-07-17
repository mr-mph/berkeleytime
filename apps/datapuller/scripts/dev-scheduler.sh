#!/bin/sh
# Local/dev datapuller schedule (lighter than prod; skips last-five-years jobs).
# Intervals:
#   enrollments                 every 5 minutes
#   ucb-catalog-enrollments     continuous (60s between passes)
#   catalog refresh set         every 12 hours
#   daily extras                every 24 hours

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

# Enrollment: live loop (SIS)
(
  while true; do
    run_puller enrollments
    sleep 300
  done
) &

# Enrollment: classes.berkeley.edu scrape (prominence-ordered).
# Long gap between full passes; within a pass, recently-scraped classes are skipped.
(
  sleep 15
  while true; do
    run_puller ucb-catalog-enrollments
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

# Daily extras (DeCals, recent grades, enrollment windows, RMP)
(
  sleep 90
  while true; do
    run_puller decals
    run_puller grades-recent
    run_puller enrollment-timeframe
    run_puller catalog-sync-grades
    run_puller ratemyprofessors
    sleep 86400
  done
) &

wait
