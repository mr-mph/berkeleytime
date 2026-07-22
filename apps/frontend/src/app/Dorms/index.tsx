import { Link } from "react-router-dom";

import styles from "./Dorms.module.scss";
import { BlackwellPlan, UnitDoublePlan, UnitTriplePlan } from "./PlanIcons";

const ROOMS = [
  {
    id: "blackwell",
    name: "Blackwell double",
    meta: "18′4″ × 9′8″ · 2 residents",
    accent: "var(--blue-500)",
    Plan: BlackwellPlan,
  },
  {
    id: "unit-double",
    name: "Units 1–3 double",
    meta: "13′9″ × 13′2″ · 2 residents",
    accent: "var(--green-500)",
    Plan: UnitDoublePlan,
  },
  {
    id: "unit-triple",
    name: "Units 1–3 triple",
    meta: "13′9″ × 13′2″ · 3 residents",
    accent: "var(--rose-500)",
    Plan: UnitTriplePlan,
  },
];

export default function Dorms() {
  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Dorms</p>
        <h1>Explore Berkeley dorm rooms in 3D</h1>
        <p className={styles.description}>
          Walk through measured 3D reconstructions of real dorm rooms, arrange
          the included furniture, and share a layout with your roommates.
        </p>
      </section>
      <section aria-labelledby="room-heading">
        <h2 className={styles.sectionTitle} id="room-heading">
          Choose a room
        </h2>
        <div className={styles.grid}>
          {ROOMS.map(({ id, name, meta, accent, Plan }) => (
            <Link
              key={id}
              to={`/dorms/${id}`}
              className={styles.card}
              style={{ "--accent": accent } as React.CSSProperties}
            >
              <div className={styles.plan}>
                <Plan />
              </div>
              <div className={styles.cardBody}>
                <h3>{name}</h3>
                <p className={styles.cardMeta}>{meta}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
