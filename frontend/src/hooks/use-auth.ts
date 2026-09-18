import type { RootState } from "../app/root-reducer";
import { useAppSelector } from "./use-redux";

const selectAuth = (state: RootState) => state.auth;
export function useAuth(){
  const {email, role, teacherId, studentId,isAuthenticated}=useAppSelector(selectAuth);
  return {
    email,
    role,
    isAuthenticated,
    teacherId,
    studentId,
    isAdmin:role==="Admin"
  }
}