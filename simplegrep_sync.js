if (Deno.args.length < 3) {
    console.error('Not enough parameters given. Try this: ' +
                  '"deno run --allow-read --allow-write simplegrep_sync term filename.txt output.txt"'); 
    Deno.exit(1);
}

var searchterm = Deno.args[0];
var filename = Deno.args[1];
var outputFilename = Deno.args[2];

// Convert search term to a regular expression
var regex = new RegExp(searchterm, 'i'); // 'i' makes it case-insensitive

var rawContents = Deno.readTextFileSync(filename);
var lines = rawContents.split('\n');

// Collect matched lines
var matchedLines = [];
for (var i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
        matchedLines.push(lines[i]);
    }
}

// Sort the matched lines alphabetically
matchedLines.sort();

// Write matched lines to a new file
Deno.writeTextFileSync(outputFilename, matchedLines.join('\n'));

// Output "All done!" to the console
console.log("All done!");