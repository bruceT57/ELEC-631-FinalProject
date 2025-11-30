import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const BACKEND = process.env.BACKEND_URL || "http://localhost:5001";

const app = express();

// ---------- Core middleware (MUST be before proxy) ----------
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// ---------- Health ----------
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    gateway: true,
    target: BACKEND,
    ts: new Date().toISOString(),
  });
});

// ---------- Debug echo (to verify gateway sees JSON) ----------
app.post("/debug/echo", (req: Request, res: Response) => {
  res.json({ headers: req.headers, body: req.body });
});

// ---------- Helper: reattach JSON body to proxied request ----------
function attachBodyIfPresent(proxyReq: any, req: Request) {
  const hasBody = req.body && Object.keys(req.body).length > 0;
  if (!hasBody) return;

  const contentType = (req.headers["content-type"] || "").toString();
  const isJson = contentType.includes("application/json");
  if (!isJson) return;

  const bodyData = JSON.stringify(req.body);
  proxyReq.setHeader("Content-Type", "application/json");
  proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
}

// ---------- Proxy /api/* straight to backend (no path rewrite) ----------
app.use(
  "/api",
  createProxyMiddleware({
    target: BACKEND,
    changeOrigin: true,
    ws: false,
    proxyTimeout: 15000,
    timeout: 15000,
    logLevel: "warn", // set 'debug' if you need deeper logs
    onProxyReq: (proxyReq, req, res) => {
      attachBodyIfPresent(proxyReq, req as Request);
    },
    onError: (err, req, res) => {
      console.error("[Gateway] Proxy error:", err.message);
      const r = res as Response;
      if (!r.headersSent) {
        r.status(502).json({ error: "Bad gateway", detail: err.message });
      }
    },
  })
);

// ---------- 404 & error handler ----------
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Gateway: Route not found", path: req.path });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Gateway] Unhandled error:", err);
  res.status(500).json({ error: "Gateway error", detail: err.message });
});

app.listen(PORT, () => {
  console.log(`\n===== Gateway running on http://localhost:${PORT} → ${BACKEND} =====\n`);
});
