import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;

const manifestPath = "manifest.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const minAppVersion = manifest.minAppVersion;

const versionsPath = "versions.json";
const versions = JSON.parse(readFileSync(versionsPath, "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync(versionsPath, JSON.stringify(versions, null, "\t"));

