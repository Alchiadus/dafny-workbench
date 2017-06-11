'use babel';

import fs from 'fs';
import os from 'os';
import path from 'path';

import ChildProcess from 'child_process';
import EventEmitter from 'events';

import {
  CompositeDisposable,
} from 'atom';

export default class DafnyRunner extends EventEmitter {

  constructor(textEditor) {
    super();
    this.textEditor = textEditor;
    this.subscriptions = new CompositeDisposable();
    this.dafnyProcess = null;
    this.dafnyExecutionStartTime = null;
    this.isDafnyRunning = false;
    this.activate();
  }

  activate() {
    this.subscriptions.add(atom.config.observe(`dafny-workbench.executableSettings.dafnyExecutablePath`, (executablePath) => {
      this.executablePath = executablePath;
    }));
    this.subscriptions.add(atom.config.observe(`dafny-workbench.executableSettings.dafnyExecutableArguments`, (executableArguments) => {
      this.executableArguments = executableArguments;
    }));
    this.subscriptions.add(this.textEditor.onDidStopChanging(() => {
      this.startDafy();
    }));
    this.subscriptions.add(this.textEditor.onDidDestroy(() => {
      this.deactivate();
    }));
    // We want to emit from within the constructor, so need a workaround.
    // Without setImmediate the event would never be emitted,
    // because constructor is not finalized and event lister is not yet set up.
    // Thus, schedule the event to be emitted after synchronous code is run.
    setImmediate(() => {
      this.emit('dafny-runner-activated', this.textEditor, this.subscriptions);
      this.emit('dafny-verification-stopped', this.textEditor, this.getExecutionTime());
    });
  }

  deactivate() {
    this.subscriptions.dispose();
    this.stopDafny();
    this.emit('dafny-runner-deactivated', this.textEditor, this.subscriptions);
  }

  async startDafy() {
    this.stopDafny();
    // Write temporary file.
    const tmpFilePath = await this.writeTemporaryFile();
    // Run Dafny.
    this.emit('dafny-verification-started', this.textEditor);
    let stdout = '';
    let stderr = '';
    this.dafnyExecutionStartTime = performance.now();
    this.dafnyProcess = ChildProcess.spawn(this.executablePath, this.executableArguments.concat([tmpFilePath]), spawnOptions);
    this.dafnyProcess.stdout.on('data', (data) => {
      stdout += data;
    });
    this.dafnyProcess.stderr.on('data', (data) => {
      stderr += data;
    });
    this.dafnyProcess.on('close', (exitCode) => {
      const executionTime = this.getExecutionTime();
      if (!this.dafnyProcess) {
        // Dafny process does no longer exist.
        return;
      }
      if (!stdout) {
        // Dafny process killed before it could return stdout.
        return;
      }
      if (stderr) {
        console.error(stderr); // eslint-disable-line no-console
      }
      let status;
      let result;
      const verification = /Dafny program verifier finished with (\d+) verified, (\d+) errors?/g.exec(stdout);
      if (!verification) {
        status = 'no-attempt';
        result = null;
      } else {
        status = verification[2] === '0' ? 'successful' : 'unsuccessful';
        result = verification[0];
      }
      this.emit('dafny-verification-finished', this.textEditor, stdout, status, result, executionTime);
      this.dafnyProcess = null;
      this.dafnyExecutionStartTime = null;
    });
  }

  stopDafny() {
    if (this.dafnyProcess) {
      // A Dafny process is already running. Kill process.
      this.dafnyProcess.kill();
      this.emit('dafny-verification-stopped', this.textEditor, this.getExecutionTime());
      this.dafnyProcess = null;
      this.dafnyExecutionStartTime = null;
    }
  }

  getExecutionTime() {
    const executionEndTime = performance.now();
    const executionStartTime = this.dafnyExecutionStartTime ? this.dafnyExecutionStartTime : executionEndTime;
    const executionTime = Math.round(executionEndTime - executionStartTime);
    return executionTime;
  }

  writeTemporaryFile() {
    const textEditorPath = this.textEditor.getPath();
    const tmpDir = path.join(os.tmpdir());
    const tmpFilePath = path.join(tmpDir, path.basename(textEditorPath));
    const textEditorText = this.textEditor.getText();
    return new Promise((resolve, reject) => {
      fs.writeFile(tmpFilePath, textEditorText, 'UTF-8', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(tmpFilePath);
        }
      });
    });
  }

  writeOutputToConsole(textEditor, stdout) {
    /* eslint-disable no-console */
    const textEditorPath = textEditor.getPath();
    const stdoutLines = stdout.split('\n');
    console.log(textEditorPath);
    stdoutLines.forEach((line) => {
      if (line !== '') {
        console.log('|', line);
      }
    });
    /* eslint-enable no-console */
  }
}
