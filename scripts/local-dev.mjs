import { createServer } from "vite";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: { port: { type: "string", default: "5173" } },
});

// Small writes avoid stalled large loopback packets in this local environment.
const server = await createServer({
  server: { host: "0.0.0.0", port: Number(values.port) },
  plugins: [
    {
      name: "local-response-pacing",
      configureServer(vite) {
        vite.middlewares.use((_request, response, next) => {
          response.socket?.setNoDelay(true);
          const write = response.write.bind(response);
          const end = response.end.bind(response);
          const queue = [];
          let running = false;
          let ending = false;
          let endCallback;
          async function pump() {
            if (running) return;
            running = true;
            while (queue.length && !response.destroyed) {
              const { bytes, callback } = queue.shift();
              for (
                let offset = 0;
                offset < bytes.length && !response.destroyed;
                offset += 4096
              ) {
                write(bytes.subarray(offset, offset + 4096));
                await new Promise((resolve) => setTimeout(resolve, 5));
              }
              callback?.();
            }
            running = false;
            if (ending && !response.destroyed) end(endCallback);
          }
          response.write = (chunk, encoding, callback) => {
            queue.push({
              bytes: Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(
                    chunk,
                    typeof encoding === "string" ? encoding : "utf8",
                  ),
              callback: typeof encoding === "function" ? encoding : callback,
            });
            void pump();
            return true;
          };
          response.end = (chunk, encoding, callback) => {
            endCallback = [chunk, encoding, callback].find(
              (value) => typeof value === "function",
            );
            ending = true;
            if (
              chunk !== undefined &&
              chunk !== null &&
              typeof chunk !== "function"
            ) {
              queue.push({
                bytes: Buffer.isBuffer(chunk)
                  ? chunk
                  : Buffer.from(
                      chunk,
                      typeof encoding === "string" ? encoding : "utf8",
                    ),
              });
            }
            void pump();
            return response;
          };
          next();
        });
      },
    },
  ],
});
await server.listen();
server.printUrls();
server.bindCLIShortcuts({ print: true });
