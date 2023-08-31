import { generatePositions, generateTeam } from './generators';
import Team from './Team';
import themes from './themes';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
  }

  init() {
    const theme = themes.prairie;
    this.gamePlay.drawUi(theme);

    this.startGame();
  }

  startGame() {
    const playerTeam = generateTeam(Team.playerHeroes(), 1, 2);
    const enemyTeam = generateTeam(Team.enemyHeroes(), 1, 2);

    const playerPositions = generatePositions(playerTeam.characters, 'player');
    const enemyPositions = generatePositions(enemyTeam.characters, 'enemy');
    const charactersPositions = playerPositions.concat(enemyPositions);

    this.gamePlay.redrawPositions(charactersPositions);
  }

  onCellClick(index) {
    // TODO: react to click
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
  }
}
