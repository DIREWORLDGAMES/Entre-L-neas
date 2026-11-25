import { defineConfig } from "vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserSite = repositoryName?.toLowerCase().endsWith(".github.io") ?? false;
const base = process.env.GITHUB_ACTIONS === "true" && repositoryName && !isUserSite
  ? `/${repositoryName}/`
  : "/";

export default defineConfig({ base });
