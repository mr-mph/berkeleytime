#!/bin/sh
# Local/dev datapuller schedule (lighter than prod; skips last-five-years jobs).
# Intervals:
#   enrollments (SIS)           disabled locally (needs SIS API keys)
#   ucb-catalog-enrollments     continuous (no gap between passes)
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

# Enrollment: SIS Classes API (disabled locally — requires real SIS_CLASS_APP_* keys).
# (
#   while true; do
#     run_puller enrollments
#     sleep 300
#   done
# ) &

# Enrollment: classes.berkeley.edu scrape (prominence-ordered).
# Loop continuously; within a pass, recently-scraped classes are skipped (TTL in puller).
(
  sleep 15
  while true; do
    run_puller ucb-catalog-enrollments
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
