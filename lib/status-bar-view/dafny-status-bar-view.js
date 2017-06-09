'use babel';

import {
  CompositeDisposable,
} from 'atom';

import DafnyStatusBarElement from './dafny-status-bar-element.js';

export default class DafnyStatusBarView {

  constructor(statusBar) {
    this.statusBar = statusBar;
    this.statusBarElements = new Map();
    this.subscriptions = new CompositeDisposable();
    atom.workspace.onDidStopChangingActivePaneItem((paneItem) => {
      this.hideAllStatusBarElements();
      const statusBarElement = this.statusBarElements.get(paneItem);
      if (statusBarElement) {
        this.showStatusBarElement(statusBarElement);
      }
    });
  }

  add(textEditor) {
    const statusBarElement = new DafnyStatusBarElement(this.statusBar, textEditor);
    this.statusBarElements.set(textEditor, statusBarElement);
    this.subscriptions.add(statusBarElement.subscriptions);
    statusBarElement.attach();
  }

  remove(textEditor) {
    const statusBarElement = this.statusBarElements.get(textEditor);
    this.subscriptions.remove(statusBarElement.subscriptions);
    statusBarElement.destroy();
  }

  update(textEditor, status, result, executionTime) {
    const statusBarElement = this.statusBarElements.get(textEditor);
    statusBarElement.setStatus(status);
    statusBarElement.setTooltip(status, result, executionTime);
  }

  showStatusBarElement(statusBarElement) {
    statusBarElement.attach();
  }

  hideAllStatusBarElements() {
    this.statusBarElements.forEach((statusBarElement) => {
      statusBarElement.detach();
    });
  }

  destroy() {
    this.subscriptions.dispose();
  }
}
