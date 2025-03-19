export interface User {
  id: string;
  email: string;
  role: 'applicant' | 'employer' | 'recruiter' | 'admin';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
} 