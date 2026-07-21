import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLazyQuery } from "@apollo/client/react";

import { fuzzyFind } from "@repo/common";
import { rankReservedSeatGroups } from "@repo/shared";
import { Button, Checkbox, Input, Select } from "@repo/theme";
import type { Option } from "@repo/theme";

import { useUpdateUser } from "@/hooks/api";
import useUser from "@/hooks/useUser";
import {
  GetAllReservedSeatGroupsDocument,
  GetSuggestedReservedSeatGroupsDocument,
  StudentLevel,
} from "@/lib/generated/graphql";

import COLLEGES from "../../GradTrak/Onboarding/AddColleges/colleges.json";
import DEGREES from "../../GradTrak/Onboarding/AddDegree/degree-programs-types.json";
import styles from "./Account.module.scss";

const STUDENT_LEVEL_OPTIONS = [
  { value: StudentLevel.Undergrad, label: "Undergraduate" },
  { value: StudentLevel.Masters, label: "Masters" },
  { value: StudentLevel.Phd, label: "PhD" },
  { value: StudentLevel.Graduate, label: "Other graduate" },
];

const COLLEGE_OPTIONS = COLLEGES.colleges.map((college) => ({
  value: college,
  label: college,
}));

const MAJOR_OPTIONS = DEGREES.majors.map((major) => ({
  value: major,
  label: major,
}));

const MINOR_OPTIONS = DEGREES.minors.map((minor) => ({
  value: minor,
  label: minor,
}));

