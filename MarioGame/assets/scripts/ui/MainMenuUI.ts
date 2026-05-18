import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';
import FirebaseManager from '../managers/FirebaseManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class MainMenuUI extends cc.Component {

    // ── 登入面板（預設隱藏）────────────────────────────────────────────────
    @property(cc.Node)
    loginPanel: cc.Node = null;

    @property(cc.EditBox)
    emailInput: cc.EditBox = null;

    @property(cc.EditBox)
    passwordInput: cc.EditBox = null;

    @property(cc.EditBox)
    nameInput: cc.EditBox = null;     // 只有「註冊」時需要填

    @property(cc.Label)
    statusLabel: cc.Label = null;     // 顯示錯誤/成功訊息

    @property(cc.Label)
    userLabel: cc.Label = null;       // 顯示「已登入：xxx」

    @property(cc.Node)
    logoutButton: cc.Node = null;     // 登出按鈕（登入後才顯示）

    @property(cc.Node)
    loginButton: cc.Node = null;      // 顯示登入面板的按鈕（未登入時顯示）

    private isRegisterMode: boolean = false;

    // ── lifecycle ─────────────────────────────────────────────────────────────

    async start() {
        AudioManager.playBGM(AudioManager.I?.bgm1);

        // Firebase 初始化（非同步，但不阻塞遊戲）
        FirebaseManager.onAuthChanged = (user) => this.onAuthChanged(user);
        await FirebaseManager.init();
    }

    // ── 登入狀態改變 ──────────────────────────────────────────────────────────

    private onAuthChanged(user: any) {
        if (user) {
            const name = user.displayName || user.email;
            if (this.userLabel)   this.userLabel.string = '已登入：' + name;
            if (this.loginButton) this.loginButton.active = false;
            if (this.logoutButton) this.logoutButton.active = true;
            if (this.loginPanel)  this.loginPanel.active = false;
        } else {
            if (this.userLabel)   this.userLabel.string = '未登入（訪客模式）';
            if (this.loginButton) this.loginButton.active = true;
            if (this.logoutButton) this.logoutButton.active = false;
        }
    }

    // ── Button callbacks ──────────────────────────────────────────────────────

    onStartClicked() {
        GameManager.startNewGame();
        GameManager.currentLevel = 1;
        cc.director.loadScene('LevelSelect');
    }

    onShowLoginClicked() {
        if (this.loginPanel) this.loginPanel.active = true;
        this.isRegisterMode = false;
        this.clearStatus();
        this.updatePanelMode();
    }

    onCloseLoginClicked() {
        if (this.loginPanel) this.loginPanel.active = false;
    }

    /** 切換登入 / 註冊模式 */
    onToggleModeClicked() {
        this.isRegisterMode = !this.isRegisterMode;
        this.clearStatus();
        this.updatePanelMode();
    }

    async onLoginClicked() {
        const email = this.emailInput?.string.trim() || '';
        const pass  = this.passwordInput?.string || '';
        if (!email || !pass) { this.setStatus('請填寫 Email 和密碼'); return; }

        this.setStatus('登入中...');
        const err = await FirebaseManager.signIn(email, pass);
        if (err) { this.setStatus(err); } else { this.setStatus(''); }
    }

    async onRegisterClicked() {
        const email = this.emailInput?.string.trim()    || '';
        const pass  = this.passwordInput?.string         || '';
        const name  = this.nameInput?.string.trim()      || '';
        if (!email || !pass || !name) { this.setStatus('請填寫所有欄位'); return; }

        this.setStatus('註冊中...');
        const err = await FirebaseManager.signUp(email, pass, name);
        if (err) { this.setStatus(err); } else { this.setStatus('註冊成功！'); }
    }

    onLogoutClicked() {
        FirebaseManager.signOut();
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private updatePanelMode() {
        // nameInput 只在註冊模式顯示
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
