import { CORE_TAGS } from "./core";
import { DASHBOARD_TAGS } from "../../features/dashboard/tags";
import { STUDENT_TAGS } from "../../features/students/tags";
import { TEACHER_TAGS } from "../../features/teachers/tags";

// The single place that assembles every feature's tags into one list.
// As you build new features, import their tag array here and spread it in.
export const TAG_TYPES = [
  ...CORE_TAGS,
  ...STUDENT_TAGS,
  ...TEACHER_TAGS,
  ...DASHBOARD_TAGS,
] as const;

export type TagTypes = (typeof TAG_TYPES)[number];
