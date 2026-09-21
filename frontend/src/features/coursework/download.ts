import { axiosInstance } from "@/lib/axios"

/**
 * Downloads an attachment through axios rather than a plain <a href>.
 *
 * Two reasons: the access token lives in an HttpOnly cookie on a different origin in
 * development, which a cross-site anchor navigation may not send; and going through the shared
 * instance means an expired token triggers the existing refresh-and-retry interceptor instead
 * of dumping the user on a 401 page.
 */
export async function downloadAttachment(downloadUrl: string, fileName: string) {
  // The server returns paths starting with "/api", and the axios baseURL already ends with it.
  const url = downloadUrl.replace(/^\/api/, "")

  const response = await axiosInstance.get(url, { responseType: "blob" })

  const objectUrl = URL.createObjectURL(response.data as Blob)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Revoking immediately can cancel the download in some browsers, so give it a moment.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
}
