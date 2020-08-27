import fs from "fs"
import path from "path"

import mkdir from "../fs/mkdir"
import globalInfo from "../globalInfo"
import parseMd from "../parse/parseMd"
import parseUlka from "../parse/parseUlka"
import absolutePath from "../utils/absolutePath"
import data from "./data"

const configs = globalInfo.configs

async function generateFromMd(ctDir: string, ctIndex?: number | undefined) {
  const contentsDir = ctDir || configs.contents

  // Get all md files data from contentspath
  const contentsDatas = data(
    absolutePath(`src/${contentsDir.path}`),
    ".md",
    parseMd
  )

  if (ctIndex !== undefined) globalInfo.contentFiles[ctIndex] = []

  for (let i = 0; i < contentsDatas.length; i++) {
    const mfd = contentsDatas[i]

    // Get filepath eg: \index.md, \post-1\index.md
    const filePath = path.relative(
      path.join("src", contentsDir.path),
      mfd.relativePath
    )

    const parsedPath = path.parse(filePath)

    // filePath to create .html files
    let createFilePath =
      configs.buildPath + "/" + contentsDir.generatePath + parsedPath.dir

    // The goal here is to generate dir/index.md to dir/index.html
    // and dir/hehe.md to dir/hehe/index.html
    if (parsedPath.name !== "index") {
      createFilePath += "/" + parsedPath.name
      parsedPath.name = "index"
    }

    // Data after parsing markdown
    const mfdData = await mfd.data

    // Url link to the file
    const link = createFilePath.replace(configs.buildPath, "")

    // Absolute Filepath to create html files
    const absoluteFilePath = absolutePath(
      `${createFilePath}/${parsedPath.name}.html`
    )

    const contentData = {
      html: mfdData.html,
      frontMatter: mfdData.frontMatter,
      link: path.join(link, ""),
      createFilePath,
      absoluteFilePath,
      contentsName: contentsDir.name || contentsDir.path
    }

    if (ctIndex !== undefined)
      globalInfo.contentFiles[ctIndex].push(contentData)
    else globalInfo.contentFiles.push(contentData)
  }

  for (let i = 0; i < contentsDatas.length; i++) {
    const mfd = contentsDatas[i]

    try {
      // Path to the template of markdown files
      const mdTemplatePath = absolutePath(
        `src/${configs.templatesPath}/${contentsDir.template}`
      )
      // Templatefile data
      const templateUlkaData = fs.readFileSync(mdTemplatePath, "utf-8")

      // Previosly parsed data that was pushed to globalInfo
      let mfdData

      if (ctIndex !== undefined) mfdData = globalInfo.contentFiles[ctIndex][i]
      else mfdData = globalInfo.contentFiles[i]

      // Prase template ulka file with the value of parsed markdown
      const templateData = await parseUlka(
        templateUlkaData,
        {
          frontMatter: mfdData.frontMatter,
          data: mfdData.html,
          globalInfo
        },
        mdTemplatePath
      )

      // Rewrite html to the parsed html from templates
      if (ctIndex !== undefined)
        globalInfo.contentFiles[ctIndex][i].html = templateData.html
      else globalInfo.contentFiles[i].html = templateData.html

      // Create folder to generate html file
      await mkdir(mfdData.createFilePath)

      // Create html files
      fs.writeFileSync(mfdData.absoluteFilePath, templateData.html)
    } catch (e) {
      console.log(`\n>> Error while generating ${mfd.path}`.red)
      throw e
    }
  }
}

export default generateFromMd
