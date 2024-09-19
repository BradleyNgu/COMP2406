import { contentType } from "jsr:@std/media-types";  // Use the Deno standard library

async function handler(req) {
    var metadata = {
        status: 200,
        contentType: "text/plain"
    }

    // Serve files from the /home/student/public_html directory
    let pathname = "/home/student/public_html" + new URL(req.url).pathname;

    // If the requested path is a directory (ends with "/"), append "index.html"
    if (pathname.endsWith("/")) {
        pathname += "index.html";
    }

    const numberPattern = /\/number(\d+)/;
    const match = pathname.match(numberPattern);

    var contents;

    if (match) {
        const number = match[1];
        contents = `The number is ${number}!`;
        metadata.contentType = "text/plain";
    } else {
        // Use Deno contentType to determine the correct MIME type
        metadata.contentType = contentType(pathname) || "application/octet-stream";

        try {
            contents = await Deno.readFile(pathname);
        } catch (e) {
            contents = null;
        }

        // If file is not found, return 404 error page
        if (!contents) {
            contents = `
                <html>
                <body>
                <h1>404 - Page Not Found</h1>
                <p>The file you requested could not be found.</p>
                </body>
                </html>`;
            metadata.contentType = "text/html";
            metadata.status = 404;

            console.log("error on request for " + pathname);
        } else {
            console.log("returning " + pathname + " of type " + metadata.contentType);
        }
    }

    return new Response(contents, metadata);
}

Deno.serve(handler);
