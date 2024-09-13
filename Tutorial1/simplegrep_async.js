if (Deno.args.length < 3) {
    console.error('Not enough parameters given. Try this: ' +
                  '"deno run --allow-read --allow-write simplegrep_async term filename.txt output.txt"'); 
    Deno.exit(1);
}

const searchterm = Deno.args[0];
const filename = Deno.args[1];
const outputFilename = Deno.args[2];

// Convert search term to a regular expression
const regex = new RegExp(searchterm, 'i'); // 'i' makes it case-insensitive

const returnMatches = function(rawContents) {
    const lines = rawContents.split('\n');
    const matchedLines = [];

    lines.forEach(function(theLine) {
        if (regex.test(theLine)) {
            matchedLines.push(theLine);
        }
    });

    // Sort matched lines alphabetically
    matchedLines.sort();
    
    return matchedLines;
}

try {
    const rawContents = await Deno.readTextFile(filename);
    const matchedLines = returnMatches(rawContents);
    
    // Write matched lines to a new file
    await Deno.writeTextFile(outputFilename, matchedLines.join('\n'));

    // Output "All done!" to the console
    console.log("All done!");
} catch (error) {
    console.error(`Error reading file: ${error.message}`);
    Deno.exit(1);
}