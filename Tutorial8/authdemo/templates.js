// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// templates.js, part of authdemo
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 13, 2024
//

const appTitle = "COMP 2406 Authorization Demo";

export function header(title) {
    const fullTitle = appTitle + ": " + title;
    
    return `<!DOCTYPE html>
<html>
  <head>
    <title>${fullTitle}</title>
    <link rel="stylesheet" href="/style.css">
  </head>
`
}

export function notFound(path) {
    return header("Page not found") +
        `<body>
<h1>Page not found</h1>

<p>Sorry, the requested page was not found.</p>
</body>
</html>
`
}

export function addRecord(obj) {
    return header("Submission just added") +
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
