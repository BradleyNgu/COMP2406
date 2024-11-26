// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// authdemo.js, part of authdemo
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 13, 2024
//
// run with the following command:
//    deno run --allow-net --allow-read --allow-write authdemo.js
//

import * as db from "./authdb.js";
import * as template from "./templates.js";

const status_OK = 200;
const status_SEE_OTHER = 303;
const status_FORBIDDEN = 403;
const status_NOT_FOUND = 404;
const status_INTERNAL_SERVER_ERROR = 500;
const status_NOT_IMPLEMENTED = 501;

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

function listSubmissions() {
    var state = db.getAllSubmissions();
    
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
    } else if (path === "/admin/analyze") {
        return await showAnalysis();
    }  else {
        return null;
    }
}

async function showAnalysis() {
    var analysis = db.analyzeSubmissions();
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

    <form method="get" action="/admin/index.html">
      <button type="submit">Home</button>
    </form>
  </body>
</html>`

    var contents =
        template.header("Submission analysis") + analysisBody;

    var response = { contentType: "text/html",
                     status: status_OK,
                     contents: contents,
                   };
    
    return response;
}

// getCookie is from claude.ai, but pretty standard code
function getCookie(cookieStr, name) {
    if (!cookieStr) return null;
    const cookies = cookieStr.split(';');
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return cookieValue;
        }
    }
    return null;
}

function requestAuthUser(req) {
    const cookieStr = req.headers.get('cookie');

    return getCookie(cookieStr, "authuser");
}

async function addSubmission(req) {
    const submission = await req.json();
    const authuser = requestAuthUser(req);
    const account = db.getAccount(authuser);
    var response;

    if (account.studentID === submission.studentID) {
        let result = db.addSubmission(submission);
        
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
    } else {
        response = {
            contentType: "text/plain",
            status: status_FORBIDDEN,
            contents:
            "FORBIDDEN: submission studentID doesn't match account studentID"
        };
    }
    
    return response;
}

function redirect(url) {
    var response = {
        status: status_SEE_OTHER,
        contentType: "text/html",
        location: url,
        contents: "Redirect to " + url
    }

    return response;
}

async function login(req) {
    const body = await req.formData();
    const username = body.get("username");
    const password = body.get("password");
    var authuser;
    var response;
    
    var account = db.getAccount(username);

    if (account && (password === account.password)) {
        authuser = username;
        if (account.access === "student") {
            response = redirect("/student/index.html")
        } else if (account.access === "admin") {
            response = redirect("/admin/index.html")
        } else {
            authuser = "UNAUTHORIZED";
            response = {
                status: status_INTERNAL_SERVER_ERROR,
                contentType: "text/plain",
                contents: "Internal server error, unknown access.",
            }
        }
    } else {
        authuser = "UNAUTHORIZED";
        response = redirect("/loginFailed.html");
    }
    
    response.authuser = authuser;
    
    return response;
}

async function createAcct(req) {
    const body = await req.formData();
    const username = body.get("username");
    const password = body.get("password");
    const access = body.get("access");
    const studentID = body.get("studentID");
    const name = body.get("name");
    const result = db.addAccount(username, password, access, studentID, name);
    var response;
    
    if (result) { //return an HTML response summarizing the account created
        const summary = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Account Created</title>
                <link rel="stylesheet" href="/style.css">
            </head>
            <body>
                <h1>Account Successfully Created</h1>
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Student ID:</strong> ${studentID}</p>
                <p><strong>Access Level:</strong> ${access}</p>
                <form method="get" action="/">
                    <button type="submit">Back to Login</button>
                </form>
            </body>
            </html>
        `;
        response = {
            status: status_OK,
            contentType: "text/html",
            contents: summary,
        };
    } else {
        response = {
            status: status_INTERNAL_SERVER_ERROR,
            contentType: "text/plain",
            contents: "Internal server error, could not create account.",
        };
    }

    return response;
}

async function routePost(req) {
    const path = new URL(req.url).pathname;    

    if (path === "/uploadSubmission") {
        return await addSubmission(req);
    } else if (path === "/login") {
        return await login(req);
    } else if (path === "/admin/createAcct") {
        return await createAcct(req);
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
        contents = template.notFound(path);
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
    
    var responseInit = {
        status: r.status,
        headers: {
            "Content-Type": r.contentType,
        }
    };
    
    if (r.authuser) {
        responseInit.headers["Set-Cookie"] = "authuser=" + r.authuser;
    }

    if (r.location) {
        responseInit.headers["Location"] = r.location;
    }
    
    return new Response(r.contents, responseInit);
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
