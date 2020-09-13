/* globals uki */
class PauseView extends uki.ui.ModalView {
  constructor (options = {}) {
    options.resources = options.resources || [];
    options.resources.push({
      type: 'less', url: 'views/PauseView/style.less'
    });
    options.content = `<h1>Paused</h1><p>Hit ${window.controller.keyBindings.pause} to resume</p>`;
    options.buttonSpecs = [];
    super(options);
  }

  async setup () {
    await super.setup(...arguments);
    this.d3el.classed('PauseView', true);
  }
}

export default PauseView;
