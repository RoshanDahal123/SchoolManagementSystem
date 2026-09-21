import { uploadProgressStore, type UploadProgressState } from "@/lib/upload-progress";
import { useCallback, useSyncExternalStore } from "react";



export function useUploadProgress(uploadId: string): UploadProgressState & { reset: () => void } {
  const subscribe = useCallback(
    (listener: () => void) => uploadProgressStore.subscribe(uploadId, listener),
    [uploadId],
  )
const getSnapshot = useCallback(() => uploadProgressStore.getSnapshot(uploadId), [uploadId])
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const reset = useCallback(() => uploadProgressStore.reset(uploadId), [uploadId])
 return {...state, reset}
}