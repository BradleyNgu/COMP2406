// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// validator.js, part of authdemo
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 6, 2024
//

const filePrefix = "comp2406-tutorial8";
const submissionName = "COMP 2406 2024F Tutorial 8";
const expectedQuestionList = "1,2,3,4,5";
var analysisSection;

function loadAssignment(fileInput, upload) {
    analysisSection.hidden = false;

    if (fileInput.files[0] == undefined) {
        updateTag("status", "ERROR: No files to examine.");
        return;
    }
    
    var reader = new FileReader();
    reader.onload = async function (ev) {
        var content = ev.target.result;
        var fn = fileInput.files[0].name;
        var q = await checkSubmission(fn, content);
        if (upload) {
            doUploadSubmission(fn, q);
        }
    };
    reader.onerror = function (err) {
        updateTag("status", "ERROR: Failed to read file");
    };
    reader.readAsText(fileInput.files[0]);
}

var numQuestions = expectedQuestionList.split(",").length;

function updateTag(id, val) {
    document.getElementById(id).innerHTML = val;
}

function lineEncoding(lines) {
    for (let i = 0; i < lines.length; i++) {
        let s = lines[i];
        let n = s.length;
        if (s[n - 1] === '\r') {
            return "DOS/Windows Text (CR/LF)";
        }
    }
    return "UNIX";
}

async function getCurrentStudentID() { //this just fetches the student ID
    try {
        const response = await fetch("/getCurrentStudentID");
        if (response.ok) {
            const data = await response.json();
            return data.studentID;
        } else {
            throw new Error("Failed to fetch current student ID");
        }
    } catch (error) {
        console.error("Error fetching current student ID:", error);
        return null;
    }
}

async function checkSubmission(fn, f) {
    const currentStudentID = await getCurrentStudentID(); //this actually checks and compare if the ID's match
    if (!currentStudentID) {
        updateTag("status", "ERROR: Unable to fetch current user information.");
        return null;
    }

    var lines = f.split('\n');
    var questionList = [];
    var questionString;
    var q = {};
    var lastQuestion = null;

    const fnPattern = `${filePrefix}-[a-zA-Z0-9]+\.txt`;
    const fnRexp = new RegExp(fnPattern);

    if (!fnRexp.test(fn)) {
        updateTag("status", `ERROR ${fn} doesn't follow the pattern ${fnPattern}`);
        return null;
    }

    if (fn === `${filePrefix}-template.txt`) {
        updateTag("status", `ERROR ${fn} has the default name. Please change 'template' to your MyCarletonOne username.`);
        return null;
    }

    updateTag("filename", fn);

    let encoding = lineEncoding(lines);
    if (encoding !== "UNIX") {
        updateTag("status", `ERROR ${fn} is not a UNIX text file. Detected ${encoding} encoding.`);
        return null;
    }

    if (submissionName !== lines[0]) {
        updateTag("status", `ERROR ${fn} doesn't start with "${submissionName}"`);
        return null;
    }

    try {
        q.name = lines[1].match(/^Name:(.+)/m)[1].trim();
        q.studentID = lines[2].match(/^Student ID:(.+)/m)[1].trim();
    } catch (error) {
        updateTag("status", `ERROR ${fn} has bad Name or Student ID field`);
        return null;
    }

    updateTag("name", q.name);
    updateTag("studentID", q.studentID);

    if (q.studentID !== currentStudentID) {
        updateTag("status", `ERROR: Submission Student ID (${q.studentID}) does not match the current user (${currentStudentID}).`);
        return null;
    }

    const questionRE = /^([0-9a-g]+)\.(.*)/;

    for (let i = 4; i < lines.length; i++) {
        if (typeof lines[i] === 'string') {
            lines[i] = lines[i].replace('\r', '');
        }

        let m = lines[i].match(questionRE);
        if (m) {
            questionList.push(m[1]);
            q[m[1]] = m[2];
            lastQuestion = m[1];
        } else if (lastQuestion !== null) {
            q[lastQuestion] = q[lastQuestion] ? `${q[lastQuestion]}\n${lines[i]}` : lines[i];
        }
    }

    questionString = questionList.toString();
    if (questionString !== expectedQuestionList) {
        updateTag("status", `ERROR: Expected questions ${expectedQuestionList}, but got questions ${questionString}`);
        return null;
    } else {
        updateTag("status", `PASSED ${fn}: ${q.name} (${q.studentID})`);
    }

    return q;
}

function hideAnalysis() {
    analysisSection = document.getElementById("analysis");
    analysisSection.hidden = true;
}

function uploadSubmission() {
    var assignmentFile = document.getElementById("assignmentFile");
    loadAssignment(assignmentFile, true);
}

function doUploadSubmission(fn, q) {
    if (q) {
        const request = new Request("/uploadSubmission", {
            method: "POST",
            body: JSON.stringify(q),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        fetch(request).then((response) => {
            if (response.status === 200) {
                updateTag("status", `UPLOAD COMPLETE for ${fn}`);
            } else {
                updateTag("status", `UPLOAD ERROR for ${fn}. Failed with status ${response.status}`);
            }
        }).catch(error => {
            console.error("Upload error:", error);
            updateTag("status", `UPLOAD ERROR for ${fn}. Could not reach the server.`);
        });
    } else {
        updateTag("status", "ERROR: No valid data to upload!");
    }
}
