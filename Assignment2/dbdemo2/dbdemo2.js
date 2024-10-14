// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// dbdemo2.js
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: October 7, 2024
//
// run with the following command:
//    deno run --allow-net --allow-read --allow-write dbdemo2.js
//

import { DB } from "https://deno.land/x/sqlite/mod.ts";

const status_NOT_FOUND = 404;
const status_OK = 200;
const status_NOT_IMPLEMENTED = 501;
const appTitle = "COMP 2406 DB Demo 2";
const dbFile = "people.db";
const table = "people";

const db = new DB(dbFile);

db.execute(`
  CREATE TABLE IF NOT EXISTS ${table} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    city TEXT,
    country TEXT,
    birthday TEXT,
    email TEXT
  )
`);


function addRecordDB(db, table, r) {
    return db.query(`INSERT INTO ${table} ` +
                    "(name, city, country, birthday, email) " +
                    "VALUES (?, ?, ?, ?, ?)",
                    [r.name, r.city, r.country, r.birthday, r.email]);
}


function getAllRecordsDB(db, table) {
    var state = [];
    const query =
          db.prepareQuery(
              "SELECT id, name, city, country, birthday, email FROM " +
                  table + " ORDER BY name ASC LIMIT 50");

    for (const [id, name, city, country, birthday, email] of query.iter()) {
        state.push({id, name, city, country, birthday, email});
    }

    query.finalize();
    
    return state;
}


function analyzeRecordsDB(db, table) {
    var analysis = {};

    analysis.count = db.query("SELECT COUNT(*) FROM " + table);
    analysis.cityList = db.query("SELECT DISTINCT CITY FROM " + table);
    
    return analysis;
}


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
        'pdf': 'application/pdf',
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
    const fullTitle = appTitle + ": " + title;
    
    return `<!DOCTYPE html>
<html>
  <head>
    <title>${fullTitle}</title>
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
    return template_header("Record just added") +
        `<body>
  <body>
    <h1>Person just added</h1>
    <p>Name: ${obj.name}</p>
    <p>City: ${obj.city}</p>
    <p>Country: ${obj.country}</p>
    <p>Birthday: ${obj.birthday}</p>
    <p>Email: ${obj.email}</p>
    <form method="get" action="/">
      <button type="submit">Home</button>
    </form>
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
      <button type="submit">Home</button>
    </form>
  </body>
</html>`;

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


function listRecords() {
    var state = getAllRecordsDB(db, table);
    var response = { contentType: "text/html",
                     status: status_OK,
                     contents: template_listRecords(state),
                   };

    return response;
}


async function routeGet(req) {
    const path = new URL(req.url).pathname;
    if (path === "/list") {
        return listRecords();
    } else if (path === "/analyze") {
        return await showAnalysis();
    }  else {
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

    addRecordDB(db, table, obj);

    var response = { contentType: "text/html",
                     status: status_OK,
                     contents: template_addRecord(obj),
                   };

    return response;
}


async function showAnalysis() {
    var analysis = analyzeRecordsDB(db, table);
    var cityList = '<li>' + analysis.cityList.join('</li> <li>') + '</li>';
    
    var analysisBody = `  <body>
  <body>
    <h1>Database analysis</h1>
    <p># Records: ${analysis.count}</p>
    <p>Cities:
      <ol>
       ${cityList}
      </ol>
    </p>

    <form method="get" action="/">
      <button type="submit">Home</button>
    </form>
  </body>
</html>`

    var contents = template_header("Analysis") + analysisBody;

    var response = { contentType: "text/html",
                     status: status_OK,
                     contents: contents,
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
        return {
            contents: "Method not implemented.",
            status: status_NOT_IMPLEMENTED,
            contentType: "text/plain"
        };
    }
}


async function fileData(path) {
    var contents, status, contentType;
    
    try {
        contents = await Deno.readFile("./static" + path);
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
    var r =  await route(req);
    
    if (!r) {
        if (path === "/") {
            path = "/index.html";
        }
        r = await fileData(path);
    }

    console.log(`${r.status} ${req.method} ${r.contentType} ${origpath}`); 

    return new Response(r.contents,
                        {status: r.status,
                         headers: {
                             "content-type": r.contentType,
                         }});
}


const ac = new AbortController();

const server = Deno.serve(
    {
        signal: ac.signal,
        port: 8000,
        hostname: "0.0.0.0"
    },
    handler);

Deno.addSignalListener("SIGINT", () => {
    console.log("SIGINT received, terminating...");
    ac.abort();
});

server.finished.then(() => {
    console.log("Server terminating, closing database.")
    db.close();
});