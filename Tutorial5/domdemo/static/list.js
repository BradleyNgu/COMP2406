// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// list.js, part of domdemo
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: October 9, 2024
//

let tableData = []; // Store the fetched data
let ascending = true; // Track the current sort order, true for A-Z, false for Z-A

function insertTableData(data) {
    const t = document.querySelector("#table");
    const rows = data.map(record => `
        <tr>
            <td>${record.name}</td>
            <td>${record.city}</td>
            <td>${record.country}</td>
            <td>${record.birthday}</td>
            <td>${record.email}</td>
        </tr>
    `);
    t.innerHTML = rows.join("");
}

function toggleSortOrder() {
    ascending = !ascending; // Toggle the sort order
    const sortedData = [...tableData].sort((a, b) => {
        if (ascending) {
            return a.name.localeCompare(b.name); // Sort A-Z
        } else {
            return b.name.localeCompare(a.name); // Sort Z-A
        }
    });
    insertTableData(sortedData);
}

async function updateTable() {
    console.log("Updating Table...");
    
    try {
        const response = await fetch("/list");
        if (response.ok) {
            tableData = await response.json(); // Store data for sorting
            insertTableData(tableData);
        } else {
            console.error("Table loading error response: " + response.status);
        }
    } catch (error) {
        console.error("Table loading fetch error: " + error.message);
    }
}

// Event listener for the sort toggle button
document.getElementById("sort-toggle").addEventListener("click", toggleSortOrder);

// Initial data load
updateTable().then(() => { console.log("Table updated!"); });