export type Id = string | number;

export type Nullable<T> = T | null;

export interface BaseEntity {
  id: Id;
  createdAt?: string;
  updatedAt?: string;
}
