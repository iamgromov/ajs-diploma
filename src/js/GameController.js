/* eslint-disable max-len */
/* eslint-disable default-case */

import Bowman from './characters/Bowman';
import Daemon from './characters/Daemon';
import Magician from './characters/Magician';
import Swordsman from './characters/Swordsman';
import Undead from './characters/Undead';
import Vampire from './characters/Vampire';

import GamePlay from './GamePlay';
import GameState from './GameState';
import PositionedCharacter from './PositionedCharacter';
import Team from './Team';
import { generateTeam } from './generators';

import cursors from './cursors';
import themes from './themes';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.playerTeam = new Team();
    this.enemyTeam = new Team();
    this.playerCharacters = [Bowman, Swordsman, Magician];
    this.enemyCharacters = [Daemon, Undead, Vampire];

    this.gameState = new GameState();
  }

  init() {
    this.gamePlay.drawUi(Object.values(themes)[this.gameState.level]);
    this.playerTeam.addAll(generateTeam(this.playerCharacters, 1, 2));
    this.enemyTeam.addAll(generateTeam(this.enemyCharacters, 1, 2));
    this.teamsPosition(this.playerTeam, this.playerPositions());
    this.teamsPosition(this.enemyTeam, this.enemyPositions());

    this.gamePlay.redrawPositions(this.gameState.allPositions);

    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
  }

  onCellClick(index) {
    if (this.gameState.level === 4 || this.playerTeam.characters.size === 0) {
      return;
    }

    // Attack
    if (this.gameState.selected !== null && this.getCharacter(index) && this.checkEnemyCharater(index)) {
      if (this.isAttack(index)) {
        this.getAttack(index, this.gameState.selected);
      }
    }

    // Movement
    if (this.gameState.selected !== null && this.isMoving(index) && !this.getCharacter(index)) {
      if (this.gameState.isUsersTurn) {
        this.moveCharacter(index);
      }
    }

    // Error if cannot move
    if (this.gameState.selected !== null && !this.isMoving(index) && !this.isAttack(index)) {
      if (this.gameState.isUsersTurn && !this.getCharacter(index)) {
        GamePlay.showError('Invalid move');
      }
    }

    // Return if cell empty
    if (!this.getCharacter(index)) {
      return;
    }

    // Error if click on enemy character
    if (this.getCharacter(index) && this.checkEnemyCharater(index) && !this.isAttack(index)) {
      GamePlay.showError('Enemy character');
    }

    // Select character when clicked
    if (this.getCharacter(index) && this.checkPlayerCharacter(index)) {
      this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-green'));
      this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-yellow'));
      this.gamePlay.selectCell(index);
      this.gameState.selected = index;
    }
  }

  onCellEnter(index) {
    // Change cursor when hovering over character
    if (this.getCharacter(index) && this.checkPlayerCharacter(index)) {
      this.gamePlay.setCursor(cursors.pointer);
    }

    // Select cell when moving
    if (this.gameState.selected !== null && !this.getCharacter(index) && this.isMoving(index)) {
      this.gamePlay.setCursor(cursors.pointer);
      this.gamePlay.selectCell(index, 'green');
    }

    // Show info about character
    if (this.getCharacter(index)) {
      const char = this.getCharacter(index).character;
      const message = `\u{1F396}${char.level}\u{2694}${char.attack}\u{1F6E1}${char.defence}\u{2764}${char.health}`;
      this.gamePlay.showCellTooltip(message, index);
    }

    // Select cell and cursor when attack
    if (this.gameState.selected !== null && this.getCharacter(index) && !this.checkPlayerCharacter(index)) {
      if (this.isAttack(index)) {
        this.gamePlay.setCursor(cursors.crosshair);
        this.gamePlay.selectCell(index, 'red');
      }
    }

    // Show nottallowed cursor if cannot attack and move
    if (this.gameState.selected !== null && !this.isAttack(index) && !this.isMoving(index)) {
      if (!this.checkPlayerCharacter(index)) {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    }
  }

  onCellLeave(index) {
    this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-red'));
    this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-green'));
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.setCursor(cursors.auto);
  }

  getAttack(index) {
    if (this.gameState.isUsersTurn) {
      const attacker = this.getCharacter(this.gameState.selected).character;
      const target = this.getCharacter(index).character;
      const damage = Math.max(attacker.attack - target.defence, attacker.attack * 0.1);
      if (!attacker || !target) {
        return;
      }

      this.gamePlay.showDamage(index, damage).then(() => {
        target.health -= damage;
        if (target.health <= 0) {
          this.deleteCharacter(index);
          this.enemyTeam.delete(target);
        }
      }).then(() => {
        this.gamePlay.redrawPositions(this.gameState.allPositions);
      }).then(() => {
        this.getGameResult();
        this.enemyAction();
      });
      this.gameState.isUsersTurn = false;
    }
  }

  /**
     * Character's moving function
     */
  moveCharacter(index) {
    this.getSelectedCharacter().position = index;
    this.gamePlay.deselectCell(this.gameState.selected);
    this.gamePlay.redrawPositions(this.gameState.allPositions);
    this.gameState.selected = index;
    this.gameState.isUsersTurn = false;
    this.enemyAction();
  }

  /**
     * Enemy action function
     */
  enemyAction() {
    if (this.gameState.isUsersTurn) {
      return;
    }

    const enemyArr = this.gameState.allPositions.filter((elem) => (
      elem.character instanceof Vampire
        || elem.character instanceof Daemon
        || elem.character instanceof Undead
    ));
    const playerArr = this.gameState.allPositions.filter((elem) => (
      elem.character instanceof Bowman
        || elem.character instanceof Swordsman
        || elem.character instanceof Magician
    ));
    let bot = null;
    let target = null;

    if (enemyArr.length === 0 || playerArr.length === 0) {
      return;
    }

    enemyArr.forEach((elem) => {
      const rangeAttack = this.calcRange(elem.position, elem.character.attackRange);
      playerArr.forEach((item) => {
        if (rangeAttack.includes(item.position)) {
          bot = elem;
          target = item;
        }
      });
    });

    if (target) {
      const damage = Math.max(bot.character.attack - target.character.defence, bot.character.attack * 0.1);
      this.gamePlay.showDamage(target.position, damage).then(() => {
        target.character.health -= damage;
        if (target.character.health <= 0) {
          this.deleteCharacter(target.position);
          this.playerTeam.delete(target.character);
          this.gamePlay.deselectCell(this.gameState.selected);
          this.gameState.selected = null;
        }
      }).then(() => {
        this.gamePlay.redrawPositions(this.gameState.allPositions);
        this.gameState.isUsersTurn = true;
      }).then(() => {
        this.getGameResult();
      });
    } else {
      bot = enemyArr[Math.floor(Math.random() * enemyArr.length)];
      const botRange = this.calcRange(bot.position, bot.character.moveRange);
      botRange.forEach((e) => {
        this.gameState.allPositions.forEach((i) => {
          if (e === i.position) {
            botRange.splice(botRange.indexOf(i.position), 1);
          }
        });
      });
      const botPos = this.getRandom(botRange);
      bot.position = botPos;

      this.gamePlay.redrawPositions(this.gameState.allPositions);
      this.gameState.isUsersTurn = true;
    }
  }

  /**
     * Check game position function
     */
  getGameResult() {
    if (this.playerTeam.characters.size === 0) {
      this.gameState.statistics.push(this.gameState.points);
      GamePlay.showMessage(`Game over.. Your score: ${this.gameState.points}`);
    }

    if (this.enemyTeam.characters.size === 0 && this.gameState.level === 4) {
      this.getPoints();
      this.gameState.statistics.push(this.gameState.points);
      GamePlay.showMessage(`You win! Your score: ${this.gameState.points},
        Best result: ${Math.max(...this.gameState.statistics)}`);
      this.gameState.level += 1;
    }

    if (this.enemyTeam.characters.size === 0 && this.gameState.level <= 3) {
      this.gameState.isUsersTurn = true;
      this.getPoints();
      GamePlay.showMessage(`Level ${this.gameState.level + 1} completed. Your score: ${this.gameState.points}`);
      this.gameState.level += 1;
      this.getLevelUp();
    }
  }

  /**
     * Level up function
     */
  getLevelUp() {
    this.gameState.allPositions = [];
    this.playerTeam.characters.forEach((char) => char.levelUp());

    if (this.gameState.level === 1) {
      this.playerTeam.addAll(generateTeam(this.playerCharacters, 1, 1));
      this.enemyTeam.addAll(generateTeam(this.enemyCharacters, 2, this.playerTeam.characters.size));
    }

    if (this.gameState.level === 2) {
      this.playerTeam.addAll(generateTeam(this.playerCharacters, 2, 2));
      this.enemyTeam.addAll(generateTeam(this.enemyCharacters, 3, this.playerTeam.characters.size));
    }

    if (this.gameState.level === 3) {
      this.playerTeam.addAll(generateTeam(this.playerCharacters, 3, 2));
      this.enemyTeam.addAll(generateTeam(this.enemyCharacters, 4, this.playerTeam.characters.size));
    }

    GamePlay.showMessage(`Level ${this.gameState.level + 1}`);
    this.gamePlay.drawUi(Object.values(themes)[this.gameState.level]);
    this.teamsPosition(this.playerTeam, this.playerPositions());
    this.teamsPosition(this.enemyTeam, this.enemyPositions());
    this.gamePlay.redrawPositions(this.gameState.allPositions);
  }

  /**
     * Scoring points function
     */
  getPoints() {
    this.gameState.points += this.playerTeam.toArray().reduce((a, b) => a + b.health, 0);
  }

  /**
     * Delete character from cell
     */
  deleteCharacter(idx) {
    const state = this.gameState.allPositions;
    state.splice(state.indexOf(this.getCharacter(idx)), 1);
  }

  /**
     * Check range of moving
     */
  isMoving(index) {
    if (this.getSelectedCharacter()) {
      const moving = this.getSelectedCharacter().character.moveRange;
      const arr = this.calcRange(this.gameState.selected, moving);
      return arr.includes(index);
    }
    return false;
  }

  /**
     * Check range of attack
     */
  isAttack(index) {
    if (this.getSelectedCharacter()) {
      const hit = this.getSelectedCharacter().character.attackRange;
      const arr = this.calcRange(this.gameState.selected, hit);
      return arr.includes(index);
    }
    return false;
  }

  /**
     * Return selected charater
     */
  getSelectedCharacter() {
    return this.gameState.allPositions.find((elem) => elem.position === this.gameState.selected);
  }

  /**
     * Return array of possible player positions at game start
     */
  playerPositions() {
    const size = this.gamePlay.boardSize;
    this.playerPosition = [];
    for (let i = 0, j = 1; this.playerPosition.length < size * 2; i += size, j += size) {
      this.playerPosition.push(i, j);
    }
    return this.playerPosition;
  }

  /**
     *Return array of possible enemy positions at game start
     */
  enemyPositions() {
    const size = this.gamePlay.boardSize;
    const enemyPosition = [];
    for (let i = size - 2, j = size - 1; enemyPosition.length < size * 2; i += size, j += size) {
      enemyPosition.push(i, j);
    }
    return enemyPosition;
  }

  /**
   * Return random position
   */
  getRandom(positions) {
    this.positions = positions;
    return this.positions[Math.floor(Math.random() * this.positions.length)];
  }

  /**
     * Add positions in gameState.allPositions
     */
  teamsPosition(team, positions) {
    const copyPositions = [...positions];
    for (const item of team) {
      const random = this.getRandom(copyPositions);
      this.gameState.allPositions.push(new PositionedCharacter(item, random));
      copyPositions.splice(copyPositions.indexOf(random), 1);
    }
  }

  /**
     * Check player's characters
     */
  checkPlayerCharacter(index) {
    if (this.getCharacter(index)) {
      const char = this.getCharacter(index).character;
      return this.playerCharacters.some((elem) => char instanceof elem);
    }
    return false;
  }

  /**
     * Check enemy's characters
     */
  checkEnemyCharater(index) {
    if (this.getCharacter(index)) {
      const bot = this.getCharacter(index).character;
      return this.enemyCharacters.some((elem) => bot instanceof elem);
    }
    return false;
  }

  /**
     * Return character by index of gameState.allPositions
     */
  getCharacter(index) {
    return this.gameState.allPositions.find((elem) => elem.position === index);
  }

  /**
     * Calculates movement or attack range
     */
  calcRange(index, character) {
    const { boardSize } = this.gamePlay;
    const range = [];
    const leftBorder = [];
    const rightBorder = [];

    for (let i = 0, j = boardSize - 1; leftBorder.length < boardSize; i += boardSize, j += boardSize) {
      leftBorder.push(i);
      rightBorder.push(j);
    }

    for (let i = 1; i <= character; i += 1) {
      range.push(index + (boardSize * i));
      range.push(index - (boardSize * i));
    }

    for (let i = 1; i <= character; i += 1) {
      if (leftBorder.includes(index)) {
        break;
      }
      range.push(index - i);
      range.push(index - (boardSize * i + i));
      range.push(index + (boardSize * i - i));
      if (leftBorder.includes(index - i)) {
        break;
      }
    }

    for (let i = 1; i <= character; i += 1) {
      if (rightBorder.includes(index)) {
        break;
      }
      range.push(index + i);
      range.push(index - (boardSize * i - i));
      range.push(index + (boardSize * i + i));
      if (rightBorder.includes(index + i)) {
        break;
      }
    }

    return range.filter((elem) => elem >= 0 && elem <= (boardSize ** 2 - 1));
  }

  onNewGameClick() {
    this.playerTeam = new Team();
    this.enemyTeam = new Team();
    this.enemyCharacters = [Daemon, Undead, Vampire];
    this.playerCharacters = [Bowman, Swordsman, Magician];
    this.gameState.selected = null;
    this.gameState.level = 0;
    this.gameState.points = 0;
    this.gameState.allPositions = [];
    this.gameState.isUsersTurn = true;

    this.gamePlay.drawUi(Object.values(themes)[this.gameState.level]);
    this.playerTeam.addAll(generateTeam([Bowman, Swordsman], 1, 2));
    this.enemyTeam.addAll(generateTeam(this.enemyCharacters, 1, 2));
    this.teamsPosition(this.playerTeam, this.playerPositions());
    this.teamsPosition(this.enemyTeam, this.enemyPositions());
    this.gamePlay.redrawPositions(this.gameState.allPositions);
    GamePlay.showMessage(`Level ${this.gameState.level + 1}`);
  }

  onSaveGameClick() {
    this.stateService.save(GameState.from(this.gameState));
    GamePlay.showMessage('Game saved');
  }

  onLoadGameClick() {
    GamePlay.showMessage('Loading game..');
    const load = this.stateService.load();
    if (!load) {
      GamePlay.showError('Error');
    }
    this.gameState.isUsersTurn = load.isUsersTurn;
    this.gameState.level = load.level;
    this.gameState.allPositions = [];
    this.gameState.points = load.points;
    this.gameState.statistics = load.statistics;
    this.gameState.selected = load.selected;
    this.playerTeam = new Team();
    this.enemyTeam = new Team();
    load.allPositions.forEach((elem) => {
      let char;
      switch (elem.character.type) {
        case 'swordsman':
          char = new Swordsman(elem.character.level);
          this.playerTeam.addAll([char]);
          break;
        case 'bowman':
          char = new Bowman(elem.character.level);
          this.playerTeam.addAll([char]);
          break;
        case 'magician':
          char = new Magician(elem.character.level);
          this.playerTeam.addAll([char]);
          break;
        case 'undead':
          char = new Undead(elem.character.level);
          this.enemyTeam.addAll([char]);
          break;
        case 'vampire':
          char = new Vampire(elem.character.level);
          this.enemyTeam.addAll([char]);
          break;
        case 'daemon':
          char = new Daemon(elem.character.level);
          this.enemyTeam.addAll([char]);
          break;
      }
      char.health = elem.character.health;
      this.gameState.allPositions.push(new PositionedCharacter(char, elem.position));
    });
    this.gamePlay.drawUi(Object.values(themes)[this.gameState.level]);
    this.gamePlay.redrawPositions(this.gameState.allPositions);
  }
}
