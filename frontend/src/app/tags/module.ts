import { CORE_TAGS } from "./core";
import { ACADEMIC_YEAR_TAGS } from "../../features/academic-years/tags";
import { GRADE_LEVEL_TAGS, SECTION_TAGS, SUBJECT_TAGS, CLASS_SUBJECT_TAGS } from "../../features/academic/tags";
import { DASHBOARD_TAGS } from "../../features/dashboard/tags";
import { STUDENT_TAGS } from "../../features/students/tags";
import { TEACHER_TAGS } from "../../features/teachers/tags";
import { STUDENT_ENROLLMENT_TAGS } from "@/features/enrollment/tags";

export const TAG_TYPES = [
  ...CORE_TAGS,
  ...STUDENT_TAGS,
  ...TEACHER_TAGS,
  ...DASHBOARD_TAGS,
  ...ACADEMIC_YEAR_TAGS,
  ...GRADE_LEVEL_TAGS,
  ...SECTION_TAGS,
  ...SUBJECT_TAGS,
  ...CLASS_SUBJECT_TAGS,
  ...STUDENT_ENROLLMENT_TAGS
] as const;

export type TagTypes = (typeof TAG_TYPES)[number];
