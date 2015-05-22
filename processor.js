var fs = require('fs'),
	path = require('path'),
	program = require('commander'),
	Q = require('q'),
	sax = require('sax'),
	marked = require('marked'),
	Highlight = require('highlight.js').highlight,
	ejs = require('ejs');

// Setup argument processing
program.version('0.1.0')
	.usage('<input file> <output file>')
	.option('-t, --template [template]', 'Template file to use', 'template.html')
	.parse(process.argv);

// Check that the file exists on disk
if(!fs.existsSync(program.args[0])) {
	console.error('File "%s" does not exist. Must specify an existing file', program.args[0]);
	process.exit(1);
} else if(!fs.existsSync(program.template)) {
	console.error('File "%s" does not exist. Must specify valid template file', program.template);
	process.exit(2);
}

console.log('Getting contents of "%s"', program.args[0]);
Q.nfcall(fs.readFile, program.args[0], 'utf-8')
	.then(function (fileContents) {
		console.log('Parsing File');
		
		return Q.Promise(function (resolve, reject, notify) {
			var comments = [],
				parser = sax.parser(true);
			
			parser.onend = function () {
				resolve({
					xml: fileContents,
					comments: comments
				});
			};
			
			parser.onerror = function (err) {
				throw err;
			};
			
			parser.oncomment = function (commentText) {
				comments.push({
					text: commentText,
					// Render as markdown
					rendered: commentText.match(/^\s*!\s*$/) ? '' : marked(commentText.replace(/^\t+/gm,''), {
						gfm: true,
						tables: true,
						sanitize: true,
						smartypants: true
					}),
					lineNo: parser.line,
					column: parser.column,
					start: parser.startTagPosition - 1,
					end: parser.position + 1
				});
			};
			
			parser.write(fileContents).close();
			
		});
		
	}).then(function (results) {
		console.log('File Parsed\nProcessing');
		
		var contentBlocks = [],
			comments = results.comments,
			xml = results.xml;
		
		// Remove comments from XML bottom up
		for(var p = comments.length - 1; p >= 0; p--) {
			var xmlPart = xml.substr(comments[p].end).replace(/^\r?\n?\r?|\r?\n?\r?$/,'');
			xml = xml.substr(0, comments[p].start);
			
			contentBlocks.unshift({
				comment: comments[p].rendered,
				code: Highlight('xml', xmlPart).value
			});
		}
		if(xml) {
			contentBlocks.unshift({
				comment: '',
				code: Highlight('xml', xml).value
			});
		}
		
		console.log('Rendering Template');
		var output = ejs.render(fs.readFileSync(program.template, 'utf-8'), {
			title: path.basename(program.args[0]),
			filename: path.basename(program.args[0]),
			contentBlocks: contentBlocks
		});
		
		return Q.nfcall(fs.writeFile, program.args[1], output, {'encoding':'utf8'});
	})
	.then(function () {
		console.log('Successfully wrote to file "%s"', program.args[1]);
	})
	.done();