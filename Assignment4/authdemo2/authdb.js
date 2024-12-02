// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// authdb.js, part of authdemo2
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 23, 2024
//

import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { expectedQuestionList,
         numQuestions,
         submissionShortName
       } from "./static/validator-core.js";

const dbFile = "submissions.db";
const submissionTable = submissionShortName;
const authTable = "accounts";
const sessionTable = "sessions";
const sessionLength = 3600 * 72 * 1000 // length of sessions in milliseconds

const db = new DB(dbFile);

const expectedQarray = expectedQuestionList.split(",");
const createQFields = expectedQarray.map((q) => "q" + q + " TEXT").join(", ");
const queryQFields = expectedQarray.map((q) => "q" + q).join(", ");

function queryBlanks(n) {
    return "(" + Array(n).fill("?").join(", ") + ")";
}

db.execute(`
  CREATE TABLE IF NOT EXISTS ${submissionTable} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentID TEXT UNIQUE,
    ${createQFields}
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

db.execute(`
  CREATE TABLE IF NOT EXISTS ${sessionTable} (
    sessionid TEXT PRIMARY KEY,
    username TEXT,
    expiration INTEGER
  )
`);

export function addSubmission(r) {
    const qa = expectedQuestionList.split(",");
    const answers = qa.map((q) => r[q]);
    
    return db.query(`INSERT OR REPLACE INTO ${submissionTable} ` +
                    "(studentID, " + queryQFields + ")" +
                    "VALUES " + queryBlanks(numQuestions + 1), 
                    [r.studentID].concat(answers));
}

export function getAllSubmissions() {
    var state = [];
    const query =
          db.prepareQuery(
              "SELECT id, studentID, " + queryQFields + " FROM " +
                  submissionTable + " ORDER BY studentID ASC LIMIT 50");

    for (var s of query.iter()) {
        let id = s.shift();
        let studentID = s.shift();
        let name = db.query("SELECT name FROM " + authTable +
                            " WHERE studentID = ?", studentID);
        let r = {id, studentID, name};
        for (let i in expectedQarray) {
            let qname = "q" + expectedQarray[i];
            let qval = s[i];
            r[qname] = qval;
        }
        state.push(r);
    }
    
    query.finalize();
    
    return state;
}

function calcBlankQuestionStats() {

    // From https://stackoverflow.com/questions/154059/how-do-i-check-for-an-empty-undefined-null-string-in-javascript
    
    function isBlank(str) {
        return (!str || /^\s*$/.test(str));
    }

    var state = getAllSubmissions();
    const counts = Array(numQuestions).fill(0);
    var f, s;

    for (s of state) {  
        for (f=0; f < counts.length; f++) {
            let qindex = f + 1;
            let question = "q" + qindex;

            if (isBlank(s[question])) {
                counts[f]++;
            }
        }
    }

    return counts;
}

export function analyzeSubmissions() {
    var analysis = {};

    analysis.count = db.query("SELECT COUNT(*) FROM " + submissionTable);
    analysis.studentIDList =
        db.query("SELECT DISTINCT studentID FROM " + submissionTable);

    analysis.blankQuestions = calcBlankQuestionStats();
    
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

export function newSession(username) {
    const sessionid = crypto.randomUUID();
    const expiration = Date.now() + sessionLength;
    
    db.query(`INSERT INTO ${sessionTable} ` +
             "(sessionid, username, expiration) " +
             "VALUES (?, ?, ?)",
             [sessionid, username, expiration]);

    return sessionid;
}

export function getSession(sessionid) {
    var result;

    if (!sessionid) {
        return null;
    }
    
    result = db.query("SELECT username, expiration " +
                      `FROM ${sessionTable} WHERE sessionid = ?`,
                      [sessionid]);

    if (result && result.length > 0) {
        let username = result[0][0];
        let expiration = result[0][1];

        if (expiration > Date.now()) {
            return { sessionid, username, expiration };
        } else {
            return null;
        }
    } else {
        return null;
    }
}

export function close() {
    db.close();
}
