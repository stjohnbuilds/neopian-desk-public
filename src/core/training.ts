import { validAccount } from "./profile";
import type { Timer } from "./timers";
export const trainingSchools = {
  academy: {
    name: "Swashbuckling Academy",
    url: "https://www.neopets.com/pirates/academy.phtml?type=status",
  },
  island: {
    name: "Mystery Island Training School",
    url: "https://www.neopets.com/island/training.phtml?type=status",
  },
  ninja: {
    name: "Secret Ninja Training School",
    url: "https://www.neopets.com/island/fight_training.phtml?type=status",
  },
} as const;
export type School = keyof typeof trainingSchools;
export interface TrainingObservation {
  pet: string;
  course: string;
  level: number;
  dueAt: number | null;
}
export interface TrainingSnapshot {
  account: string;
  school: School;
  observedAt: number;
  courses: TrainingObservation[];
}
interface Course extends TrainingObservation {
  id: string;
  school: School;
  suppressed?: boolean;
}
export interface TrainingState {
  enabled: boolean;
  processed: Partial<Record<School, number>>;
  courses: Record<string, Course>;
  groups: { id: string; members: string[] }[];
}
export const emptyTraining = (): TrainingState => ({
  enabled: false,
  processed: {},
  courses: {},
  groups: [],
});
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
export function validateTrainingSnapshot(
  value: unknown,
): asserts value is TrainingSnapshot {
  const s = value as TrainingSnapshot;
  if (
    !s ||
    !validAccount(s.account) ||
    !Object.hasOwn(trainingSchools, s.school) ||
    !finite(s.observedAt) ||
    s.observedAt <= 0 ||
    !Array.isArray(s.courses) ||
    s.courses.length < 1 ||
    s.courses.length > 30 ||
    new Set(s.courses.map((c) => c?.pet?.toLowerCase())).size !==
      s.courses.length ||
    !s.courses.every(
      (c) =>
        c &&
        /^[a-z0-9_]{1,20}$/i.test(c.pet) &&
        typeof c.course === "string" &&
        c.course.length <= 80 &&
        Number.isInteger(c.level) &&
        c.level >= 1 &&
        c.level <= 100000 &&
        (c.dueAt === null ||
          (finite(c.dueAt) &&
            c.dueAt >= s.observedAt &&
            c.dueAt <= s.observedAt + 7 * 86400000)),
    )
  )
    throw Error("Invalid training observation. Existing timers were retained.");
}
export function validateTraining(
  value: unknown,
): asserts value is TrainingState {
  const s = value as TrainingState;
  if (
    !s ||
    typeof s.enabled !== "boolean" ||
    !s.processed ||
    !s.courses ||
    Array.isArray(s.courses) ||
    !Array.isArray(s.groups) ||
    Object.keys(s.courses).length > 90 ||
    s.groups.length > 90
  )
    throw Error("Invalid saved training timers.");
  for (const [school, seen] of Object.entries(s.processed))
    if (!Object.hasOwn(trainingSchools, school) || !finite(seen) || seen <= 0)
      throw Error("Invalid training timestamp.");
  for (const [key, c] of Object.entries(s.courses)) {
    if (
      !c ||
      !Object.hasOwn(trainingSchools, c.school) ||
      key !== c.school + ":" + c.pet.toLowerCase() ||
      typeof c.id !== "string" ||
      c.id.length > 160 ||
      typeof c.pet !== "string" ||
      !/^[a-z0-9_]{1,20}$/i.test(c.pet) ||
      typeof c.course !== "string" ||
      c.course.length > 80 ||
      !Number.isInteger(c.level) ||
      c.level < 1 ||
      (c.dueAt !== null && (!finite(c.dueAt) || c.dueAt <= 0)) ||
      (c.suppressed !== undefined && typeof c.suppressed !== "boolean")
    )
      throw Error("Invalid saved training course.");
  }
  if (
    !s.groups.every(
      (g) =>
        g &&
        typeof g.id === "string" &&
        g.id.startsWith("training-") &&
        g.id.length <= 4000 &&
        Array.isArray(g.members) &&
        g.members.length <= 30 &&
        g.members.every((id) => typeof id === "string" && id.length <= 160),
    )
  )
    throw Error("Invalid saved training group.");
}
/** Reconcile complete school observations, not countdown ticks. Removed groups stay
 * suppressed for those courses; corrections update their finish without restarting. */
export function syncTraining(
  previous: TrainingState,
  timers: Timer[],
  snapshots: TrainingSnapshot[],
  now = Date.now(),
) {
  const state = structuredClone(previous);
  // Pausing automation retains existing timers and course identities. New
  // observations are reconciled when the current session explicitly enables it.
  if (!state.enabled) return { state, timers: [...timers] };
  for (const group of state.groups)
    if (!timers.some((t) => t.id === group.id))
      for (const c of Object.values(state.courses))
        if (group.members.includes(c.id)) c.suppressed = true;
  for (const snapshot of snapshots) {
    validateTrainingSnapshot(snapshot);
    if (snapshot.observedAt <= (state.processed[snapshot.school] ?? 0))
      continue;
    const present = new Set<string>();
    for (const incoming of snapshot.courses) {
      const key = snapshot.school + ":" + incoming.pet.toLowerCase();
      present.add(key);
      const old = state.courses[key];
      const same =
        old &&
        old.course === incoming.course &&
        old.level === incoming.level &&
        old.dueAt !== null &&
        incoming.dueAt !== null &&
        !(
          old.dueAt < snapshot.observedAt - 60000 &&
          incoming.dueAt > snapshot.observedAt + 60000
        );
      const id = same ? old.id : key + ":" + snapshot.observedAt;
      const dueAt =
        same && Math.abs(old.dueAt! - incoming.dueAt!) < 90000
          ? old.dueAt
          : incoming.dueAt;
      state.courses[key] = {
        ...incoming,
        dueAt,
        school: snapshot.school,
        id,
        suppressed: same ? old.suppressed : false,
      };
    }
    for (const [key, c] of Object.entries(state.courses))
      if (c.school === snapshot.school && !present.has(key))
        delete state.courses[key];
    state.processed[snapshot.school] = snapshot.observedAt;
  }
  const retained = timers.filter((t) => !t.id.startsWith("training-"));
  state.groups = [];
  for (const school of Object.keys(trainingSchools) as School[]) {
    const courses = Object.values(state.courses)
      .filter(
        (c) =>
          c.school === school &&
          !c.suppressed &&
          c.dueAt !== null &&
          c.dueAt > now - 600000,
      )
      .sort((a, b) => a.dueAt! - b.dueAt!);
    while (courses.length) {
      const first = courses.shift()!;
      const group = [first];
      // A bounded 45-minute span avoids chaining many scattered courses together.
      while (courses.length && courses[0].dueAt! - first.dueAt! <= 45 * 60000)
        group.push(courses.shift()!);
      const members = group.map((c) => c.id).sort();
      const id =
        previous.groups.find(
          (g) => JSON.stringify(g.members) === JSON.stringify(members),
        )?.id ?? "training-" + crypto.randomUUID();
      state.groups.push({ id, members });
      retained.push({
        id,
        title:
          "Training · " +
          (group.length > 3
            ? group.length + " pets"
            : group.map((c) => c.pet).join(", ")),
        dueAt: group.at(-1)!.dueAt!,
        url: trainingSchools[school].url,
      });
    }
  }
  if (retained.filter((t) => t.dueAt > now - 600000).length > 30)
    throw Error(
      "Training timers could not be added: remove an active timer first, then retry training sync.",
    );
  return { state, timers: retained };
}
