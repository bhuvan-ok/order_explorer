/** Saves text as a file through a temporary object URL (no server needed). */
export function downloadTextFile(fileName: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before releasing the memory.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
