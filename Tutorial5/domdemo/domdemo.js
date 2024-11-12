// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// dbdemo.js
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: October 9, 2024
//
// run with the following command:
//    deno run --allow-net --allow-read --allow-write domdemo.js
//

import { DB } from "https://deno.land/x/sqlite/mod.ts";

const status_NOT_FOUND = 404;
const status_OK = 200;
const status_NOT_IMPLEMENTED = 501;
const appTitle = "COMP 2406 DOM Demo";
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

// Database function to add a record
function addRecordDB(db, table, r) {
    return db.query(`INSERT INTO ${table} ` +
                    "(name, city, country, birthday, email) " +
                    "VALUES (?, ?, ?, ?, ?)",
                    [r.name, r.city, r.country, r.birthday, r.email]);
}

// Database function to get all records
function getAllRecordsDB(db, table) {
    var state = [];
    const query = db.prepareQuery(
        "SELECT id, name, city, country, birthday, email FROM " +
        table + " ORDER BY name ASC LIMIT 50"
    );

    for (const [id, name, city, country, birthday, email] of query.iter()) {
        state.push({ id, name, city, country, birthday, email });
    }

    query.finalize();
    
    return state;
}

// Database function to analyze records
function analyzeRecordsDB(db, table) {
    var analysis = {};
    analysis.count = db.query("SELECT COUNT(*) FROM " + table)[0][0];
    analysis.cityList = db.query("SELECT DISTINCT city FROM " + table).map(row => row[0]);
    return analysis;
}

// MIME type mapping function
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
    const extension = filename ? filename.slice(filename.lastIndexOf('.')+1).toLowerCase() : '';
    return MIME_TYPES[extension] || "application/octet-stream";
}

// HTML template functions
function template_header(title) {
    return `<!DOCTYPE html>
<html>
  <head>
    <title>${appTitle}: ${title}</title>
    <link rel="stylesheet" href="/style.css">
  </head>`;
}

function template_notFound(path) {
    return `${template_header("Page not found")}
<body>
<h1>Page not found</h1>
<p>Sorry, the requested page was not found.</p>
</body>
</html>`;
}

function template_addRecord(obj) {
    return `${template_header("Record just added")}
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
</html>`;
}

function template_listRecords(state) {
    const pageTop = `<body>
    <h1>People Listing</h1>
    <table>
      <thead>
        <tr><th>Name</th><th>City</th><th>Country</th><th>Birthday</th><th>Email</th></tr>
      </thead>
      <tbody>`;
    const pageBottom = `      </tbody>
    </table>
    <form method="get" action="/">
      <button type="submit">Home</button>
    </form>
  </body>
</html>`;

    const rows = state.map(r => `<tr>
      <td>${r.name}</td><td>${r.city}</td><td>${r.country}</td><td>${r.birthday}</td><td>${r.email}</td>
    </tr>`).join("\n");

    return template_header("List of Records") + pageTop + rows + pageBottom;
}

// Function to generate HTML for listing records
function listRecords() {
    const state = getAllRecordsDB(db, table); // Get data from the database
    return {
        contentType: "application/json",
        status: status_OK,
        contents: JSON.stringify(state) // Return data as JSON
    };
}

// Function to provide analysis data as JSON
async function showAnalysis() {
    const records = getAllRecordsDB(db, table); // Get all records from the database

    const analysis = {
        count: records.length,
        records: records.map(record => ({
            name: record.name,
            city: record.city,
            country: record.country,
            birthday: record.birthday,
            email: record.email
        }))
    };

    return {
        contentType: "application/json",
        status: status_OK,
        contents: JSON.stringify(analysis)
    };
}


// Function to add a new record
async function addRecord(req) {
    try {
        const body = await req.json(); // Parse JSON from the request body
        const obj = {
            name: body.name,
            city: body.city,
            country: body.country,
            birthday: body.birthday,
            email: body.email
        };

        addRecordDB(db, table, obj); // Insert record into the database

        return {
            contentType: "application/json",
            status: status_OK,
            contents: JSON.stringify(obj) // Return the inserted record as JSON
        };
    } catch (error) {
        console.error("Error adding record:", error);
        return {
            contentType: "application/json",
            status: 500,
            contents: JSON.stringify({ error: "Internal Server Error" })
        };
    }
}



// Route handling functions
async function routeGet(req) {
    const path = new URL(req.url).pathname;
    if (path === "/list") {
        return listRecords(); // Serve JSON data for the list
    } else if (path === "/analyze") {
        return await showAnalysis();
    } else {
        return null;
    }
}


async function routePost(req) {
    const path = new URL(req.url).pathname;
    if (path === "/add") {
        return await addRecord(req);
    } else {
        return null;
    }
}

// Main route function
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

// Static file serving function
async function fileData(path) {
    try {
        const contents = await Deno.readFile("./static" + path);
        return { contents, status: status_OK, contentType: MIMEtype(path) };
    } catch (e) {
        return {
            contents: template_notFound(path),
            status: status_NOT_FOUND,
            contentType: "text/html"
        };
    }
}

// Request handler function
async function handler(req) {
    let path = new URL(req.url).pathname; // Changed 'const' to 'let'
    let response = await route(req);

    if (!response) {
        if (path === "/") path = "/index.html";
        response = await fileData(path);
    }

    console.log(`${response.status} ${req.method} ${response.contentType} ${path}`);

    return new Response(response.contents, {
        status: response.status,
        headers: { "content-type": response.contentType }
    });
}

// Server setup
const ac = new AbortController();
const server = Deno.serve({ signal: ac.signal, port: 8000, hostname: "0.0.0.0" }, handler);

Deno.addSignalListener("SIGINT", () => {
    console.log("SIGINT received, terminating...");
    ac.abort();
});

server.finished.then(() => {
    console.log("Server terminating, closing database.");
    db.close();
});


