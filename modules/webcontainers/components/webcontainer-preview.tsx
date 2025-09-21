"use client";

import { TemplateFolder } from "@/modules/playground/lib/path-to-json";
import { WebContainer } from "@webcontainer/api";
import { useEffect, useRef, useState } from "react";
import { transformToWebContainerFormat } from "../lib/transformer";
import { Check, CheckCircle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Term from "./terminal";

interface WebContainerPreviewProps {
  templateData: TemplateFolder;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  serverUrl: string | null;
  forceReStart?: boolean;
}

function WebContainerPreview({
  templateData,
  instance,
  writeFileSync,
  isLoading,
  error,
  serverUrl,
  forceReStart,
}: WebContainerPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loadingState, setLoadingState] = useState({
    transforming: false,
    mounting: false,
    installing: false,
    starting: false,
    ready: false,
  });
  const [currentStep, setCurrentStep] = useState<number>(0);
  const totalSteps = 4;
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(false);
  const [isSetupInProgress, setIsSetupInProgress] = useState<boolean>(false);

  const terminalRef = useRef<{
    writeToTerminal: (data: string) => void;
    clearTerminal: () => void;
    focusTerminal: () => void;
  }>(null);

  useEffect(() => {
    if (forceReStart) {
      setIsSetupCompleted(false);
      setIsSetupInProgress(false);
      setPreviewUrl("");
      setCurrentStep(0);
      setLoadingState({
        transforming: false,
        mounting: false,
        installing: false,
        starting: false,
        ready: false,
      });
    }
  }, [forceReStart]);

  useEffect(() => {
    const setupContainer = async () => {
      if (!instance || isSetupCompleted || isSetupInProgress) return;

      try {
        setIsSetupInProgress(true);
        setSetupError(null);

        try {
          const packageJsonExists = await instance.fs.readFile(
            "package.json",
            "utf-8"
          );

          if (packageJsonExists) {
            if (terminalRef?.current?.writeToTerminal) {
              terminalRef.current.writeToTerminal(
                "Reconnecting to existing WebContainer instance...\r\n"
              );
            }

            instance.on("server-ready", (port, url) => {
              if (terminalRef?.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(
                  "Development server is already running at: " + url + "\r\n"
                );
              }

              setPreviewUrl(url);
              setLoadingState((prev) => ({
                ...prev,
                starting: false,
                ready: true,
              }));
            });

            setCurrentStep(4);
            setLoadingState((prev) => ({ ...prev, starting: true }));
            return;
          }
        } catch {}

        setLoadingState((prev) => ({ ...prev, transforming: true }));
        setCurrentStep(1);
        if (terminalRef?.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "Transforming template files...\r\n"
          );
        }
        const files = transformToWebContainerFormat(templateData);

        setLoadingState((prev) => ({
          ...prev,
          transforming: false,
          mounting: true,
        }));
        setCurrentStep(2);
        if (terminalRef?.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal("Mounting files...\r\n");
        }
        await instance.mount(files);
        if (terminalRef?.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "Files mounted successfully.\r\n"
          );
        }

        setLoadingState((prev) => ({
          ...prev,
          mounting: false,
          installing: true,
        }));
        setCurrentStep(3);
        if (terminalRef?.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal("Installing dependencies...\r\n");
        }
        const installProcess = await instance.spawn("npm", ["install"]);
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminalRef?.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(data);
              }
            },
          })
        );
        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          throw new Error(
            `npm install failed with exit code ${installExitCode}`
          );
        }
        if (terminalRef?.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "Dependencies installed successfully.\r\n"
          );
        }

        setLoadingState((prev) => ({
          ...prev,
          installing: false,
          starting: true,
        }));
        setCurrentStep(4);
        if (terminalRef?.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "Starting development server...\r\n"
          );
        }
        const startProcess = await instance.spawn("npm", ["run", "start"]);
        instance.on("server-ready", (port, url) => {
          if (terminalRef?.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              "Development server is running at: " + url + "\r\n"
            );
          }
          setPreviewUrl(url);
          setLoadingState((prev) => ({
            ...prev,
            starting: false,
            ready: true,
          }));
          setIsSetupCompleted(true);
          setIsSetupInProgress(false);
        });
        startProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminalRef?.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(data);
              }
            },
          })
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (terminalRef?.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            `Error during setup: ${errorMessage}\r\n`
          );
        }
        setSetupError(errorMessage);
        setIsSetupInProgress(false);
        setLoadingState({
          transforming: false,
          mounting: false,
          installing: false,
          starting: false,
          ready: false,
        });
      }
    };

    setupContainer();
  }, [instance, isSetupCompleted, isSetupInProgress, templateData]);

  useEffect(() => {
    return () => {};
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900">
          <Loader2 className="mx-auto size-10 text-primary animate-spin " />
          <h3 className="text-lg font-medium">Initializing WebContainer</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please wait while we set up your development environment.
          </p>
        </div>
      </div>
    );
  }

  if (error || setupError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="max-w-md p-6 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="size-5" />
            <h3 className="font-semibold">Error</h3>
          </div>
          <p className="text-sm">{error || setupError}</p>
        </div>
      </div>
    );
  }

  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return <CheckCircle className="size-5 text-green-600" />;
    } else if (stepIndex === currentStep) {
      return <Loader2 className="size-5 text-blue-600 animate-spin" />;
    } else {
      return <div className="size-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepText = (stepIndex: number, label: string) => {
    const isActive = stepIndex === currentStep;
    const isCompleted = stepIndex < currentStep;

    return (
      <span
        className={`text-sm font-medium ${
          isCompleted
            ? "text-green-600"
            : isActive
            ? "text-blue-600"
            : "text-gray-500"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {!previewUrl ? (
        <div className="h-full flex flex-col">
          <div className="w-full max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto">
            <Progress
              value={(currentStep / totalSteps) * 100}
              className="h-2 mb-6"
            />

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                {getStepIcon(1)}
                {getStepText(1, "Transforming Files")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(2)}
                {getStepText(2, "Mounting Files")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(3)}
                {getStepText(3, "Installing Dependencies")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(4)}
                {getStepText(4, "Starting Development Server")}
              </div>
            </div>
          </div>

          <div className="flex-1 p-4">
            <Term
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <iframe
              src={previewUrl}
              className="h-full w-full border-0"
              title="WebContainer Preview"
            />
          </div>

          <div className="h-64 border-t">
            <Term
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default WebContainerPreview;
