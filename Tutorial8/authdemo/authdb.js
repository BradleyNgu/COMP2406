// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// authdb.js, part of authdemo
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 13, 2024
//

import { DB } from "https://deno.land/x/sqlite/mod.ts";

const dbFile = "submissions.db";
const submissionTable = "tutorial8";
const authTable = "accounts";

const db = new DB(dbFile);

db.execute(`
  CREATE TABLE IF NOT EXISTS ${submissionTable} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentID TEXT,
    q1 TEXT,
    q2 TEXT,
    q3 TEXT,
    q4 TEXT,
    q5 TEXT
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS ${authTable} (
    username TEXT PRIMARY KEY,
    password TEXT,
    access TEXT,
    studentID TEXT,
    name TEXT
  )
`);

export function addSubmission(r) {
    return db.query(`INSERT INTO ${submissionTable} ` +
                    "(studentID, q1, q2, q3, q4, q5) " +
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    [r.studentID,
                     r["1"], r["2"], r["3"], r["4"], r["5"]]);
}

export function getAllSubmissions() {
    var state = [];
    const query =
          db.prepareQuery(
              "SELECT id, studentID, q1, q2, q3, q4, q5 FROM " +
                  submissionTable + " ORDER BY studentID ASC LIMIT 50");

    for (const [id, studentID, q1, q2, q3, q4, q5]
         of query.iter()) {
        let name = db.query("SELECT name FROM " + authTable +
                           " WHERE studentID = '" + studentID + "'")
        state.push({id, studentID, name, q1, q2, q3, q4, q5});
    }
    
    query.finalize();
    
    return state;
}

export function analyzeSubmissions() {
    var analysis = {};

    analysis.count = db.query("SELECT COUNT(*) FROM " + submissionTable);
    analysis.studentIDList =
        db.query("SELECT DISTINCT studentID FROM " + submissionTable);
    
    return analysis;
}

export function addAccount(username, password, access, studentID, name) {
    return db.query(`INSERT INTO ${authTable} ` +
                    "(username, password, access, studentID, name) " +
                    "VALUES (?, ?, ?, ?, ?)",
                    [username, password, access, studentID, name]);
}

export function getAccount(username) {
    var result =
        db.query(`SELECT * FROM ${authTable} WHERE username = '${username}'`);

    if (result[0]) {
        let a = result[0];
        let username = a[0];
        let password = a[1];
        let access = a[2];
        let studentID = a[3];
        let name = a[4];

        return {username, password, access, studentID, name};
    } else {
        return null;
    }
}

export function getName(studentID) {
    return db.query(`SELECT name FROM ${authTable} ` +
                    `WHERE studentID = '${studentID}'`);
}

export function close() {
    db.close();
}
