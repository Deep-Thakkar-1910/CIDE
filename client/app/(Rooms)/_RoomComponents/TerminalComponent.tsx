"use client";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Play, Terminal as TerminalIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useExecution } from "@/hooks/useExecution";
import { useTerminal } from "@/hooks/useTerminal";
import axios from "@/lib/axios";
import { AxiosError } from "axios";
import { toast } from "sonner";

interface TerminalProps {
  isOpen: boolean;
  toggleTerminal: () => void;
  roomId: string;
}

export default function Terminal({
  isOpen,
  toggleTerminal,
  roomId,
}: TerminalProps) {
  const input = useExecution((state) => state.input);
  const output = useExecution((state) => state.output);
  const code = useExecution((state) => state.code);
  const language = useExecution((state) => state.language);
  const isRunning = useExecution((state) => state.isRunning);
  const setInput = useExecution((state) => state.setInput);
  const setOutput = useExecution((state) => state.setOutput);
  const setIsRunning = useExecution((state) => state.setIsRunning);
  const clearOutput = useExecution((state) => state.clearOutput);
  const requestMinSize = useTerminal((state) => state.requestMinSize);

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error("No code to run yet.");
      return;
    }
    window.dispatchEvent(new Event("cide:focus-editor"));

    setIsRunning(true);
    try {
      if (!isOpen) toggleTerminal(); // open terminal if it's not already open
      requestMinSize(40);
      setOutput("Running...");
      const result = await axios.post("/execute", {
        roomId,
        code,
        input,
        language,
      });
      setOutput(result.data.output || "No output");
    } catch (err) {
      if (err instanceof AxiosError) {
        setOutput(`Error: ${err.response?.data?.error || err.message}`);
      } else {
        setOutput(`Error: ${String(err)}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-card border-border flex h-full w-full flex-col border-t">
      {/* Terminal Header */}
      <div className="border-border bg-muted/30 flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <TerminalIcon className="text-muted-foreground h-4 w-4" />
          <span className="text-foreground text-sm font-semibold">Console</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 cursor-pointer px-2"
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning ? (
            <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <Play className="mr-1.5 size-3.5" />
          )}
          {isRunning ? "Running" : "Run"}
        </Button>
      </div>

      {/* Terminal Content */}
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          {/* Input Section */}
          <ResizablePanel defaultSize={50} minSize="30%">
            <div className="flex h-full flex-col">
              <div className="border-border bg-muted flex h-10 border-b px-4 py-2">
                <p className="text-muted-foreground mt-1 text-xs font-medium">
                  Input
                </p>
              </div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="bg-background text-foreground placeholder:text-muted-foreground/50 flex-1 resize-none overflow-auto p-3 font-mono text-xs focus:outline-none"
                placeholder="Enter test input here..."
                spellCheck="false"
                readOnly={isRunning} // prevent editing input while code is running
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Output Section */}
          <ResizablePanel defaultSize={50} minSize="30%">
            <div className="flex h-full flex-col">
              <div className="border-border bg-muted sticky top-0 flex h-10 w-full justify-between border-b px-4 py-2">
                <p className="text-muted-foreground mt-1 text-xs font-medium">
                  Output
                </p>
                <Button
                  variant="ghost"
                  size={"xs"}
                  onClick={clearOutput}
                  className="text-muted-foreground cursor-pointer"
                >
                  Clear
                </Button>
              </div>
              <div className="bg-background flex h-full flex-col items-start justify-start p-4">
                <pre className="text-muted-foreground wrap-break-words max-w-[90%] text-sm whitespace-pre-wrap">
                  {output}
                </pre>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
