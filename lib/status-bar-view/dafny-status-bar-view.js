'use babel';

import {
  Disposable,
  CompositeDisposable,
} from 'atom';

import DafnyStatusBarElement from './dafny-status-bar-element.js';

export default class DafnyStatusBarView {

  constructor(statusBar) {
    this.statusBar = statusBar;
    this.statusBarElements = new Map();
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(new Disposable(() => {
      this.removeAll();
    }));
    atom.workspace.onDidStopChangingActivePaneItem((paneItem) => {
      this.detachAll();
      const statusBarElement = this.statusBarElements.get(paneItem);
      if (statusBarElement) {
        statusBarElement.attach();
      }
    });
  }

  add(textEditor) {
    const statusBarElement = new DafnyStatusBarElement(this.statusBar);
    this.statusBarElements.set(textEditor, statusBarElement);
    statusBarElement.attach();
  }

  remove(textEditor) {
    const statusBarElement = this.statusBarElements.get(textEditor);
    this.statusBarElements.delete(textEditor);
    statusBarElement.destroy();
  }

  update(textEditor, status, result, executionTime) {
    const statusBarElement = this.statusBarElements.get(textEditor);
    statusBarElement.setStatus(status);
    statusBarElement.setTooltip(status, result, executionTime);
  }

  detachAll() {
    this.statusBarElements.forEach((statusBarElement) => {
      statusBarElement.detach();
    });
  }

  removeAll() {
    this.statusBarElements.forEach((statusBarElement, textEditor) => {
      this.remove(textEditor);
    });
  }
}
