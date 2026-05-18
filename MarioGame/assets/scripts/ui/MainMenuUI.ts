import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';
import FirebaseManager from '../managers/FirebaseManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class MainMenuUI extends cc.Component {

    @property(cc.Node)
    loginPanel: cc.Node = null;

    @property(cc.EditBox)
    emailInput: cc.EditBox = null;

    @property(cc.EditBox)
    passwordInput: cc.EditBox = null;

    @property(cc.EditBox)
    nameInput: cc.EditBox = null;

    @property(cc.Label)
    statusLabel: cc.Label = null;

    @property(cc.Label)
    userLabel: cc.Label = null;

    private isRegisterMode: boolean = false;

    // ── lifecycle ─────────────────────────────────────────────────────────────

    async start() {
        AudioManager.playBGM(AudioManager.I?.bgm1);
        FirebaseManager.onAuthChanged = (user) => this.onAuthChanged(user);
        await FirebaseManager.init();
    }

    // ── 登入狀態：已登入就直接跳選關 ────────────────────────────────────────

    private onAuthChanged(user: any) {
        if (user) {
            const name = user.displayName || user.email || '玩家';
            if (this.userLabel) this.userLabel.string = '歡迎，' + name + '！';
            GameManager.startNewGame();
            this.scheduleOnce(() => cc.director.loadScene('LevelSelect'), 0.5);
        } else {
            if (this.userLabel) this.userLabel.string = '請登入後開始遊戲';
            if (this.loginPanel) this.loginPanel.active = false;
        }
    }

    // ── Button callbacks ──────────────────────────────────────────────────────

    onShowLoginClicked() {
        if (this.loginPanel) this.loginPanel.active = true;
        this.isRegisterMode = false;
        this.clearStatus();
        this.updatePanelMode();
    }

    onShowSignUpClicked() {
        if (this.loginPanel) this.loginPanel.active = true;
        this.isRegisterMode = true;
        this.clearStatus();
        this.updatePanelMode();
    }

    onCloseLoginClicked() {
        if (this.loginPanel) this.loginPanel.active = false;
    }

    async onEnterClicked() {
        const email = this.emailInput?.string.trim() || '';
        const pass  = this.passwordInput?.string      || '';

        if (this.isRegisterMode) {
            const name = this.nameInput?.string.trim() || '';
            if (!email || !pass || !name) { this.setStatus('請填寫所有欄位'); return; }
            this.setStatus('註冊中...');
            const err = await FirebaseManager.signUp(email, pass, name);
            if (err) { this.setStatus(err); return; }
            // 註冊成功 → 自動登入 → onAuthChanged 會跳場景
        } else {
            if (!email || !pass) { this.setStatus('請填寫 Email 和密碼'); return; }
            this.setStatus('登入中...');
            const err = await FirebaseManager.signIn(email, pass);
            if (err) { this.setStatus(err); return; }
            // 登入成功 → onAuthChanged 會跳場景
        }
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private updatePanelMode() {
        if (this.nameInput) this.nameInput.node.active = this.isRegisterMode;
    }

    private setStatus(msg: string) {
        if (this.statusLabel) this.statusLabel.string = msg;
    }

    private clearStatus() {
        this.setStatus('');
        if (this.emailInput)    this.emailInput.string    = '';
        if (this.passwordInput) this.passwordInput.string = '';
        if (this.nameInput)     this.nameInput.string     = '';
    }
}
