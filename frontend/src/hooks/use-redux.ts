import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState } from "../app/root-reducer";
import type { AppDispatch } from "../app/store";



export const useAppDispatch=():AppDispatch=>useDispatch<AppDispatch>();
export const useAppSelector:TypedUseSelectorHook<RootState>= useSelector;