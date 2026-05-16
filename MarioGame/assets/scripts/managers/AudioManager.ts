const { ccclass, property } = cc._decorator;

@ccclass
export default class AudioManager extends cc.Component {

    static instance: AudioManager = null;

    @property(cc.AudioClip) bgm1: cc.AudioClip = null;   // MainMenu + LevelSelect
    @property(cc.AudioClip) bgm2: cc.AudioClip = null;   // Level 1
    @property(cc.AudioClip) bgm3: cc.AudioClip = null;   // Level 2

    @property(cc.AudioClip) sfxJump:           cc.AudioClip = null;
    @property(cc.AudioClip) sfxStomp:          cc.AudioClip = null;
    @property(cc.AudioClip) sfxDie:            cc.AudioClip = null;
    @property(cc.AudioClip) sfxGameOver:       cc.AudioClip = null;
    @property(cc.AudioClip) sfxPowerUp:        cc.AudioClip = null;
    @property(cc.AudioClip) sfxPowerDown:      cc.AudioClip = null;
    @property(cc.AudioClip) sfxPowerUpAppear:  cc.AudioClip = null;
    @property(cc.AudioClip) sfxLevelClear:     cc.AudioClip = null;
    @property(cc.AudioClip) sfxKick:           cc.AudioClip = null;

    private bgmId:   number = -1;
    private bgmClip: cc.AudioClip = null;

    onLoad() {
        if (AudioManager.instance) {
            this.node.destroy();
            return;
        }
        AudioManager.instance = this;
        cc.game.addPersistRootNode(this.node);
    }

    // ── BGM ──────────────────────────────────────────────────────────────────

    static playBGM(clip: cc.AudioClip) {
        const am = AudioManager.instance;
        if (!am || !clip) return;
        if (am.bgmClip === clip) return;   // already playing, skip restart
        if (am.bgmId !== -1) cc.audioEngine.stop(am.bgmId);
        am.bgmId   = cc.audioEngine.play(clip, true, 0.7);
        am.bgmClip = clip;
    }

    static stopBGM() {
        const am = AudioManager.instance;
        if (!am || am.bgmId === -1) return;
        cc.audioEngine.stop(am.bgmId);
        am.bgmId   = -1;
        am.bgmClip = null;
    }

    // ── SFX ──────────────────────────────────────────────────────────────────

    static playSFX(clip: cc.AudioClip) {
        if (!AudioManager.instance || !clip) return;
        cc.audioEngine.play(clip, false, 1);
    }

    // ── Convenience getters (used by other scripts) ───────────────────────────

    static get I(): AudioManager { return AudioManager.instance; }
}
