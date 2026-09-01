export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  className?: string;
  status?: 'active' | 'inactive';
}

export interface StudentFilters {
  search?: string;
  className?: string;
  status?: string;
}
