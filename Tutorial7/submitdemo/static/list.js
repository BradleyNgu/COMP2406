// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// list.js, part of submitdemo
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 6, 2024
//

function insertTableData(tableData) {
    var t = document.querySelector("#table");
    var row = [];
   
    function rowMarkup(s) {
        return "<td>" + s + "</td>";
    }

    for (let r of tableData) {
        row.push("<tr>")
        row.push(rowMarkup(r.id));
        row.push(rowMarkup(r.studentID));
        row.push(rowMarkup(r.name));
        row.push(rowMarkup(r.q1));
        row.push(rowMarkup(r.q2));
        row.push(rowMarkup(r.q3));
        row.push(rowMarkup(r.q4));
        row.push(rowMarkup(r.q5));
        row.push("</tr>")
    }

    t.innerHTML = row.join("\n");
}


async function updateTable() {
    console.log("Updating Table...");
    
    try {
        const response = await fetch("/list");
        if (response.ok) {
            const tableData = await response.json();
            insertTableData(tableData);
        } else {
            console.error("Table loading error response: " + response.status);
        }
    } catch (error) {
        console.error("Table loading fetch error: " + error.message);
    }
}

updateTable().then(() => {console.log("Table updated!");});
