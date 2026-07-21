import { useEffect, useMemo, useState } from "react";

import { useLazyQuery } from "@apollo/client/react";

import { Button, Checkbox, Input, Select } from "@repo/theme";

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
  const [isNewTransfer, setIsNewTransfer] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setStudentLevel(user.studentLevel ?? null);
    setColleges(user.colleges ?? []);
    setMajors(user.majors ?? []);
    setMinors(user.minors ?? []);
    setTermsInAttendance(
      user.termsInAttendance != null ? String(user.termsInAttendance) : ""
    );
    setIsNewTransfer(Boolean(user.isNewTransfer));
    setSelectedGroups(user.reservedSeatGroups ?? []);
  }, [user]);

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

  const groupOptions = useMemo(() => {
    const suggestedSet = new Set(suggestedGroups);
    const suggested = suggestedGroups.map((group) => ({
      value: group,
      label: group,
    }));
    const rest = allGroups
      .filter((group) => !suggestedSet.has(group))
      .map((group) => ({ value: group, label: group }));
    return [...suggested, ...rest];
  }, [allGroups, suggestedGroups]);

  const profileInput = useMemo(() => {
    const parsedTerms = Number.parseInt(termsInAttendance, 10);
    return {
      studentLevel,
      colleges,
      majors,
      minors,
      termsInAttendance: Number.isFinite(parsedTerms) ? parsedTerms : null,
      isNewTransfer,
    };
  }, [
    studentLevel,
    colleges,
    majors,
    minors,
    termsInAttendance,
    isNewTransfer,
  ]);

  const handleUpdateSuggestions = async () => {
    setStatusMessage(null);
    const result = await loadSuggestions({
      variables: { profile: profileInput },
    });
    const suggested = result.data?.suggestedReservedSeatGroups ?? [];
    setSelectedGroups((prev) => {
      if (suggested.length === 0) return prev;
      // Suggested list is already score-sorted (most similar first). Keep that
      // order at the front; append any prior manual picks that weren't suggested.
      return [
        ...suggested,
        ...prev.filter((group) => !suggested.includes(group)),
      ];
    });
    setStatusMessage(
      suggested.length > 0
        ? `Added ${suggested.length} suggested group${suggested.length === 1 ? "" : "s"} (most similar first). Review and save.`
        : "No matching groups found — search the list below or adjust your profile."
    );
  };

  const handleSave = async () => {
    setStatusMessage(null);
    const parsedTerms = Number.parseInt(termsInAttendance, 10);
    await updateUser({
      studentLevel,
      colleges,
      majors,
      minors,
      termsInAttendance: Number.isFinite(parsedTerms) ? parsedTerms : null,
      isNewTransfer,
      reservedSeatGroups: selectedGroups,
    });
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
            onChange={(value) =>
              setStudentLevel((value as StudentLevel | null) ?? null)
            }
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
            onChange={(event) => setTermsInAttendance(event.target.value)}
          />
          <p className={styles.hint}>
            0–2 terms matches &quot;New First Year Undergraduate&quot; pools (not
            specialty programs like Freshman Edge). Use the transfer checkbox
            instead if you are a new transfer.
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
              if (Array.isArray(value)) setColleges(value);
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
              if (Array.isArray(value)) setMajors(value);
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
              if (Array.isArray(value)) setMinors(value);
            }}
            options={MINOR_OPTIONS}
            searchPlaceholder="Search minors..."
            maxListHeight={240}
          />
        </div>

        <label className={styles.checkboxRow}>
          <Checkbox
            checked={isNewTransfer}
            onCheckedChange={(checked) => setIsNewTransfer(checked === true)}
          />
          <span>I am a new transfer student</span>
        </label>
      </div>

      <div className={styles.formActions}>
        <Button
          variant="secondary"
          onClick={() => void handleUpdateSuggestions()}
          disabled={loadingSuggestions}
        >
          {loadingSuggestions ? "Finding groups…" : "Update suggestions"}
        </Button>
      </div>

      <div className={styles.formControl}>
        <p className={styles.label}>Reserved seating groups that apply to you</p>
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
            if (Array.isArray(value)) setSelectedGroups(value);
          }}
          options={groupOptions}
          searchPlaceholder="Search reserved groups..."
          emptyMessage="No reserved seat groups found."
          maxListHeight={280}
        />
        {suggestedGroups.length > 0 && (
          <p className={styles.hint}>
            {suggestedGroups.length} suggested group
            {suggestedGroups.length === 1 ? "" : "s"} listed first (most
            similar at the top).
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
