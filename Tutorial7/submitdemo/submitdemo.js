// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// submitdemo.js
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 6, 2024
//
// run with the following command:
//    deno run --allow-net --allow-read --allow-write submitdemo.js
//

import { DB } from "https://deno.land/x/sqlite/mod.ts";

const status_NOT_FOUND = 404;
const status_OK = 200;
const status_INTERNAL_SERVER_ERROR = 500;
const status_NOT_IMPLEMENTED = 501;
const appTitle = "COMP 2406 Submissions Demo";
const dbFile = "submissions.db";
const table = "tutorial7";

const db = new DB(dbFile);

db.execute(`
  CREATE TABLE IF NOT EXISTS ${table} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentID INTEGER,
    name TEXT,
    q1 TEXT,
    q2 TEXT,
    q3 TEXT,
    q4 TEXT,
    q5 TEXT
  )
`);


function addSubmissionDB(db, table, r) {
    return db.query(`INSERT INTO ${table} ` +
                    "(studentID, name, q1, q2, q3, q4, q5) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [r.studentID, r.name,
                     r["1"], r["2"], r["3"], r["4"], r["5"]]);
}

function getAllSubmissionsDB(db, table) {
    var state = [];
    const query =
          db.prepareQuery(
              "SELECT id, studentID, name, q1, q2, q3, q4, q5 FROM " +
                  table + " ORDER BY name ASC LIMIT 50");

    for (const [id, studentID, name, q1, q2, q3, q4, q5]
         of query.iter()) {
        state.push({id, studentID, name, q1, q2, q3, q4, q5});
    }

    query.finalize();
    
    return state;
}

function analyzeSubmissionsDB(db, table) {
    var analysis = {};

    analysis.count = db.query("SELECT COUNT(*) FROM " + table);
    analysis.studentIDList =
        db.query("SELECT DISTINCT studentID FROM " + table);
    
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
    return template_header("Submission just added") +
        `<body>
  <body>
    <h1>Submission just added</h1>
    <p>Student ID: ${obj.studentID}</p>
    <p>Name: ${obj.name}</p>
    <p>Q1: ${obj.q1}</p>
    <p>Q2: ${obj.q2}</p>
    <p>Q3: ${obj.q3}</p>
    <p>Q4: ${obj.q4}</p>
    <p>Q5: ${obj.q5}</p>
    <form method="get" action="/">
      <button type="submit">Home</button>
    </form>
  </body>
</html>
`
}


function listSubmissions() {
    var state = getAllSubmissionsDB(db, table);
    
    var response = { contentType: "application/JSON",
                     status: status_OK,
                     contents: JSON.stringify(state),
                   };

    return response;
}


async function routeGet(req) {
    const path = new URL(req.url).pathname;
    if (path === "/list") {
        return listSubmissions();
    } else if (path === "/analyze") {
        return await showAnalysis();
    }  else {
        return null;
    }
}

async function showAnalysis() {
    var analysis = analyzeSubmissionsDB(db, table);
    var studentIDList =
        '<li>' + analysis.studentIDList.join('</li> <li>') + '</li>';
    
    var analysisBody = `  <body>
  <body>
    <h1>Submissions analysis</h1>
    <p># Records: ${analysis.count}</p>
    <p>Student IDs:
      <ol>
       ${studentIDList}
      </ol>
    </p>

    <form method="get" action="/">
      <button type="submit">Home</button>
    </form>
  </body>
</html>`

    var contents =
        template_header("Submission analysis") + analysisBody;

    var response = { contentType: "text/html",
                     status: status_OK,
                     contents: contents,
                   };
    
    return response;
}


async function addSubmission(req) {
    const submission = await req.json();
    const result = addSubmissionDB(db, table, submission);
    var response;
    
    if (result) {
        response = {
            contentType: "text/plain",
            status: status_OK,
            contents: "Got the data",
        };
    } else {
        response = {
            contentType: "text/plain",
            status: status_INTERNAL_SERVER_ERROR,
            contents: "Internal server error"
        };
    }

    return response;
}

async function routePost(req) {
    const path = new URL(req.url).pathname;    

    if (path === "/uploadSubmission") {
        return await addSubmission(req);
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
