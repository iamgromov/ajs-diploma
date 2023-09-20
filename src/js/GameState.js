export default class GameState {
  constructor() {
    this.isUsersTurn = true;
    this.level = 0;
    this.allPositions = [];
    this.points = 0;
    this.statistics = [];
    this.selected = null;
  }

  static from(object) {
    if (typeof object === 'object') {
      return object;
    }
    return null;
  }
}
