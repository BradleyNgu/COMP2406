// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// simpleserver.js
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: Sept 18, 2024
//
// Originally inspired by Rod Waldhoff's tiny node.js webserver
//   https://github.com/rodw/tiny-node.js-webserver
//

// MIMEtype function will be removed and replaced with the Deno standard 'contentType' function.
function MIMEtype(filename) {

    const MIME_TYPES = {
        'css': 'text/css',
        'gif': 'image/gif',
        'htm': 'text/html',
        'html': 'text/html',
        'ico': 'image/x-icon',
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'js': 'text/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'txt': 'text/text'
    };

    var extension = "";
    
    if (filename) {
        extension = filename.slice(filename.lastIndexOf('.')+1).toLowerCase();
    }

    return MIME_TYPES[extension] || "application/octet-stream";
};

// Import the 'contentType' function from Deno's standard library for media types.
// Replaces the custom MIMEtype function.
import { contentType } from "jsr:@std/media-types";

async function handler(req) {

    var metadata = {
        status: 200,
        contentType: "text/plain"
    }

    // Serve files from '/home/student/public_html' instead of the current directory.
    const pathname = "." + new URL(req.url).pathname;
    var contents;
    
    // Use the Deno-provided contentType function instead of MIMEtype.
    metadata.contentType = contentType(pathname) || "application/octet-stream";

    // Check if the requested pathname ends in a '/' (indicating a directory) and append 'index.html'.
    if (pathname.endsWith("/")) {
        pathname += "index.html";
    }

    // Added logic to handle requests for files like 'numberX', where X is a positive integer.
    const numberPattern = /\/number(\d+)/;
    const match = pathname.match(numberPattern);

    // If the pathname matches 'numberX', serve a simple page indicating the number.
    if (match) {
        const number = match[1];
        contents = `The number is ${number}!`;
        metadata.contentType = "text/plain";
    } else {
        // Proceed with normal file reading and serving.
        try {
            contents = await Deno.readFile(pathname);
        } catch (e) {
            contents = null;
        }

        // If the file isn't found, serve a custom 404 HTML error page instead of plain text.
        if (!contents) {
            contents = `
                <html>
                <body>
                <h1>404 - Page Not Found</h1>
                <p>The file you requested could not be found.</p>
                </body>
                </html>`;
            metadata.contentType = "text/html"; // Changed content type to 'text/html' for 404 errors.
            metadata.status = 404;

            console.log("error on request for " + pathname);
        } else {
            console.log("returning " + pathname + " of type " + metadata.contentType);
        }
    }

    return new Response(contents, metadata);
}

// Serve the handler using Deno's built-in HTTP server.
Deno.serve(handler);
