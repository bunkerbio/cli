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

export class ModelResolver {
  private cacheDir: string;
  private huggingFaceToken?: string;

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
    const [repoId, filename] = this.parseModelSpec(modelSpec);
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
