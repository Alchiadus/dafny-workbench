'use babel';

import {
  CompositeDisposable,
} from 'atom';

import DafnyRunner from './runner/dafny-runner.js';
import DafnyStatusBarView from './status-bar-view/dafny-status-bar-view.js';
import DafnyOutputParser from './output-parser/dafny-output-parser.js';

let subscriptions;
let dafnyRunners;
let dafnyStatusBarView;
let statusBar;
let linter;
let signal;

export function activate() {
  subscriptions = new CompositeDisposable();
  dafnyRunners = new Map();
  dafnyStatusBarView = null;
  linter = null;
  signal = null;
  addCommands();
  observeDafnyFiles();
}

export function deactivate() {
  subscriptions.dispose();
}

export function consumeStatusBar(_statusBar) {
  statusBar = _statusBar;
  dafnyStatusBarView = new DafnyStatusBarView(statusBar);
  subscriptions.add(dafnyStatusBarView.subscriptions);
}

export function consumeLinter(registerLinter) {
  linter = registerLinter({
    name: 'Dafny',
  });
  subscriptions.add(linter);
}

export function consumeSignal(registerSignal) {
  signal = registerSignal.create();
  subscriptions.add(signal);
}

function addCommands() {
  const scope = 'atom-text-editor[data-grammar~="source"][data-grammar~="dafny"]';
  subscriptions.add(atom.commands.add(scope, 'dafny-workbench:start-dafny', () => {
    const textEditor = atom.workspace.getActiveTextEditor();
    const dafnyRunner = dafnyRunners.get(textEditor);
    if (dafnyRunner) {
      dafnyRunner.startDafy();
    }
  }));
  subscriptions.add(atom.commands.add(scope, 'dafny-workbench:stop-dafny', () => {
    const textEditor = atom.workspace.getActiveTextEditor();
    const dafnyRunner = dafnyRunners.get(textEditor);
    if (dafnyRunner) {
      dafnyRunner.stopDafny();
    }
  }));
}

function observeDafnyFiles() {
  subscriptions.add(atom.workspace.observeTextEditors((textEditor) => {
    const textEditorGrammar = textEditor.getGrammar();
    if (textEditorGrammar.name !== 'Dafny') {
      // The TextEditor does not have the Dafny grammar.
      return;
    }
    if (dafnyRunners.has(textEditor)) {
      // A Dafny Runner for the TextEditor already exists.
      return;
    }
    const dafnyRunner = new DafnyRunner(textEditor);
    dafnyRunners.set(textEditor, dafnyRunner);
    dafnyRunner.on('dafny-runner-activated', (textEditor, subscription) => {
      subscriptions.add(subscription);
      addStatusBarView(textEditor);
    });
    dafnyRunner.on('dafny-runner-deactivated', (textEditor, subscription) => {
      dafnyRunners.delete(textEditor);
      subscriptions.remove(subscription);
      removeStatusBarView(textEditor);
      clearSignalMessages(textEditor);
      clearLinterMessages(textEditor);
    });
    dafnyRunner.on('dafny-verification-started', (textEditor) => {
      updateStatusBarView(textEditor, 'running');
      setSignalMessages(textEditor);
      clearLinterMessages(textEditor);
    });
    dafnyRunner.on('dafny-verification-stopped', (textEditor, executionTime) => {
      updateStatusBarView(textEditor, 'stopped', null, executionTime);
      clearSignalMessages(textEditor);
      clearLinterMessages(textEditor);
    });
    dafnyRunner.on('dafny-verification-finished', (textEditor, stdout, status, result, executionTime) => {
      updateStatusBarView(textEditor, status, result, executionTime);
      clearSignalMessages(textEditor);
      setLinterMessages(textEditor, stdout);
    });
  }));
}

function addStatusBarView(textEditor) {
  if (!statusBar) {
    return;
  }
  dafnyStatusBarView.add(textEditor);
}

function removeStatusBarView(textEditor) {
  if (!statusBar) {
    return;
  }
  dafnyStatusBarView.remove(textEditor);
}

function updateStatusBarView(textEditor, status, result, executionTime) {
  if (!statusBar) {
    return;
  }
  dafnyStatusBarView.update(textEditor, status, result, executionTime);
}

function clearLinterMessages(textEditor) {
  if (!linter) {
    return;
  }
  const textEditorPath = textEditor.getPath();
  linter.setMessages(textEditorPath, []);
}

function setLinterMessages(textEditor, stdout) {
  if (!linter) {
    return;
  }
  const textEditorPath = textEditor.getPath();
  const messages = DafnyOutputParser.parse(textEditorPath, stdout);
  linter.setMessages(textEditorPath, messages);
}

function clearSignalMessages(textEditor) {
  if (!signal) {
    return;
  }
  const textEditorPath = textEditor.getPath();
  const signalMessage = `Dafny: ${textEditorPath}`;
  signal.remove(signalMessage);
}

function setSignalMessages(textEditor) {
  if (!signal) {
    return;
  }
  const textEditorPath = textEditor.getPath();
  const signalMessage = `Dafny: ${textEditorPath}`;
  signal.add(signalMessage);
}
