import { CORE_TAGS } from "./core";

// The single place that assembles every feature's tags into one list.
// As you build students/teachers/etc., import each feature's own tag
// array here and spread it in — baseApi.tagTypes reads from TAG_TYPES.
export const TAG_TYPES = [...CORE_TAGS] as const;

export type TagTypes = (typeof TAG_TYPES)[number];