import type { Playground } from "@prisma/client";
import type { TemplateFolder } from "../lib/path-to-json";
import { useCallback, useEffect, useState } from "react";
import { getPlaygroundById, saveUpdatedCode } from "../actions";
import { JsonValue } from "@prisma/client/runtime/library";
import { toast } from "sonner";

interface PlaygroundData extends Playground {
  templateFiles: { content: JsonValue }[];
}

interface UsePlaygroundReturn {
  playgroundData: PlaygroundData | null;
  templateData: TemplateFolder | null;
  isLoading: boolean;
  error: string | null;
  loadPlayground: () => Promise<void>;
  saveTemplateData: (data: TemplateFolder) => Promise<void>;
}

export const usePlayground = (id: string): UsePlaygroundReturn => {
  const [playgroundData, setPlaygroundData] = useState<PlaygroundData | null>(
    null
  );
  const [templateData, setTemplateData] = useState<TemplateFolder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlayground = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await getPlaygroundById(id);
      setPlaygroundData(data as PlaygroundData);

      const rawContent = data?.templateFiles[0]?.content;
      if (typeof rawContent === "string") {
        const parsedContent = JSON.parse(rawContent) as TemplateFolder;
        setTemplateData(parsedContent);
        toast.success("Playground loaded successfully");
        return;
      }

      const res = await fetch(`/api/template/${id}`);

      if (!res.ok) throw new Error("Failed to save template");

      const templateResult = await res.json();
      if (
        templateResult?.templateJson &&
        Array.isArray(templateResult.templateJson)
      ) {
        setTemplateData({
          folderName: "root",
          items: templateResult.templateJson,
        });
      } else {
        setTemplateData(
          templateResult.templateJson || {
            folderName: "root",
            items: [],
          }
        );
      }

      toast.success("Template loaded successfully");
    } catch {
      setError("Failed to load playground");
      toast.error("Failed to load playground");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const saveTemplateData = useCallback(
    async (data: TemplateFolder) => {
      try {
        await saveUpdatedCode(id, data);
        setTemplateData(data);
        toast.success("Template saved successfully");
      } catch {
        setError("Failed to save template");
        toast.error("Failed to save template");
      }
    },
    [id]
  );

  useEffect(() => {
    loadPlayground();
  }, [loadPlayground]);

  return {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  };
};
