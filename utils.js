import {exec} from "child_process"
import {promisify} from "util"
import fs from "fs";
import {mkdir} from "fs/promises";
import path from "path";
import {finished} from "stream/promises";
import {Readable} from "stream";

export const execPromisified = promisify(exec)

export const search = async ({name, registry, searchlimit = 1000000}) => {
  let command = `npm search ${name} --json --description=false`
  if (registry) {
    command = command.concat(" --registry=", registry)
  }
  if (searchlimit) {
    command = command.concat(" --searchlimit=", searchlimit)
  }
  try {
    const {stdout} = await execPromisified(command)
    return JSON.parse(stdout)
  } catch (e) {
    console.error(e)
  }
}

export const view = async ({name, version, registry}) => {
  const formattedVersion = version ? `@${version}` : ""
  let command = `npm view ${name+formattedVersion} --json`
  if (registry) {
    command = command.concat(" --registry=", registry)
  }
  try {
    const {stdout} = await execPromisified(command)
    return JSON.parse(stdout)
  } catch (e) {
    //console.error(JSON.parse(e.stdout).error)
    throw e
  }
}

export const pack = async ({name, version}) => {
  const formattedVersion = version ? `@${version}` : ""
  const command = `npm pack ${name+formattedVersion}`
  try {
    const {stdout} = await execPromisified(command)
    return JSON.parse(stdout)
  } catch (e) {
    console.error(e)
  }
}

export const publish = async (path, registry) => {
  console.log(path)
  const command = `npm publish ${path} --registry ${registry}`
  try {
    const {stdout} = await execPromisified(command)
    return JSON.parse(stdout)
  } catch (e) {
    console.error(e)
  }
}

export const download = async (link) => {
  try {
    const res = await fetch(link)
    const fileName = link.split("/").at(-1)
    if (!fs.existsSync("downloads")) await mkdir("downloads");
    const destination = path.resolve("./downloads", fileName);
    const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
  } catch (e) {
    console.error(e)
  }
}

export const filterAsync = async (array, asyncCallback) => {
  const filterResults = await Promise.allSettled(array.map(asyncCallback));
  return array.filter((_, index) => filterResults[index].status === "rejected");
}