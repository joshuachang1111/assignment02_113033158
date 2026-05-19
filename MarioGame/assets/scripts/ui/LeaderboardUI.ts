import FirebaseManager from '../managers/FirebaseManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class LeaderboardUI extends cc.Component {

    // 10 行容器，每行內需有子節點：RankLabel / NameLabel / ScoreLabel
    @property([cc.Node])
    rows: cc.Node[] = [];

    @property(cc.Label)
    statusLabel: cc.Label = null;   // 顯示「載入中...」或「暫無排行資料」

    // ── lifecycle ─────────────────────────────────────────────────────────────

    onLoad() {
        this.node.active = false;
    }

    // ── public ────────────────────────────────────────────────────────────────

    async show() {
        this.node.active = true;

        // 先隱藏所有行，顯示載入中
        this.rows.forEach(r => { if (r) r.active = false; });
        if (this.statusLabel) {
            this.statusLabel.node.active = true;
            this.statusLabel.string = '載入中...';
        }

        // 加 5 秒 timeout 防止永遠卡在載入中
        type LBEntry = { rank: number; name: string; score: number };
        const timeout = new Promise<LBEntry[]>(resolve => setTimeout(() => resolve([]), 5000));
        const data = await Promise.race([FirebaseManager.getLeaderboard(), timeout]);

        if (!this.node.active) return; // 已被關閉

        if (data.length === 0) {
            if (this.statusLabel) {
                this.statusLabel.node.active = true;
                this.statusLabel.string = '暫無排行資料';
            }
            return;
        }

        if (this.statusLabel) this.statusLabel.node.active = false;

        data.forEach((entry, i) => {
            if (i >= this.rows.length || !this.rows[i]) return;
            const row = this.rows[i];
            row.active = true;

            const rankLbl  = row.getChildByName('RankLabel');
            const nameLbl  = row.getChildByName('NameLabel');
            const scoreLbl = row.getChildByName('ScoreLabel');

            if (rankLbl)  rankLbl.getComponent(cc.Label).string  = '#' + entry.rank;
            if (nameLbl)  nameLbl.getComponent(cc.Label).string  = entry.name;
            if (scoreLbl) scoreLbl.getComponent(cc.Label).string = String(entry.score).padStart(7, '0');
        });
    }

    onCloseClicked() {
        this.node.active = false;
    }
}
