function download(text) {
	var elem = document.createElement('a');
	elem.setAttribute('href', 'data:text/x-tex;charset=utf-8,' + encodeURIComponent(text));
	elem.setAttribute('download', 'comments_removed.tex')
	elem.style.display = 'none';
	document.body.appendChild(elem);
	elem.click();
	document.body.removeChild(elem);
}

function applyRegex(regex, text, pos) {
	regex.lastIndex = pos;
	regex.test(text);
	return regex.lastIndex;
}

function Parser(text)
{
	this.specialCharRe = /[\\%\s]/g;
	this.endLineRe = /$/gm;
	this.startLineRe = /^/gm;
	this.newlineRe = /[\r\n]+/g;
	this.whitespaceRe = /[^\S\r\n]+/g;
	this.output_array = [];
	this.lineStart = true;
	this.space = true;
	this.text = text;
}

Parser.prototype.output = function() {
	return this.output_array.join('');
}

Parser.prototype.append = function(startpos, endpos) {
	this.output_array.push(this.text.slice(startpos, endpos));
}

Parser.prototype.handleBackslash = function(pos) {
	this.append(pos, pos + 2);
	this.specialCharRe.lastIndex = pos + 2;
	var ch = this.text[pos + 1];
	this.lineStart = (ch == '\r' || ch == '\n');
	this.space = this.lineStart;
}

Parser.prototype.handlePercent = function(pos) {
	var endRe;
	if (this.lineStart) {
		endRe = this.startLineRe;
	}
	else {
		endRe = this.endLineRe;
	}
	if (!this.space) {
		this.append(pos, pos + 1);
	}
	this.specialCharRe.lastIndex = applyRegex(endRe, this.text, pos + 1);
}

Parser.prototype.handleNewline = function(pos) {
	this.newlineRe.lastIndex = pos;
	this.newlineRe.test(this.text);
	this.append(pos, this.specialCharRe.lastIndex);
	this.lineStart = true;
	this.space = true;
}

Parser.prototype.handleSpace = function(pos) {
	this.specialCharRe.lastIndex = applyRegex(this.whitespaceRe, this.text, pos);
	if (this.text[this.specialCharRe.lastIndex] != '%') {
		this.append(pos, this.specialCharRe.lastIndex);
	}
	this.space = true;
}

Parser.prototype.parse = function() {
	var index = 0;
	while(this.specialCharRe.test(this.text)) {
		var pos = this.specialCharRe.lastIndex - 1;
		if (pos > index) {
			this.append(index, pos);
			this.lineStart = false;
			this.space = false;
		}
		var ch = this.text[pos];
		if (ch == '\\') {
			this.handleBackslash(pos);
		}
		else if (ch == '%') {
			this.handlePercent(pos);
		}
		else if (ch == '\r' || ch == '\n') {
			this.handleNewline(pos);
		}
		else {
			this.handleSpace(pos);
		}
		index = this.specialCharRe.lastIndex;
	}
}

function parse(text) {
	var parser = new Parser(text);
	parser.parse();
	return parser.output();
}

function readFile(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
	download(parse(e.target.result));
  };
  reader.readAsText(file);
}
