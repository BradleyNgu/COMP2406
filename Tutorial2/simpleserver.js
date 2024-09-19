import { contentType } from "jsr:@std/media-types";  // Use the Deno standard library

async function handler(req) {
    var metadata = {
        status: 200,
        contentType: "text/plain"
    }

    // Serve files from the /home/student/public_html directory
    let pathname = "/Desktop/COMP2406/Tutorial2" + new URL(req.url).pathname;

    // Serve index.html when a directory is accessed
    if (pathname.endsWith("/")) {
        pathname += "index.html";
    }

    // Handle requests for files like /number5
    const numberPattern = /\/number(\d+)/;
    const match = pathname.match(numberPattern);

    var contents;

    if (match) {
        const number = match[1];
        contents = `The number is ${number}!`;
        metadata.contentType = "text/plain";
    } else {
        // Use the Deno contentType function
        metadata.contentType = contentType(pathname) || "application/octet-stream";

        try {
            contents = await Deno.readFile(pathname);
        } catch (e) {
            contents = null;
        }

        // Handle 404 errors with a custom HTML page
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
