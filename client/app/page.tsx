"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github } from "lucide-react";
import { Fira_Code } from "next/font/google";
import axios from "axios";

const socket = io("http://localhost:9002");

const firaCode = Fira_Code({ subsets: ["latin"] });

export default function Home() {
  const [repoURL, setURL] = useState<string>("");

  const [logs, setLogs] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const [projectId, setProjectId] = useState<string | undefined>();
  const [deployPreviewURL, setDeployPreviewURL] = useState<
    string | undefined
  >();

  const logContainerRef = useRef<HTMLElement>(null);

  const isValidURL: [boolean, string | null] = useMemo(() => {
    if (!repoURL || repoURL.trim() === "") return [false, null];
    const regex = new RegExp(
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/)?$/
    );
    return [regex.test(repoURL), "Enter valid Github Repository URL"];
  }, [repoURL]);

  const handleClickDeploy = useCallback(async () => {
    setLoading(true);

    const { data } = await axios.post(`http://localhost:5000`, {
      git_url: repoURL,
    });

    if (data && data.data) {
      const { projectid } = data.data;
      setProjectId(projectid);
      const url = `http://${projectid}.localhost:8000`;
      setDeployPreviewURL(url);

      console.log(`Subscribing to logs:${projectid}`);
      socket.emit("subscribe", `logs:${projectid}`);
    }
  }, [repoURL]);

  const handleSocketIncommingMessage = useCallback((message: string) => {
    console.log(`[Incomming Socket Message]:`, typeof message, message);

    // const { log } = JSON.parse(message);
    setLogs((prev) => [...prev, message]);
    
    logContainerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    socket.on("message", handleSocketIncommingMessage);

    return () => {
      socket.off("message", handleSocketIncommingMessage);
    };
  }, [handleSocketIncommingMessage]);

  return (
    <>
      <nav className="text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <a href="/" className="text-lg font-bold">Netlify Clone</a>
          <div className="flex items-center gap-4">
            <a href="/about" className="hover:bg-slate-900 hover:text-white px-3 py-2 rounded transition duration-150 ease-in-out">About</a>
            <a href="/contact" className="hover:bg-slate-900 hover:text-white px-3 py-2 rounded transition duration-150 ease-in-out">Contact</a>
          </div>
        </div>
      </nav>
      <main className="flex justify-center items-center h-[calc(100vh-175px)]">
        <div className="w-[600px]">
          <span className="flex justify-start items-center gap-2">
            {/* <Github className="text-5xl" /> */}
            <Input
              disabled={loading}
              value={repoURL}
              onChange={(e) => setURL(e.target.value)}
              type="url"
              placeholder="Github URL"
            />
          </span>
          <Button
            onClick={handleClickDeploy}
            disabled={!isValidURL[0] || loading}
            className="w-full mt-3"
          >
            {loading ? "In Progress" : "Deploy"}
          </Button>
          {deployPreviewURL && (
            <div className="mt-2 bg-slate-900 py-4 px-2 rounded-lg">
              <p>
                Preview URL{" "}
                <a
                  target="_blank"
                  className="text-sky-400 bg-sky-950 px-3 py-2 rounded-lg"
                  href={deployPreviewURL}
                >
                  {deployPreviewURL}
                </a>
              </p>
            </div>
          )}
          {logs.length > 0 && (
            <div
              className={`${firaCode.className} text-sm text-green-500 logs-container mt-5 border-green-500 border-2 rounded-lg p-4 h-[300px] overflow-y-auto`}
            >
              <pre className="flex flex-col gap-1">
                {logs.map((log, i) => (
                  <code
                    ref={logs.length - 1 === i ? logContainerRef : undefined}
                    key={i}
                  >{`> ${log}`}</code>
                ))}
              </pre>
            </div>
          )}
        </div>
      </main>
      <footer className="text-slate-500 py-4 mt-8 ">
      <div className="container mx-auto text-right ">
          <a
            href="https://github.com/yourGithubUsername"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:underline px-4 text-xs"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/yourLinkedInProfile"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:underline text-xs"
          >
            LinkedIn
          </a>
        </div>
      </footer>
    </>
  );
}
