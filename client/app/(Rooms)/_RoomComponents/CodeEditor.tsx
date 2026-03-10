"use client";

import { useEffect, useRef, useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import Terminal from "./TerminalComponent";
import { useTerminal } from "@/hooks/useTerminal";
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { WebsocketProvider } from "y-websocket";
import RoomLoadingComponent from "./RoomLoadingComponent";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
  startCompletion,
  completeAnyWord,
} from "@codemirror/autocomplete";
import { syntaxHighlighting } from "@codemirror/language";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";

interface CodeEditorLayoutProps {
  roomId: string;
  roomName: string;
  userName: string;
  language?: string;
  defaultCode?: string;
  token: string;
}

export function CodeEditorLayout({
  language = "javascript",
  roomId,
  userName,
  token,
}: CodeEditorLayoutProps) {
  const terminalOpen = useTerminal((state) => state.terminalOpen);
  const toggleTerminal = useTerminal((state) => state.toggleTerminal);

  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container || editorViewRef.current) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider(
      `${process.env.NEXT_PUBLIC_WS_CONNECTION_URL}/yjs`,
      roomId,
      ydoc,
      {
        params: { token },
      },
    );

    providerRef.current = provider;

    const yText = ydoc.getText("monaco");
    const awareness = provider.awareness;

    function getUserColor(name: string) {
      let hash = 0;
      for (const char of name) hash = char.charCodeAt(0) + ((hash << 5) - hash);
      return `hsl(${hash % 360}, 70%, 50%)`;
    }

    awareness.setLocalStateField("user", {
      name: userName,
      color: getUserColor(userName),
    });

    const styledClients = new Set<number>();
    awareness.on("update", () => {
      awareness.getStates().forEach((state: any, clientId: number) => {
        if (!state.user || styledClients.has(clientId)) return;
        styledClients.add(clientId);

        const color = state.user.color || "#888";
        const name = state.user.name || "Anonymous";
        const style = document.createElement("style");
        style.innerHTML = `
          .yRemoteSelection-${clientId} {
            --yjs-selection-color: ${color}1A;
          }

          .yRemoteSelectionHead-${clientId} {
            --yjs-cursor-color: ${color};
            --yjs-user-name: "${name}";
          }
        `;
        document.head.appendChild(style);
      });
    });

    const undoManager = new Y.UndoManager(yText);

    const state = EditorState.create({
      doc: "",
      extensions: [
        lineNumbers(),
        EditorView.lineWrapping,
        syntaxHighlighting(oneDarkHighlightStyle),
        closeBrackets(),
        autocompletion({
          override: [completeAnyWord],
          activateOnTyping: true,
        }),
        javascript({ typescript: false }),
        yCollab(yText, awareness, { undoManager }),
        keymap.of([
          ...defaultKeymap,
          ...completionKeymap,
          ...closeBracketsKeymap,
          {
            key: "Ctrl-Space",
            run: startCompletion,
          },
          {
            key: "Mod-Space",
            run: startCompletion,
          },
          {
            key: "Mod-z",
            run: () => {
              undoManager.undo();
              return true;
            },
          },
          {
            key: "Mod-y",
            run: () => {
              undoManager.redo();
              return true;
            },
          },
          {
            key: "Mod-s",
            run: () => {
              toast.success("Your changes have been saved!");
              return true;
            },
          },
        ]),
        EditorView.theme({
          "&": {
            backgroundColor: "#1c1b1e",
            color: "#e8e8e8",
            height: "100%",
            fontSize: "14px",
            fontFamily: "Fira Code, Monaco, monospace",
            caretColor: "#e8e8e8",
          },
          "&.cm-focused .cm-cursor": {
            borderLeftColor: "#e8e8e8",
          },
          ".cm-scroller": {
            overflow: "auto",
            lineHeight: "1.6",
            paddingTop: "16px",
            paddingBottom: "16px",
          },
          ".cm-content": {
            caretColor: "#e8e8e8",
          },
          ".cm-gutters": {
            backgroundColor: "#161616",
            color: "#525252",
            border: "none",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "#161616",
          },
          ".cm-activeLine": {
            backgroundColor: "#26242a",
          },
          ".cm-cursor, .cm-dropCursor": {
            borderLeftColor: "#e8e8e8",
          },
          ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection":
            {
              backgroundColor: "#3b3a3f",
            },
          ".cm-ySelectionInfo": {
            opacity: "1",
            color: "#ffffff",
            fontFamily: "Fira Code, Monaco, monospace",
            fontSize: "11px",
            lineHeight: "1.2",
            borderRadius: "4px",
            padding: "2px 6px",
            top: "-1.6em",
          },
          ".cm-ySelectionCaretDot": {
            width: "0.5em",
            height: "0.5em",
          },
        }),
      ],
    });

    editorViewRef.current = new EditorView({
      state,
      parent: container,
    });

    provider.once("sync", () => {
      setIsEditorReady(true);
    });

    return () => {
      editorViewRef.current?.destroy();
      editorViewRef.current = null;
      providerRef.current?.destroy();
      providerRef.current = null;
      ydocRef.current?.destroy();
      ydocRef.current = null;
    };
  }, [roomId, token, userName]);

  // Handle Ctrl+J keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        toggleTerminal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      // cleanup
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleTerminal]);

  return (
    <div className="bg-background flex h-screen w-screen flex-col overflow-hidden pt-16">
      {/* Main Editor Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <ResizablePanelGroup orientation="vertical" className="flex-1">
          {/* Editor Panel */}
          <ResizablePanel defaultSize={terminalOpen ? 60 : 100} minSize={30}>
            <div className="bg-background relative h-full w-full">
              {!isEditorReady && (
                <div className="bg-background absolute inset-0 z-10">
                  <RoomLoadingComponent Icon={Sparkles} text="Finishing up" />
                </div>
              )}
              <div
                ref={editorContainerRef}
                className="h-full w-full"
                data-language={language}
              />
            </div>
          </ResizablePanel>

          {/* Terminal Panel */}
          {terminalOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={15}>
                <Terminal
                  isOpen={terminalOpen}
                  toggleTerminal={toggleTerminal}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
