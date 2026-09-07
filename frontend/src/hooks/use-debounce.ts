import { useCallback, useEffect, useRef } from "react";


export function useDebouncedCallback<Args extends unknown[]>(
    callback:(...args:Args)=>void,
    delayMs:number
){
    const callbackRef = useRef(callback);
    callbackRef.current= callback;//always call the latest closure

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return useCallback(
    (...args:Args)=>{
        clearTimeout(timeoutRef.current);
         timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
    },
    [delayMs]
  )

}