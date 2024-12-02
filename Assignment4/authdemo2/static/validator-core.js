// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// static/validator-core.js, part of authdemo2
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 22, 2024
//

export const submissionShortName = "assign4";
const filePrefix = "comp2406-" + submissionShortName;
const submissionName = "COMP 2406 2024F Assignment 4"
export const expectedQuestionList = "1,2,3,4,5,6,7";

export const numQuestions = expectedQuestionList.split(",").length;

function updateTag(id, val) {
    if (typeof document === 'object') {
        document.getElementById(id).innerHTML = val;
    }
}

function lineEncoding(lines) {
    var n, i, s;
    
    for (i = 0; i < lines.length; i++) {
        s = lines[i];
        n = s.length;
        if (s[n-1] === '\r') {
            return "DOS/Windows Text (CR/LF)";
        }
    }
    
    return "UNIX";
}

export function checkSubmission(fn, f) {
    var lines = f.split('\n')
    var c = 0;
    var questionList = [];
    var questionString;
    var q = {};
    var i;
    var lastQuestion = null;
    const fnPattern = filePrefix + "-[a-zA-Z0-9]+\.txt";
    const fnRexp = new RegExp(fnPattern);

    q.filename = fn;
    q.filecontents = f;
    
    if (!fnRexp.test(fn)) {
        updateTag("status", "ERROR " + fn +
                  " doesn't follow the pattern " + fnRexp);
        return;
    }

    if (fn === filePrefix + "-template.txt") {
        updateTag("status", "ERROR " + fn +
                  " has the default name, please change template to your mycarletonone username");
        return;
    }
    
    updateTag("filename", fn);
    
    let encoding = lineEncoding(lines);
    if (encoding !== "UNIX") {
        updateTag("status", "ERROR " + fn +
                  " is not a UNIX textfile, it is a "
                  + encoding + " file.");
        return;
    }
    
    if (submissionName !== lines[0]) {
        updateTag("status", "ERROR " + fn +
                  " doesn't start with \"" + submissionName + "\"");
        return;
    }
    
    try {
        q.name = lines[1].match(/^Name:(.+)/m)[1].trim();
        q.studentID = lines[2].match(/^Student ID:(.+)/m)[1].trim();
    } catch (error) {
        updateTag("status", "ERROR " + fn +
                  " has bad Name or Student ID field");
        return;
    }

    updateTag("name", q.name);
    updateTag("studentID", q.studentID);
    
    var questionRE = /^([0-9a-g]+)\.(.*)/;
    
    for (i = 4; i < lines.length; i++) {
        if (typeof(lines[i]) === 'string') {
            lines[i] = lines[i].replace('\r','');
        }
        
        let m = lines[i].match(questionRE);
        if (m) {
            c++;
            questionList.push(m[1]);
            q[m[1]] = m[2];
            lastQuestion = m[1];
        } else {
            if (lastQuestion !== null) {
                if ((q[lastQuestion] === '') || (q[lastQuestion] === ' ')) {
                    q[lastQuestion] = lines[i];
                } else {
                    q[lastQuestion] = q[lastQuestion] + "\n" + lines[i];
                }
            }
        }
    }

    questionString = questionList.toString();
    if (questionString !== expectedQuestionList) {
        updateTag("status", "ERROR expected questions " +
                  expectedQuestionList + " but got questions " +
                  questionString);
        return;
    } else {
        updateTag("status", "PASSED " +
                  fn + ": " + q.name + " (" + q.studentID + ")");
    }
    
    return q;
}
