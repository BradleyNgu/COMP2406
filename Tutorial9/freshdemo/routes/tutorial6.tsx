import { h } from "preact";

export default function Tutorial6() {
  const validatorScript = `
    const filePrefix = "comp2406-tutorial6";
    const submissionName = "COMP 2406 2024F Tutorial 6";
    const expectedQuestionList = "1,2,3,4,5";
    var analysisSection;

    function loadAssignment(fileInput) {
        analysisSection.hidden = false;

        if(fileInput.files[0] == undefined) {
            updateTag("status", "ERROR: No files to examine.");
            return;
        }
        
        var reader = new FileReader();
        reader.onload = function(ev) {
            var content = ev.target.result;
            checkSubmission(fileInput.files[0].name, content);
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
            if (s[n-1] === '\\r') {
                return "DOS/Windows Text (CR/LF)";
            }
        }
        
        return "UNIX";
    }

    function checkSubmission(fn, f) {
        var lines = f.split('\\n');
        var c = 0;
        var questionList = [];
        var questionString;
        var q = {};
        var e = {};
        var i;
        var lastQuestion = null;
        const fnPattern = filePrefix + "-[a-zA-Z0-9]+\\.txt";
        const fnRexp = new RegExp(fnPattern);

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
                      " doesn't start with \\"" + submissionName + "\\"");
            return;
        }

        try {
            e.name = lines[1].match(/^Name:(.+)/m)[1].trim();
            e.id = lines[2].match(/^Student ID:(.+)/m)[1].trim();
        } catch (error) {
            updateTag("status", "ERROR " + fn +
                      " has bad Name or Student ID field");
            return;
        }

        updateTag("name", e.name);
        updateTag("studentID", e.id);

        var questionRE = /^([0-9a-g]+)\\.(.*)/;

        for (i = 4; i < lines.length; i++) {
            if (typeof(lines[i]) === 'string') {
                lines[i] = lines[i].replace('\\r','');
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
                        q[lastQuestion] = q[lastQuestion] + "\\n" + lines[i];
                    }
                }
            }
        }

        questionString = questionList.toString();
        if (questionString !== expectedQuestionList) {
            updateTag("status", "ERROR expected questions " +
                      expectedQuestionList + " but got questions " +
                      questionString);
        } else {
            updateTag("status", "PASSED " +
                      fn + ": " + e.name + " (" + e.id + ")");
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
    }

    function hideAnalysis() {
        analysisSection = document.getElementById("analysis");
        analysisSection.hidden = true;
    }
  `;

  return (
    <html>
      <head>
        <title>COMP 2406 Tutorial 6 Validator</title>
        <style>
          {`
            body {
              padding: 50px;
              font: 14px "Lucida Grande", Helvetica, Arial, sans-serif;
            }
            a {
              color: #00B7FF;
            }
          `}
        </style>
      </head>
      <body onload="hideAnalysis()">
        <h1>COMP 2406 2024F Tutorial Validator</h1>
        <input type="file" id="assignmentFile" onchange="loadAssignment(this)" />
        <div id="analysis">
          <p>
            <b>Status:</b> <span id="status">UNKNOWN</span>
          </p>
          <p>
            Filename: <span id="filename"></span>
          </p>
          <p>
            Name: <span id="name"></span>
            <br />
            Student ID: <span id="studentID"></span>{" "}
            <i>(Please check that your ID number is correct!)</i>
          </p>
          <hr />
          <div id="questions">
            <p>
              <b>Questions:</b>{" "}
              <i>(Please check that your answers are numbered correctly!)</i>
            </p>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: validatorScript }} />
      </body>
    </html>
  );
}
