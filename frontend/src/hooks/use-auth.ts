import type { RootState } from "../app/root-reducer";
import { useAppSelector } from "./use-redux";

const selectAuth = (state: RootState) => state.auth;
export function useAuth(){
  const {email, role, isAuthenticated}=useAppSelector(selectAuth);
  return {
    email,
    role,
    isAuthenticated,
    isAdmin:role==="Admin"
  }
}