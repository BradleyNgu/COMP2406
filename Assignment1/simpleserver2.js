// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// simpleserver2.js
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: Sept 26, 2024
//
// run with the following command:
//    deno run --allow-net --allow-read simpleserver2.js
//

const status_NOT_FOUND = 404;
const status_OK = 200;

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


function template_header(title) {
    return `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
  </head>
`
}

function template_notFound(path) {
    return template_header("Page not found") +
        `<body>
<h1>Page not found</h1>

<p>Sorry, the requested page was not found.</p>
</body>
</html>
`
}

async function fileData(path) {
    var contents, status, contentType;
    
    try {
        contents = await Deno.readFile("./www" + path);
        status = status_OK;
        contentType = MIMEtype(path);
    } catch (e) {
        contents = template_notFound(path);
        status = status_NOT_FOUND;
        contentType = "text/html";
    }
    
    return { contents, status, contentType };
}

async function handler(req) {

    var origpath = new URL(req.url).pathname;    
    var path = origpath;
    
    if (path === "/") {
        path = "/index.html";
    }
    
    var r = await fileData(path);

    console.log(`${r.status} ${req.method} ${r.contentType} ${origpath}`); 

    return new Response(r.contents,
                        {status: r.status,
                         headers: {
                             "content-type": r.contentType,
                         }});
}

Deno.serve(handler);