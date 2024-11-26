// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// validator.js, part of authdemo
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 6, 2024
//

const filePrefix = "comp2406-tutorial8";
const submissionName = "COMP 2406 2024F Tutorial 8"
const expectedQuestionList = "1,2,3,4,5";
var analysisSection;

function loadAssignment(fileInput, upload) {
    analysisSection.hidden = false;

    if(fileInput.files[0] == undefined) {
        updateTag("status", "ERROR: No files to examine.")
        return;
    }
    
    var reader = new FileReader();
    reader.onload = function(ev) {
        var content = ev.target.result;
        var fn = fileInput.files[0].name
        var q = checkSubmission(fn, content);
        if (upload) {
            doUploadSubmission(fn, q);
        }
    };
    reader.onerror = function(err) {
        updateTag("status", "ERROR: Failed to read file");
    }
    reader.readAsText(fileInput.files[0]);

}

var numQuestions = expectedQuestionList.split(",").length;

function updateTag(id, val) {
    document.getElementById(id).innerHTML = val;
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

async function getCurrentStudentID() {
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

async function checkSubmission(fn, f) { //had to make it async
    var lines = f.split('\n');
    var c = 0;
    var questionList = [];
    var questionString;
    var q = {};
    var i;
    var lastQuestion = null;
    const fnPattern = filePrefix + "-[a-zA-Z0-9]+\\.txt";
    const fnRexp = new RegExp(fnPattern);
    const currentStudentID = await getCurrentStudentID(); // Fetch current user’s student ID

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

    // Compare extracted studentID with current studentID
    if (q.studentID !== currentStudentID) { // Change the tag if mismatch
        updateTag("status", `ERROR: Submission Student ID (${q.studentID}) does not match the current user (${currentStudentID}).`);
        return null;
    }

    var questionRE = /^([0-9a-g]+)\.(.*)/;
    
    for (i = 4; i < lines.length; i++) {
        if (typeof(lines[i]) === 'string') {
            lines[i] = lines[i].replace('\r', '');
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

    console.log(JSON.stringify(q, null, '   '));

    questionString = questionList.toString();
    if (questionString !== expectedQuestionList) {
        updateTag("status", "ERROR expected questions " +
                  expectedQuestionList + " but got questions " +
                  questionString);
    } else {
        updateTag("status", "PASSED " +
                  fn + ": " + q.name + " (" + q.studentID + ")");
    }
    
    var newP, newText, newPre, newPreText;
    let questionDiv = document.getElementById("questions");
    for (let qName of questionList) {
        let qText = q[qName];
        newP = document.createElement("p");
        newText = document.createTextNode(qName + ":");
        newP.appendChild(newText);
        questionDiv.appendChild(newP);
        newPre = document.createElement("pre");
        newPreText = document.createTextNode(qText);
        newPre.appendChild(newPreText);
        newP.appendChild(newPre);
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
    console.log("sending data to server...");
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
                updateTag("status", "UPLOAD COMPLETE of " + fn);
            } else {
                updateTag("status", "UPLOAD ERROR of " + fn +
                          ", failed with status " +
                          response.status);
            }
        });
    } else {
        updateTag("status", "ERROR No valid data to upload!");
    }
}