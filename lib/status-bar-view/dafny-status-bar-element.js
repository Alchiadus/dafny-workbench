'use babel';

export default class DafnyStatusBarElement {

  constructor(statusBar) {
    this.statusBar = statusBar;
    this.element = document.createElement('dafny-workbench-status-bar');
    this.element.classList.add('inline-block');
    this.statusElement = document.createElement('span');
    this.statusElement.classList.add('dafny-status');
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
    this.removeTooltip();
    switch (status) {
      case 'running':
        this.tooltipSubscription = atom.tooltips.add(this.statusElement, {
          title: 'Dafny program verifier is running...',
        });
        break;
      case 'stopped':
        this.tooltipSubscription = atom.tooltips.add(this.statusElement, {
          title: `Dafny program verifier stopped (${executionTime.toLocaleString()} ms)`,
        });
        break;
      case 'no-attempt':
        this.tooltipSubscription = atom.tooltips.add(this.statusElement, {
          title: `Dafny program verifier finished (${executionTime.toLocaleString()} ms)`,
        });
        break;
      case 'successful':
      case 'unsuccessful':
        this.tooltipSubscription = atom.tooltips.add(this.statusElement, {
          title: `${result} (${executionTime.toLocaleString()} ms)`,
        });
        break;
      default:
    }
  }

  removeTooltip() {
    if (this.tooltipSubscription) {
      this.tooltipSubscription.dispose();
      this.tooltipSubscription = null;
    }
  }
}
