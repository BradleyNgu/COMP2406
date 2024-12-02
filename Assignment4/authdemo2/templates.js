// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// templates.js, part of authdemo2
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 23, 2024
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
