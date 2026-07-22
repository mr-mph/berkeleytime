import styles from "./PlanIcons.module.scss";

// Miniature floor plans for the room cards, ported from the dorm prototype's
// room picker. Stroke/fill colors key off the card's --accent custom property.

export function BlackwellPlan() {
  return (
    <svg className={styles.planIcon} viewBox="0 0 220 120" aria-hidden="true">
      <rect className={styles.wall} x="10" y="10" width="200" height="100" rx="5" />
      <path className={styles.window} d="M210 43v36" />
      <rect className={styles.bed} x="13" y="18" width="72" height="27" rx="4" />
      <rect className={styles.pillow} x="18" y="23" width="15" height="17" rx="3" />
      <rect className={styles.bed} x="137" y="18" width="70" height="27" rx="4" />
      <rect className={styles.pillow} x="187" y="23" width="15" height="17" rx="3" />
      <path className={styles.closetLine} d="M96 10v40M124 10v40" />
      <rect className={styles.appliance} x="102.5" y="18" width="15" height="22" rx="2" />
      <rect className={styles.closet} x="44" y="88" width="41" height="19" rx="2" />
      <path className={styles.closetLine} d="M64.5 88v19" />
      <rect className={styles.desk} x="87" y="91" width="34" height="16" rx="3" />
      <rect className={styles.chair} x="98" y="76" width="12" height="12" rx="4" />
      <rect className={styles.closet} x="123" y="88" width="41" height="19" rx="2" />
      <path className={styles.closetLine} d="M143.5 88v19" />
      <rect className={styles.desk} x="174" y="91" width="30" height="16" rx="3" />
      <rect className={styles.chair} x="182" y="76" width="12" height="12" rx="4" />
    </svg>
  );
}

export function UnitDoublePlan() {
  return (
    <svg className={styles.planIcon} viewBox="0 0 180 130" aria-hidden="true">
      <rect className={styles.wall} x="18" y="8" width="144" height="114" rx="6" />
      <path className={styles.window} d="M56 122h68" />
      <rect className={styles.closet} x="22" y="12" width="43" height="18" rx="2" />
      <path className={styles.closetLine} d="M43.5 12v18" />
      <rect className={styles.closet} x="113" y="12" width="45" height="18" rx="2" />
      <path className={styles.closetLine} d="M135.5 12v18" />
      <rect className={styles.closet} x="107" y="12" width="6" height="18" rx="1" />
      <rect className={styles.bed} x="27" y="38" width="29" height="67" rx="4" />
      <rect className={styles.pillow} x="31" y="43" width="21" height="14" rx="3" />
      <rect className={styles.bed} x="124" y="38" width="29" height="67" rx="4" />
      <rect className={styles.pillow} x="128" y="43" width="21" height="14" rx="3" />
      <rect className={styles.desk} x="76" y="48" width="28" height="29" rx="3" />
      <rect className={styles.desk} x="76" y="77" width="28" height="29" rx="3" />
      <rect className={styles.chair} x="63" y="84" width="10" height="13" rx="4" />
      <rect className={styles.chair} x="107" y="56" width="10" height="13" rx="4" />
      <rect className={styles.appliance} x="108" y="84" width="12" height="18" rx="2" />
      <path className={styles.closetLine} d="M54 114h72" />
    </svg>
  );
}

export function UnitTriplePlan() {
  return (
    <svg className={styles.planIcon} viewBox="0 0 180 130" aria-hidden="true">
      <rect className={styles.wall} x="18" y="8" width="144" height="114" rx="6" />
      <path className={styles.window} d="M162 43v44" />
      <rect className={styles.closet} x="21" y="39" width="21" height="80" rx="2" />
      <path className={styles.closetLine} d="M21 79h21" />
      <rect className={styles.desk} x="25" y="51" width="13" height="20" rx="2" />
      <rect className={styles.desk} x="25" y="91" width="13" height="20" rx="2" />
      <rect className={styles.appliance} x="68" y="12" width="15" height="19" rx="2" />
      <rect className={styles.bed} x="85" y="12" width="70" height="25" rx="4" />
      <rect className={styles.pillow} x="136" y="17" width="14" height="15" rx="3" />
      <rect className={styles.desk} x="88" y="40" width="31" height="9" rx="2" />
      <rect className={styles.desk} x="122" y="40" width="31" height="9" rx="2" />
      <rect className={styles.desk} x="142" y="53" width="17" height="29" rx="3" />
      <rect className={styles.desk} x="58" y="99" width="24" height="18" rx="3" />
      <rect className={styles.bed} x="85" y="94" width="70" height="24" rx="4" />
      <rect className={styles.bunkMark} x="89" y="98" width="62" height="16" rx="3" />
      <rect className={styles.pillow} x="136" y="99" width="14" height="14" rx="3" />
    </svg>
  );
}
