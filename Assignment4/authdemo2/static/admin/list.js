// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// list.js, part of authdemo2
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 23, 2024
//

import { expectedQuestionList } from "/validator-core.js";

function insertTableData(tableData) {

    function rowMarkup(s) {
        return "<td>" + s + "</td>";
    }

    var t = document.querySelector("#table");
    var row = [];
    var questionList = expectedQuestionList.split(",");
    var headingsDiv = document.getElementById("headings");
    
    var questionHeadings = questionList.map((i) => {
        return "          <th>Question " + i + "</th>"
    }).join("\n");

    var oldHeadings = headingsDiv.innerHTML;
    headingsDiv.innerHTML = oldHeadings + questionHeadings;

    var questionList = expectedQuestionList.split(',').map((q) => "q" + q);
    var fieldList = ["id", "studentID", "name"].concat(questionList);
    
    for (let r of tableData) {
        row.push("<tr>")
        for (let f of fieldList) {
            row.push(rowMarkup(r[f]));
        }
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