export default function ReservedSeatingProfile() {
  const { user } = useUser();
  const [updateUser, { loading: saving }] = useUpdateUser();

  const [studentLevel, setStudentLevel] = useState<StudentLevel | null>(null);
  const [colleges, setColleges] = useState<string[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [minors, setMinors] = useState<string[]>([]);
  const [termsInAttendance, setTermsInAttendance] = useState<string>("");
  const [isTransfer, setIsTransfer] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const hydratedUserIdRef = useRef<string | null>(null);

  // Prefill from the saved account profile. Skip once the user has local edits
  // so background UserProvider refetches don't wipe the form.
  useEffect(() => {
    if (!user?._id) return;
    if (isDirty && hydratedUserIdRef.current === user._id) return;
    hydratedUserIdRef.current = user._id;

    setStudentLevel(user.studentLevel ?? null);
    setColleges(user.colleges ?? []);
    setMajors(user.majors ?? []);
    setMinors(user.minors ?? []);
    setTermsInAttendance(
      user.termsInAttendance != null ? String(user.termsInAttendance) : ""
    );
    setIsTransfer(Boolean(user.isTransfer));
    setSelectedGroups(user.reservedSeatGroups ?? []);
  }, [user, isDirty]);

  const markDirty = () => setIsDirty(true);

  const [loadAllGroups, { data: allGroupsData, loading: loadingAll }] =
    useLazyQuery(GetAllReservedSeatGroupsDocument, {
      fetchPolicy: "cache-first",
    });

  const [
    loadSuggestions,
    { data: suggestionsData, loading: loadingSuggestions },
  ] = useLazyQuery(GetSuggestedReservedSeatGroupsDocument, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    void loadAllGroups();
  }, [loadAllGroups]);

  const allGroups = allGroupsData?.allReservedSeatGroups ?? [];
  const suggestedGroups = suggestionsData?.suggestedReservedSeatGroups ?? [];

  const profileInput = useMemo(() => {
    const parsedTerms = Number.parseInt(termsInAttendance, 10);
    return {
      studentLevel,
      colleges,
      majors,
      minors,
      termsInAttendance: Number.isFinite(parsedTerms) ? parsedTerms : null,
      isTransfer,
    };
  }, [studentLevel, colleges, majors, minors, termsInAttendance, isTransfer]);

  // Rank the full pool by closeness to year/college/major (not alphabetical).
  const groupsByProfileCloseness = useMemo(
    () => rankReservedSeatGroups(allGroups, profileInput),
    [allGroups, profileInput]
  );

  const groupOptions = useMemo(() => {
    const suggestedSet = new Set(suggestedGroups);
    const selectedSet = new Set(selectedGroups);
    const suggested = suggestedGroups.map((group) => ({
      value: group,
      label: group,
    }));

    // After suggestions: remaining groups by profile closeness, then any
    // unscored leftovers last (opaque groups excluded by rank helper).
    const rankedRest = groupsByProfileCloseness.filter(
      (group) => !suggestedSet.has(group)
    );
    const rankedSet = new Set(rankedRest);
    const leftovers = allGroups.filter(
      (group) => !suggestedSet.has(group) && !rankedSet.has(group)
    );

    const selectedRest = rankedRest.filter((group) => selectedSet.has(group));
    const unselectedRest = rankedRest.filter(
      (group) => !selectedSet.has(group)
    );

    return [
      ...suggested,
      ...selectedRest.map((group) => ({ value: group, label: group })),
      ...unselectedRest.map((group) => ({ value: group, label: group })),
      ...leftovers.map((group) => ({ value: group, label: group })),
    ];
  }, [allGroups, groupsByProfileCloseness, selectedGroups, suggestedGroups]);

  /** Filter by typed query while preserving profile-ranked order. */
  const searchGroupOptions = useCallback(
    (query: string, options: Option<string>[]) => {
      const items = options.filter(
        (opt): opt is { value: string; label: string } =>
          "value" in opt && (opt as { type?: string }).type !== "label"
      );
      if (items.length === 0) return [];

      const matching = new Set(
        fuzzyFind(
          query,
          items.map((opt) => opt.label)
        )
      );

      return items.filter((opt) => matching.has(opt.label));
    },
    []
  );

  const handleUpdateSuggestions = async () => {
    setStatusMessage(null);
    const result = await loadSuggestions({
      variables: { profile: profileInput },
    });
    const suggested = result.data?.suggestedReservedSeatGroups ?? [];
    setSelectedGroups((prev) => {
      if (suggested.length === 0) return prev;
      markDirty();
      // Suggested list is already score-sorted (most similar first).
      return [
        ...suggested,
        ...prev.filter((group) => !suggested.includes(group)),
      ];
    });
    setStatusMessage(
      suggested.length > 0
        ? `Added ${suggested.length} group${suggested.length === 1 ? "" : "s"} that may apply (most similar first). Review and save.`
        : "No matching groups found — search the list below or adjust your profile."
    );
  };

  const handleSave = async () => {
    setStatusMessage(null);
    const parsedTerms = Number.parseInt(termsInAttendance, 10);
    const result = await updateUser({
      studentLevel,
      colleges,
      majors,
      minors,
      termsInAttendance: Number.isFinite(parsedTerms) ? parsedTerms : null,
      isTransfer,
      reservedSeatGroups: selectedGroups,
    });
    const saved = result.data?.updateUser;
    if (saved) {
      // Keep form aligned with what the server persisted.
      setStudentLevel(saved.studentLevel ?? null);
      setColleges(saved.colleges ?? []);
      setMajors(saved.majors ?? []);
      setMinors(saved.minors ?? []);
      setTermsInAttendance(
        saved.termsInAttendance != null ? String(saved.termsInAttendance) : ""
      );
      setIsTransfer(Boolean(saved.isTransfer));
      setSelectedGroups(saved.reservedSeatGroups ?? []);
      setIsDirty(false);
    }
    setStatusMessage("Reserved seating profile saved.");
  };

  return (
    <div className={styles.reservedSection}>
      <p className={styles.sectionDescription}>
        Tell us about your academic identity so we can suggest reserved seating
        groups that may apply to you. Confirm the list, save it here, then use
        &quot;Load from Profile&quot; on the catalog filters.
      </p>

      <div className={styles.formGrid}>
        <div className={styles.formControl}>
          <p className={styles.label}>Student level</p>
          <Select
            value={studentLevel}
            placeholder="Select level"
            clearable
            onChange={(value) => {
              markDirty();
              setStudentLevel((value as StudentLevel | null) ?? null);
            }}
            options={STUDENT_LEVEL_OPTIONS}
          />
        </div>

        <div className={styles.formControl}>
          <p className={styles.label}>Terms in attendance</p>
          <Input
            type="number"
            min={0}
            max={20}
            value={termsInAttendance}
            placeholder="e.g. 3"
            onChange={(event) => {
              markDirty();
              setTermsInAttendance(event.target.value);
            }}
          />
          <p className={styles.hint}>
            0–2 terms matches &quot;new&quot; first-year or new-transfer pools
            (not specialty programs like Freshman Edge).
          </p>
        </div>

        <div className={styles.formControl}>
          <p className={styles.label}>College</p>
          <Select
            multi
            searchable
            value={colleges}
            placeholder="Select college(s)"
            onChange={(value) => {
              if (Array.isArray(value)) {
                markDirty();
                setColleges(value);
              }
            }}
            options={COLLEGE_OPTIONS}
            searchPlaceholder="Search colleges..."
          />
        </div>

        <div className={styles.formControl}>
          <p className={styles.label}>Major(s)</p>
          <Select
            multi
            searchable
            value={majors}
            placeholder="Select major(s)"
            onChange={(value) => {
              if (Array.isArray(value)) {
                markDirty();
                setMajors(value);
              }
            }}
            options={MAJOR_OPTIONS}
            searchPlaceholder="Search majors..."
            maxListHeight={240}
          />
        </div>

        <div className={styles.formControl}>
          <p className={styles.label}>Minor(s)</p>
          <Select
            multi
            searchable
            value={minors}
            placeholder="Select minor(s)"
            onChange={(value) => {
              if (Array.isArray(value)) {
                markDirty();
                setMinors(value);
              }
            }}
            options={MINOR_OPTIONS}
            searchPlaceholder="Search minors..."
            maxListHeight={240}
          />
        </div>

        <label className={styles.checkboxRow}>
          <Checkbox
            checked={isTransfer}
            onCheckedChange={(checked) => {
              markDirty();
              setIsTransfer(checked === true);
            }}
          />
          <span>I am a transfer student</span>
        </label>
      </div>

      <div className={styles.formActions}>
        <Button
          variant="secondary"
          onClick={() => void handleUpdateSuggestions()}
          disabled={loadingSuggestions}
        >
          {loadingSuggestions
            ? "Finding groups…"
            : "Suggest groups that may apply"}
        </Button>
      </div>

      <div className={styles.formControl}>
        <p className={styles.label}>
          Reserved seating groups that may apply to you
        </p>
        <Select
          multi
          searchable
          value={selectedGroups}
          placeholder={
            loadingAll
              ? "Loading groups…"
              : "Select groups across all semesters"
          }
          disabled={loadingAll || allGroups.length === 0}
          onChange={(value) => {
            if (Array.isArray(value)) {
              markDirty();
              setSelectedGroups(value);
            }
          }}
          options={groupOptions}
          customSearch={searchGroupOptions}
          searchPlaceholder="Search reserved groups..."
          emptyMessage="No reserved seat groups found."
          maxListHeight={280}
        />
        {suggestedGroups.length > 0 && (
          <p className={styles.hint}>
            These are guesses. Review before saving.
          </p>
        )}
      </div>

      <div className={styles.formActions}>
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save reserved seating profile"}
        </Button>
        {statusMessage && (
          <span className={styles.statusMessage}>{statusMessage}</span>
        )}
      </div>
    </div>
  );
}
