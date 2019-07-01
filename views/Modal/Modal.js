/* globals d3 */
import { View } from '../../node_modules/uki/dist/uki.esm.js';

class Modal extends View {
  constructor (resources = []) {
    super(d3.select('.modal .contents'), resources);
  }
  setup () {
    this.d3el.classed(this.type, true);
  }
}
export default Modal;
