'use babel';

export default class DafnyOutputParser {

  static lineParsers = [
    {
      severity: 'error',
      regExp: /(.+)\((\d+),(\d+)\): [Ee]rror(?:| [\w\d]+): (.+)/,
    },
    {
      severity: 'info',
      regExp: /(.+)\((\d+),(\d+)\): [Rr]elated location: (.+)/,
    },
    {
      severity: 'warning',
      regExp: /(.+)\((\d+),(\d+)\): [Ww]arning(?:| [\w\d]+): (.+)/,
    },
    {
      severity: 'info',
      regExp: /(.+)\((\d+),(\d+)\): [Ii]nfo(?:| [\w\d]+): (.+)/,
    },
  ];

  static parse(textEditorPath, stdout) {
    const messages = [];
    const stdoutLines = Array.from(new Set(stdout.split('\n')));
    stdoutLines.forEach((line) => {
      DafnyOutputParser.lineParsers.forEach((lineParser) => {
        const regExp = lineParser.regExp;
        const severity = lineParser.severity;
        const message = DafnyOutputParser.parseLine(textEditorPath, line, regExp, severity);
        if (message !== null) {
          messages.push(message);
        }
      });
    });
    return messages;
  }

  static parseLine(textEditorPath, line, regExp, severity) {
    const matchResult = line.match(regExp);
    if (matchResult === null) {
      return null;
    }
    const lineNumber = matchResult[2];
    const column = matchResult[3];
    const excerpt = matchResult[4];
    return {
      severity,
      excerpt,
      location: {
        file: textEditorPath,
        position: [
          [lineNumber - 1, column - 1],
          [lineNumber - 1, column - 1],
        ],
      },
    };
  }
}
