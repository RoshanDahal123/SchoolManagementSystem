export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  status?: 'active' | 'inactive';
}

export interface TeacherFilters {
  search?: string;
  subject?: string;
  status?: string;
}
