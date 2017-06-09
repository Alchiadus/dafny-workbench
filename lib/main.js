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
      if (statusBar) {
        addStatusBarView(textEditor);
      }
    });
    dafnyRunner.on('dafny-runner-deactivated', (textEditor, subscription) => {
      dafnyRunners.delete(textEditor);
      subscriptions.remove(subscription);
      if (statusBar) {
        removeStatusBarView(textEditor);
      }
      if (signal) {
        clearSignalMessages(textEditor);
      }
      if (linter) {
        clearLinterMessages(textEditor);
      }
    });
    dafnyRunner.on('dafny-verification-started', (textEditor) => {
      if (statusBar) {
        updateStatusBarView(textEditor, 'running');
      }
      if (signal) {
        setSignalMessages(textEditor);
      }
      if (linter) {
        clearLinterMessages(textEditor);
      }
    });
    dafnyRunner.on('dafny-verification-stopped', (textEditor, executionTime) => {
      if (statusBar) {
        updateStatusBarView(textEditor, 'stopped', null, executionTime);
      }
      if (signal) {
        clearSignalMessages(textEditor);
      }
      if (linter) {
        clearLinterMessages(textEditor);
      }
    });
    dafnyRunner.on('dafny-verification-finished', (textEditor, stdout, status, result, executionTime) => {
      if (statusBar) {
        updateStatusBarView(textEditor, status, result, executionTime);
      }
      if (signal) {
        clearSignalMessages(textEditor);
      }
      if (linter) {
        setLinterMessages(textEditor, stdout);
      }
    });
  }));
}

function addStatusBarView(textEditor) {
  dafnyStatusBarView.add(textEditor);
}

function removeStatusBarView(textEditor) {
  dafnyStatusBarView.remove(textEditor);
}

function updateStatusBarView(textEditor, status, result, executionTime) {
  dafnyStatusBarView.update(textEditor, status, result, executionTime);
}

function clearLinterMessages(textEditor) {
  const textEditorPath = textEditor.getPath();
  linter.setMessages(textEditorPath, []);
}

function setLinterMessages(textEditor, stdout) {
  const textEditorPath = textEditor.getPath();
  const messages = DafnyOutputParser.parse(textEditorPath, stdout);
  linter.setMessages(textEditorPath, messages);
}

function clearSignalMessages(textEditor) {
  const textEditorPath = textEditor.getPath();
  const signalMessage = `Dafny: ${textEditorPath}`;
  signal.remove(signalMessage);
}

function setSignalMessages(textEditor) {
  const textEditorPath = textEditor.getPath();
  const signalMessage = `Dafny: ${textEditorPath}`;
  signal.add(signalMessage);
}
