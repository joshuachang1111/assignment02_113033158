export default class GameManager {

    static lives:        number = 3;
    static score:        number = 0;
    static timer:        number = 300;
    static currentLevel: number = 1;

    // Persists across games — never reset by startNewGame
    static highScore:    number = 0;
    static coins:        number = 0;

    // Firebase 累計總分（每次進 LevelSelect 時從 Firebase 拉取）
    // displayScore = baseScore + score（本局得分）
    static baseScore:    number = 0;

    // Set to true by LevelClearUI to freeze the timer and prevent timer-based death
    static levelCleared: boolean = false;

    // GameOverUI registers this; Player calls loseLife() without importing GameOverUI
    static onLoseLife:   ((livesLeft: number) => void) | null = null;
    // LevelClearUI registers this; Flagpole calls it without importing LevelClearUI
    static onLevelClear: (() => void) | null = null;

    static startNewGame() {
        GameManager.lives = 3;
        GameManager.score = 0;
        GameManager.timer = 300;
        GameManager.levelCleared = false;
        GameManager.onLoseLife   = null;
        GameManager.onLevelClear = null;
        // highScore and coins intentionally not reset
    }

    static resetTimer() {
        GameManager.timer = 300;
    }

    static addScore(n: number) {
        GameManager.score += n;
        const total = GameManager.baseScore + GameManager.score;
        if (total > GameManager.highScore) {
            GameManager.highScore = total;
        }
    }

    static addCoins(n: number) {
        GameManager.coins += n;
    }

    static loseLife() {
        GameManager.lives--;
        if (GameManager.onLoseLife) GameManager.onLoseLife(GameManager.lives);
    }
}
