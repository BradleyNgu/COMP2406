// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// formdemo.js
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: Sept 25, 2024
//
// run with the following command:
//    deno run --allow-net --allow-read formdemo.js
//
const status_NOT_FOUND = 404;
const status_OK = 200;
var state = [];
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
    //return MIME_TYPES[extension] || "application/octet-stream";
};
function template_header(title) {
    return `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <link rel="stylesheet" href="/style.css">
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
function template_addRecord(obj) {
    return template_header("Person just added") +
        `<body>
  <body>
    <h1>Person just added</h1>
    <p>Name: ${obj.name}</p>
    <p>City: ${obj.city}</p>
    <p>Country: ${obj.country}</p>
    <p>Birthday: ${obj.birthday}</p>
    <p>Email: ${obj.email}</p>
  </body>
</html>
`
}
function template_listRecords(state) {
     const pageTop = `  <body>
    <h1>People Listing</h1>
    <div>
      <div></div>
      <table>
        <thead>
          <th>Name</th>
          <th>City</th>
          <th>Country</th>
          <th>Birthday</th>
          <th>Email</th>
        </thead>
        <tbody>`;
    const pageBottom = `        </tbody>
      </table>
    </div>
    <form method="get" action="/">
    </form>
  </body>
</html>`;
    //deleted button type="submit">Home</button>
    var row = [];
     
    function rowMarkup(s) {
        return "<td>" + s + "</td>";
    }
    for (let r of state) {
        row.push("<tr>")
        row.push(rowMarkup(r.name));
        row.push(rowMarkup(r.city));
        row.push(rowMarkup(r.country));
        row.push(rowMarkup(r.birthday));
        row.push(rowMarkup(r.email));
        row.push("</tr>")
    }
    return template_header("List of Records") +
        pageTop + row.join("\n") + pageBottom;
}
function listRecords(state) {
    var response = { contentType: "text/html",
                     status: status_OK,
                     contents: template_listRecords(state),
                   };
    return response;
}
async function routeGet(req) {
    const path = new URL(req.url).pathname;
    if (path === "/list") {
        return listRecords(state);
    } else {
        return null;
    }
}
async function addRecord(req) {
    var body = await req.formData();
    var obj = { name: body.get("name"),
                city: body.get("city"),
                country: body.get("country"),
                birthday: body.get("birthday"),
                email: body.get("email") };
    //state.push(obj);
    var response = { contentType: "text/html",
                     status: status_OK,
                     contents: template_addRecord(obj),
                   };
    return response;
}
async function routePost(req) {
    const path = new URL(req.url).pathname;    
    if (path === "/add") {
        return await addRecord(req);
    } else {
        return null;
    }
}
async function route(req) {
    if (req.method === "GET") {
        return await routeGet(req);
    } else if (req.method === "POST") {
        return await routePost(req);
    } else {
        return null;
    }
}
async function fileData(path) {
    var contents, status, contentType;
    
    try {
        contents = await Deno.readFile("./static" + path);
        status = status_OK;
        //contentType = MIMEtype(path);
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
    var r =  await route(req);
    
    if (!r) {
        if (path === "/") {
            //path = "/index.html";
        }
        r = await fileData(path);
    }
    //console.log(`${r.status} ${req.method} ${r.contentType} ${origpath}`); 
    return new Response(r.contents,
                        {status: r.status,
                         headers: {
                             "content-type": r.contentType,
                         }});
}
Deno.serve({ port: 8000, hostname: "0.0.0.0" }, handler);