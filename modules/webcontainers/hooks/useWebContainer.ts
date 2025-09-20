import { TemplateFolder } from "@/modules/playground/lib/path-to-json";
import { WebContainer } from "@webcontainer/api";
import { useEffect, useState } from "react";

interface useWebContainerProps {
  templateData: TemplateFolder;
}

interface useWebContainerReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  destroy: () => void;
}

export const useWebContainer = ({
  templateData,
}: useWebContainerProps): useWebContainerReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<WebContainer | null>(null);

  useEffect(() => {
    let mounted = true;

    const startWebContainer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const webContainerInstance = await WebContainer.boot();
        if (!mounted) return;

        setInstance(webContainerInstance);
      } catch (error) {
        console.error("Failed to start WebContainer", error);
        if (mounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to start WebContainer"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    startWebContainer();

    return () => {
      mounted = false;
      if (instance) {
        instance.teardown();
      }
    };
  }, []);

  const writeFileSync = async (path: string, content: string) => {
    if (!instance) {
      throw new Error("WebContainer instance is not initialized");
    }

    try {
      const pathParts = path.split("/");
      const folderPath = pathParts.slice(0, -1).join("/");

      if (folderPath) {
        await instance.fs.mkdir(folderPath, { recursive: true });
      }
      await instance.fs.writeFile(path, content);
    } catch (error) {
      console.error("Failed to write file", error);
      throw new Error("Failed to write file");
    }
  };

  const destroy = () => {
    if (instance) {
      instance.teardown();
      setInstance(null);
      setServerUrl(null);
    }
  };

  return {
    serverUrl,
    isLoading,
    error,
    instance,
    writeFileSync,
    destroy,
  };
};
