// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// list.js, part of domdemo
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: October 9, 2024
//

function insertTableData(tableData) {
    var t = document.querySelector("#table");
    var row = [];
   
    function rowMarkup(s) {
        return "<td>" + s + "</td>";
    }

    for (let r of tableData) {
        row.push("<tr>")
        row.push(rowMarkup(r.name));
        row.push(rowMarkup(r.city));
        row.push(rowMarkup(r.country));
        row.push(rowMarkup(r.birthday));
        row.push(rowMarkup(r.email));
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
