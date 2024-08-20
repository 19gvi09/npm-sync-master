import {download, execPromisified, filterAsync, publish, view} from "./utils.js";
import fs from "fs";

const viewWithAllNestedDeps = async ({name, version}, packages = []) => {
  const pack = await view({name, version})
  if (pack.dependencies) {
    const res = await Promise.all(Object.entries(pack.dependencies).map(([name, version]) => viewWithAllNestedDeps({name, version}, packages)))
    packages = res.reduce((acc, val) => [...acc, ...val], packages)
  }
  if (process.argv.includes("--verbose")) {
    console.log(`Package name: ${pack.name}\nDeep nested dependencies count: ${packages.length}`)
  }
  packages = [...packages, pack]
  return packages
}

const viewMissingPackages = async (packages, registry) => {
  return await filterAsync(packages, (pack) => view({name: pack.name, version: pack.version, registry}))
}

const downloadMissingPackages = async (packages) => {
  const promises = packages.map((pkg) => download(pkg.dist.tarball))
  await Promise.allSettled(promises)
}

const uploadMissingPackages = async (registry) => {
  if (!fs.existsSync("downloads")) return
  const packages = fs.readdirSync("./downloads")
  const promises = packages.map(pkg => publish(`./downloads/${pkg}`, registry))
  await Promise.allSettled(promises)
  fs.rmSync("./downloads", { recursive: true, force: true });
}

const packages = await viewWithAllNestedDeps({name: "react"})
const missingPackages = await viewMissingPackages(packages, "http://localhost:4873/")
await downloadMissingPackages(missingPackages)
await uploadMissingPackages("http://localhost:4873/")