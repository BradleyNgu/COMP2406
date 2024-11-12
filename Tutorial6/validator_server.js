// SPDX-License-Identifier: GPL-3.0-or-later
// Validator server for COMP 2406 (Fall 2024), Carleton University
//
// Initial version: Nov 11, 2024
//
// Run with the following command:
//    deno run --allow-net --allow-read validator_server.js
//

const status_NOT_FOUND = 404;
const status_OK = 200;

function MIMEtype(filename) {
    const MIME_TYPES = {
        'css': 'text/css',
        'html': 'text/html',
        'js': 'text/javascript'
    };

    const extension = filename.split('.').pop().toLowerCase();
    return MIME_TYPES[extension] || "application/octet-stream";
}

function template_notFound(path) {
    return `<!DOCTYPE html>
<html>
<head><title>Page not found</title></head>
<body>
  <h1>Page not found</h1>
  <p>Sorry, the requested page was not found.</p>
</body>
</html>`;
}

async function fileData(path) {
    let contents, status, contentType;
    
    try {
        contents = await Deno.readFile(`./static${path}`);
        status = status_OK;
        contentType = MIMEtype(path);
    } catch (e) {
        contents = new TextEncoder().encode(template_notFound(path));
        status = status_NOT_FOUND;
        contentType = "text/html";
    }
    
    return { contents, status, contentType };
}

async function handler(req) {
    const url = new URL(req.url);
    let path = url.pathname === "/" ? "/index.html" : url.pathname;

    const r = await fileData(path);
    
    console.log(`${r.status} ${req.method} ${r.contentType} ${path}`);
    
    return new Response(r.contents, {
        status: r.status,
        headers: { "content-type": r.contentType },
    });
}

const ac = new AbortController();
const server = Deno.serve(
    {
        signal: ac.signal,
        port: 8000,
        hostname: "0.0.0.0"
    },
    handler
);

Deno.addSignalListener("SIGINT", () => {
    console.log("SIGINT received, terminating...");
    ac.abort();
});

server.finished.then(() => {
    console.log("Server terminating.");
});
