/* eslint-disable max-len */
/* eslint-disable new-cap */

/**
 * Формирует экземпляр персонажа из массива allowedTypes со
 * случайным уровнем от 1 до maxLevel
 *
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @returns генератор, который при каждом вызове
 * возвращает новый экземпляр класса персонажа
 *
 */
export function* characterGenerator(allowedTypes, maxLevel) {
  while (true) {
    const characterType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    const characterLevel = Math.ceil(Math.random() * maxLevel);
    yield new characterType(characterLevel);
  }
}

/**
 * Формирует массив персонажей на основе characterGenerator
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @param characterCount количество персонажей, которое нужно сформировать
 * @returns экземпляр Team, хранящий экземпляры персонажей. Количество персонажей в команде - characterCount
 * */
export function generateTeam(allowedTypes, maxLevel, characterCount) {
  const team = [];
  const characters = characterGenerator(allowedTypes, maxLevel);

  while (team.length < characterCount) {
    team.push(characters.next().value);
  }

  return team;
}
