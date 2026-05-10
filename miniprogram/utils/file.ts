export function saveTempFile(tempFilePath: string): Promise<string> {
  if (!tempFilePath) {
    return Promise.resolve('')
  }

  return new Promise((resolve) => {
    wx.saveFile({
      tempFilePath,
      success: (res) => {
        resolve(res.savedFilePath)
      },
      fail: () => {
        resolve(tempFilePath)
      }
    })
  })
}
