'use babel';

export default class DafnyStatusBarElement {

  constructor(statusBar) {
    this.statusBar = statusBar;
    this.element = document.createElement('dafny-workbench-status-bar');
    this.element.classList.add('inline-block');
    this.statusElement = document.createElement('span');
    this.element.appendChild(this.statusElement);
    this.element.onclick = (event) => {
      const scope = 'atom-text-editor[data-grammar~="source"][data-grammar~="dafny"]';
      const target = document.querySelector(scope);
      if (event.target.classList.contains('running')) {
        atom.commands.dispatch(target, 'dafny-workbench:stop-dafny');
      } else {
        atom.commands.dispatch(target, 'dafny-workbench:start-dafny');
      }
    };
  }

  attach() {
    this.statusBarTile = this.statusBar.addRightTile({
      item: this.element,
      priority: 1000,
    });
  }

  detach() {
    if (this.statusBarTile) {
      this.statusBarTile.destroy();
      this.statusBarTile = null;
    }
  }

  destroy() {
    this.removeTooltip();
    this.detach();
  }

  setStatus(status) {
    this.statusElement.classList = '';
    this.statusElement.classList.add('dafny-status');
    switch (status) {
      case 'running':
        this.statusElement.classList.add('running', 'icon-gear');
        break;
      case 'stopped':
        this.statusElement.classList.add('stopped', 'icon-zap');
        break;
      case 'no-attempt':
        this.statusElement.classList.add('no-attempt', 'icon-unverified');
        break;
      case 'successful':
        this.statusElement.classList.add('successful', 'icon-verified');
        break;
      case 'unsuccessful':
        this.statusElement.classList.add('unsuccessful', 'icon-unverified');
        break;
      default:
        break;
    }
  }

  setTooltip(status, result, executionTime) {
    this.removeTooltip();
    let title;
    switch (status) {
      case 'running':
        title = 'Dafny program verifier is running...';
        break;
      case 'stopped':
        title = `Dafny program verifier stopped (${executionTime.toLocaleString()} ms)`;
        break;
      case 'no-attempt':
        title = `Dafny program verifier finished (${executionTime.toLocaleString()} ms)`;
        break;
      case 'successful':
      case 'unsuccessful':
        title = `${result} (${executionTime.toLocaleString()} ms)`;
        break;
      default:
        title = '';
        break;
    }
    this.tooltipSubscription = atom.tooltips.add(this.statusElement, {
      title,
    });
  }

  removeTooltip() {
    if (this.tooltipSubscription) {
      this.tooltipSubscription.dispose();
      this.tooltipSubscription = null;
    }
  }
}
