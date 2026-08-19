import { homedir } from "os";
import { join } from "path";
import { access, mkdir } from "fs/promises";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { ModelNotFoundError, ModelDownloadError } from "../errors.js";

export interface ModelResolverConfig {
  cacheDir?: string;
  huggingFaceToken?: string;
}

interface RepoFileCache {
  files: string[];
  fetchedAt: number;
}

export class ModelResolver {
  private cacheDir: string;
  private huggingFaceToken?: string;
  private repoFileCache: Map<string, RepoFileCache> = new Map();
  private readonly CACHE_TTL_MS = 300000; // 5 minutes

  constructor(config: ModelResolverConfig = {}) {
    this.cacheDir = config.cacheDir ?? join(homedir(), ".boole", "models");
    this.huggingFaceToken = config.huggingFaceToken;
  }

  async resolve(modelSpec: string): Promise<string> {
    if (await this.isLocalPath(modelSpec)) {
      return modelSpec;
    }
    return this.resolveFromHub(modelSpec);
  }

  private async isLocalPath(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async resolveFromHub(modelSpec: string): Promise<string> {
    const [repoId, filenameOrPattern] = this.parseModelSpec(modelSpec);

    // Fetch available files from the repo
    const availableFiles = await this.fetchRepoFiles(repoId);

    // Try exact match first
    let filename = availableFiles.find(f => f === filenameOrPattern);

    // If no exact match, try fuzzy matching (case-insensitive pattern search)
    if (!filename) {
      const pattern = filenameOrPattern.toLowerCase();
      const ggufFiles = availableFiles.filter(f => f.toLowerCase().endsWith('.gguf'));
      const matches = ggufFiles.filter(f => f.toLowerCase().includes(pattern));

      if (matches.length === 0) {
        throw new ModelNotFoundError(
          `No file matching "${filenameOrPattern}" found in ${repoId}.\n\n` +
          `Available GGUF files:\n${ggufFiles.map(f => `  - ${f}`).join('\n')}`
        );
      }

      if (matches.length > 1) {
        throw new ModelNotFoundError(
          `Multiple files match "${filenameOrPattern}" in ${repoId}:\n` +
          `${matches.map(f => `  - ${f}`).join('\n')}\n\n` +
          `Please specify the exact filename after the colon.`
        );
      }

      filename = matches[0];
    }

    const localPath = join(this.cacheDir, repoId, filename);

    if (await this.isLocalPath(localPath)) {
      return localPath;
    }

    await this.downloadFromHub(repoId, filename, localPath);
    return localPath;
  }

  private parseModelSpec(spec: string): [string, string] {
    const parts = spec.split(":");
    if (parts.length === 1) {
      throw new ModelNotFoundError(
        `Invalid model spec "${spec}". Expected format: "repo/model:filename.gguf"`
      );
    }
    const repoId = parts[0];
    const filename = parts.slice(1).join(":");
    return [repoId, filename];
  }

  private async fetchRepoFiles(repoId: string): Promise<string[]> {
    // Check cache first
    const cached = this.repoFileCache.get(repoId);
    if (cached && Date.now() - cached.fetchedAt < this.CACHE_TTL_MS) {
      return cached.files;
    }

    // Fetch from HuggingFace API
    const url = `https://huggingface.co/api/models/${repoId}`;
    const headers: Record<string, string> = {};
    if (this.huggingFaceToken) {
      headers["Authorization"] = `Bearer ${this.huggingFaceToken}`;
    }

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new ModelNotFoundError(
          `Failed to fetch repo info for ${repoId}: HTTP ${response.status}`
        );
      }

      const data = await response.json() as { siblings?: { rfilename: string }[] };
      const files = (data.siblings || []).map(s => s.rfilename);

      // Cache the result
      this.repoFileCache.set(repoId, { files, fetchedAt: Date.now() });

      return files;
    } catch (error) {
      throw new ModelNotFoundError(
        `Failed to fetch repo info for ${repoId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async downloadFromHub(
    repoId: string,
    filename: string,
    destinationPath: string
  ): Promise<void> {
    const url = `https://huggingface.co/${repoId}/resolve/main/${filename}`;

    try {
      await mkdir(join(destinationPath, ".."), { recursive: true });

      const headers: Record<string, string> = {};
      if (this.huggingFaceToken) {
        headers["Authorization"] = `Bearer ${this.huggingFaceToken}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new ModelDownloadError(
          `${repoId}:${filename}`,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new ModelDownloadError(
          `${repoId}:${filename}`,
          "Response body is null"
        );
      }

      const fileStream = createWriteStream(destinationPath);
      await pipeline(response.body as any, fileStream);
    } catch (error) {
      throw new ModelDownloadError(
        `${repoId}:${filename}`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  getCacheDir(): string {
    return this.cacheDir;
  }
}
