import fs from "fs"
import path from "path"

import { mkdir } from "."
import allFiles from "./all-files"
import globalInfo from "../globalInfo"
import absolutePath from "../utils/absolute-path"
import generateFileName from "../utils/generate-file-name"

const configs = globalInfo.configs

const changeCssUrlPath = (css: string, f: string) => {
  return css.replace(/ url\((.*?)\)/gs, (...args) => {
    const pathGiven = args[1].replace(/'|"/gs, "")

    if (
      pathGiven.startsWith("http:") ||
      pathGiven.startsWith("https:") ||
      pathGiven.startsWith("//")
    )
      return ` url("${pathGiven}")`

    const fileName = generateFileName(path.join(f, pathGiven))

    return ` url("${fileName + path.parse(pathGiven).ext}")`
  })
}

const copyAssets = async (
  dir = path.join(process.cwd(), "src"),
  to = configs.buildPath
) => {
  await mkdir(absolutePath(`${to}/__assets__`))

  const files = allFiles(dir)

  files
    .map((f: string) => path.parse(f))
    .filter((f: path.ParsedPath) => f.ext !== ".ulka" && f.ext !== ".md")
    .forEach((f: path.ParsedPath) => {
      /**
       * If file ends with .ulka.(ext) then ignore such files. This will get useful when you want to write server side
       * code inside src directory and don't want it to be copied to the client
       * eg
       * data.ulka.js => ignore
       * data.js => don't ignore
       */

      if (f.name.endsWith(".ulka")) return

      const generatedName = generateFileName(path.format(f))

      const writePath =
        absolutePath(`${to}/__assets__/${generatedName}`) + f.ext

      let readAssetsFile
      if (f.ext === ".css") {
        readAssetsFile = fs.readFileSync(path.format(f), "utf-8")
        readAssetsFile = changeCssUrlPath(readAssetsFile, f.dir)
      } else {
        readAssetsFile = fs.readFileSync(path.format(f))
      }

      fs.writeFileSync(writePath, readAssetsFile)
    })
}

export default copyAssets
