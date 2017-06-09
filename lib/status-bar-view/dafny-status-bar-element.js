'use babel';

import {
  Disposable,
  CompositeDisposable,
} from 'atom';

export default class DafnyStatusBarElement {

  constructor(statusBar, textEditor) {
    this.statusBar = statusBar;
    this.textEditor = textEditor;
    this.element = document.createElement('dafny-workbench-status-bar');
    this.element.classList.add('inline-block');
    this.statusElement = document.createElement('span');
    this.statusElement.classList.add('dafny-status');
    this.element.appendChild(this.statusElement);
    this.subscriptions = new CompositeDisposable();
  }

  attach() {
    this.statusBarTile = this.statusBar.addRightTile({
      item: this.element,
      priority: 1000,
    });
    this.statusBarTileSubscription = new Disposable(() => {
      if (this.statusBarTile) {
        this.statusBarTile.destroy();
      }
    });
    this.subscriptions.add(this.statusBarTileSubscription);
  }

  detach() {
    if (!this.statusBarTile) {
      return;
    }
    this.statusBarTileSubscription.dispose();
    this.subscriptions.remove(this.statusBarTileSubscription);
  }

  destroy() {
    this.subscriptions.dispose();
  }

  setStatus(status) {
    switch (status) {
      case 'running':
        this.statusElement.classList.remove('stopped', 'icon-zap');
        this.statusElement.classList.remove('no-attempt', 'icon-unverified');
        this.statusElement.classList.remove('successful', 'icon-verified');
        this.statusElement.classList.remove('unsuccessful', 'icon-unverified');
        this.statusElement.classList.add('running', 'icon-gear');
        break;
      case 'stopped':
        this.statusElement.classList.remove('running', 'icon-gear');
        this.statusElement.classList.add('stopped', 'icon-zap');
        break;
      case 'no-attempt':
        this.statusElement.classList.remove('running', 'icon-gear');
        this.statusElement.classList.add('no-attempt', 'icon-unverified');
        break;
      case 'successful':
        this.statusElement.classList.remove('running', 'icon-gear');
        this.statusElement.classList.add('successful', 'icon-verified');
        break;
      case 'unsuccessful':
        this.statusElement.classList.remove('running', 'icon-gear');
        this.statusElement.classList.add('unsuccessful', 'icon-unverified');
        break;
      default:
    }
  }

  setTooltip(status, result, executionTime) {
    if (this.tooltipSubscription) {
      this.tooltipSubscription.dispose();
      this.subscriptions.remove(this.tooltipSubscription);
      this.tooltipSubscription = null;
    }
    switch (status) {
      case 'running':
        this.tooltipSubscription = atom.tooltips.add(this.statusElement, {
          title: 'Dafny program verifier is running...',
        });
        this.subscriptions.add(this.tooltipSubscription);
        break;
      case 'stopped':
        this.tooltipSubscription = atom.tooltips.add(this.statusElement, {
          title: `Dafny program verifier stopped (${executionTime.toLocaleString()} ms)`,
        });
        this.subscriptions.add(this.tooltipSubscription);
        break;
      case 'no-attempt':
        this.tooltipSubscription = atom.tooltips.add(this.statusElement, {
          title: `Dafny program verifier finished (${executionTime.toLocaleString()} ms)`,
        });
        this.subscriptions.add(this.tooltipSubscription);
        break;
      case 'successful':
      case 'unsuccessful':
        this.tooltipSubscription = atom.tooltips.add(this.statusElement, {
          title: `${result} (${executionTime.toLocaleString()} ms)`,
        });
        this.subscriptions.add(this.tooltipSubscription);
        break;
      default:
    }
  }
}
