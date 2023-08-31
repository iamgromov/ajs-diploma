import PositionedCharacter from './PositionedCharacter';
import Team from './Team';

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

  for (let i = 1; i <= characterCount; i += 1) {
    const character = characterGenerator(allowedTypes, maxLevel).next().value;
    team.push(character);
  }

  return new Team(team);
}

export function createPosition(player) {
  const playerPosition = [];
  const enemyPosition = [];
  document.querySelectorAll('.cell').forEach((elem, index) => {
    const topLeft = elem.classList.contains('map-tile-top-left');
    const left = elem.classList.contains('map-tile-left');
    const bottomLeft = elem.classList.contains('map-tile-bottom-left');
    const topRight = elem.classList.contains('map-tile-top-right');
    const right = elem.classList.contains('map-tile-right');
    const bottomRight = elem.classList.contains('map-tile-bottom-right');

    if (topLeft || left || bottomLeft) {
      playerPosition.push(index, index + 1);
    } else if (topRight || right || bottomRight) {
      enemyPosition.push(index, index - 1);
    }
  });

  if (player !== 'enemy') {
    return playerPosition[Math.floor(Math.random() * playerPosition.length)];
  }
  return enemyPosition[Math.floor(Math.random() * enemyPosition.length)];
}

export function generatePositions(team, player) {
  const positionArr = [];
  const characterArr = [];

  while (positionArr.length < team.length) {
    const position = createPosition(player);
    if (!positionArr.includes(position)) {
      characterArr.push(new PositionedCharacter(team[positionArr.length], position));
      positionArr.push(position);
    }
  }
  return characterArr;
}
