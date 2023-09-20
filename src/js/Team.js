/**
 * Класс, представляющий персонажей команды
 *
 * @todo Самостоятельно продумайте хранение персонажей в классе
 * Например
 * @example
 * ```js
 * const characters = [new Swordsman(2), new Bowman(1)]
 * const team = new Team(characters);
 *
 * team.characters // [swordsman, bowman]
 * ```
 * */
export default class Team {
  constructor() {
    this.characters = new Set();
  }

  add(character) {
    if (this.characters.has(character)) {
      throw new Error('Такой персонаж уже eсть в команде');
    }
    this.characters.add(character);
  }

  addAll(characters) {
    this.characters = new Set([...this.characters, ...characters]);
  }

  delete(character) {
    this.characters.delete(character);
  }

  toArray() {
    return [...this.characters];
  }

  * [Symbol.iterator]() {
    for (const character of this.characters) {
      yield character;
    }
  }
}
