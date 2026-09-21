/**
 * A tiny pub/sub store holding the live progress of in-flight uploads, keyed by an id the
 * caller invents (`coursework-create`, `submit-<courseworkId>`, ...).
 *
 * Why a store at all, rather than passing a callback down to the component?
 * The progress events originate inside an axios interceptor — a layer that has no idea which
 * React component started the request. The interceptor publishes here; the component
 * subscribes here. Neither needs a reference to the other, so the same mechanism works for
 * every upload in the app without the request layer knowing anything about the UI.
 */

export type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

export interface UploadProgressState{
    percent:number
    loaded:number
    total:number
    status:UploadStatus
}

export const IDLE_UPLOAD: UploadProgressState = {
  percent: 0,
  loaded: 0,
  total: 0,
  status: "idle",
}

const states = new Map<string, UploadProgressState>()
const listeners= new Map<string, Set<()=>void>>()

function notify(id: string) {
  listeners.get(id)?.forEach((listener) => listener())
}


export const uploadProgressStore = {
  subscribe(id: string, listener: () => void) {
    let set = listeners.get(id)
    if (!set) {
      set = new Set()
      listeners.set(id, set)
    }
    set.add(listener)

    return () => {
      set!.delete(listener)
      if (set!.size === 0) listeners.delete(id)
    }
  },
/**
   * Returns the *same object reference* until something actually changes. useSyncExternalStore
   * compares snapshots by identity, so returning a fresh object each call would re-render
   * forever.
   */

 getSnapshot(id: string): UploadProgressState {
    return states.get(id) ?? IDLE_UPLOAD
  },


   set(id: string, next: UploadProgressState) {
    states.set(id, next)
    notify(id)
  },

  reset(id: string) {
    states.delete(id)
    notify(id)
  }
}
