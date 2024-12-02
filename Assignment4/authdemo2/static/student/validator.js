// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2024 Anil Somayaji
//
// validator.js, part of authdemo2
// for COMP 2406 (Fall 2024), Carleton University
// 
// Initial version: November 23, 2024
//

import { expectedQuestionList,
         numQuestions,
         submissionShortName,
         checkSubmission
       } from "/validator-core.js";

var analysisSection;

export function loadAssignment(fileInput, upload) {
    analysisSection.hidden = false;

    if(fileInput.files[0] == undefined) {
        updateTag("status", "ERROR: No files to examine.")
        return;
    }
    
    var reader = new FileReader();
    reader.onload = function(ev) {
        var content = ev.target.result;
        var fn = fileInput.files[0].name
        var q = validateSubmission(fn, content);
        if (upload) {
            doUploadSubmission(fn, content);
        }
    };
    reader.onerror = function(err) {
        updateTag("status", "ERROR: Failed to read file");
    }
    reader.readAsText(fileInput.files[0]);

}

function validateSubmission(fn, f) {
    var q = checkSubmission(fn, f);

    if (!q) {
        return;
    }

    var questionList = expectedQuestionList.split(",");
    
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

export function hideAnalysis() {
    analysisSection = document.getElementById("analysis");
    analysisSection.hidden = true;
}

export function uploadSubmission() {
    var assignmentFile = document.getElementById("assignmentFile");
    loadAssignment(assignmentFile, true);
}

function updateTag(id, val) {
    document.getElementById(id).innerHTML = val;
}

function doUploadSubmission(filename, filecontents) {
    if (filecontents) {
        const request = new Request("/uploadSubmission", {
            method: "POST",
            body: JSON.stringify({filename, filecontents}),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        fetch(request).then((response) => {
            if (response.status === 200) {
                updateTag("status", "UPLOAD COMPLETE of " + filename);
            } else {
                updateTag("status", "UPLOAD ERROR of " + filename +
                          ", failed with status " +
                          response.status);
            }
        });
    } else {
        updateTag("status", "ERROR No data to upload!");
    }
}

window.addEventListener("load", (event) => {
    hideAnalysis();
    
    let fileInput = document.getElementById("assignmentFile");
    fileInput.addEventListener("change", (event) => {
        loadAssignment(fileInput, false);
    });

    let uploadButton = document.getElementById("uploadButton");
    uploadButton.addEventListener("click", (event) => {
        uploadSubmission();
    });
});
