/**
 * FirebaseManager — wraps Firebase Auth + Firestore (compat SDK v8)
 *
 * Uses dynamic script loading so it works in both CC editor preview
 * and production build (no npm / webpack needed).
 */

declare var firebase: any;   // loaded at runtime via CDN

const FB_CDN = 'https://www.gstatic.com/firebasejs/8.10.1/';

const FIREBASE_CONFIG = {
    apiKey:            'AIzaSyABQepniHoAiknCE_nZeGVHI2p85DOJRUY',
    authDomain:        'web-mario-113033158.firebaseapp.com',
    projectId:         'web-mario-113033158',
    storageBucket:     'web-mario-113033158.firebasestorage.app',
    messagingSenderId: '818560126006',
    appId:             '1:818560126006:web:a55341eda30a3758de9c97',
};

export default class FirebaseManager {

    static isReady:    boolean = false;
    static currentUser: any   = null;

    // UI 可以掛 callback 來更新登入狀態顯示
    static onAuthChanged: ((user: any) => void) | null = null;

    // ── 初始化（在 MainMenu start() 呼叫一次）─────────────────────────────────

    static async init(): Promise<void> {
        if (this.isReady) return;
        try {
            await this.loadScripts();
            const fb = (window as any).firebase;
            if (!fb.apps.length) fb.initializeApp(FIREBASE_CONFIG);

            fb.auth().onAuthStateChanged((user: any) => {
                this.currentUser = user;
                if (this.onAuthChanged) this.onAuthChanged(user);
            });

            this.isReady = true;
            cc.log('[Firebase] ready');
        } catch (e) {
            cc.error('[Firebase] init failed:', e);
        }
    }

    // ── Auth ──────────────────────────────────────────────────────────────────

    /** 註冊新帳號，回傳錯誤訊息（成功回傳 null）*/
    static async signUp(email: string, password: string, name: string): Promise<string | null> {
        if (!this.isReady) return '服務載入中，請稍後再試';
        try {
            const fb   = (window as any).firebase;
            const cred = await fb.auth().createUserWithEmailAndPassword(email, password);
            await cred.user.updateProfile({ displayName: name });
            await fb.firestore().collection('users').doc(cred.user.uid).set({
                displayName: name,
                email,
                bestScore: 0,
            });
            return null;
        } catch (e: any) {
            cc.error('[Firebase] signUp error:', e);
            return this.friendlyError(e?.code);
        }
    }

    /** 登入，回傳錯誤訊息（成功回傳 null）*/
    static async signIn(email: string, password: string): Promise<string | null> {
        if (!this.isReady) return '服務載入中，請稍後再試';
        try {
            await (window as any).firebase.auth().signInWithEmailAndPassword(email, password);
            return null;
        } catch (e: any) {
            cc.error('[Firebase] signIn error:', e);
            return this.friendlyError(e?.code);
        }
    }

    static signOut(): void {
        (window as any).firebase?.auth().signOut();
    }

    // ── Firestore ─────────────────────────────────────────────────────────────

    /** 過關後上傳分數（只有登入且分數比舊的高才寫入）*/
    static async uploadScore(score: number): Promise<void> {
        if (!this.currentUser || !this.isReady) return;
        try {
            const fb  = (window as any).firebase;
            const uid = this.currentUser.uid;
            const db  = fb.firestore();

            // users/{uid} best score
            const userRef  = db.collection('users').doc(uid);
            const userSnap = await userRef.get();
            const best     = userSnap.exists ? (userSnap.data().bestScore || 0) : 0;
            if (score > best) {
                await userRef.set({ bestScore: score }, { merge: true });
            }

            // leaderboard/{uid}
            const lbRef  = db.collection('leaderboard').doc(uid);
            const lbSnap = await lbRef.get();
            const lbBest = lbSnap.exists ? (lbSnap.data().score || 0) : 0;
            if (score > lbBest) {
                await lbRef.set({
                    name:      this.currentUser.displayName || this.currentUser.email,
                    score,
                    updatedAt: fb.firestore.FieldValue.serverTimestamp(),
                });
            }
            cc.log('[Firebase] score uploaded:', score);
        } catch (e) {
            cc.error('[Firebase] uploadScore error:', e);
        }
    }

    /** 取得當前使用者的最佳分數 */
    static async getBestScore(): Promise<number> {
        if (!this.currentUser || !this.isReady) return 0;
        try {
            const db  = (window as any).firebase.firestore();
            const doc = await db.collection('users').doc(this.currentUser.uid).get();
            return doc.exists ? (doc.data().bestScore || 0) : 0;
        } catch (e) {
            return 0;
        }
    }

    /** 取得前 10 名排行榜 */
    static async getLeaderboard(): Promise<Array<{ rank: number; name: string; score: number }>> {
        if (!this.isReady) return [];
        try {
            const db   = (window as any).firebase.firestore();
            const snap = await db.collection('leaderboard')
                .orderBy('score', 'desc')
                .limit(10)
                .get();
            return snap.docs.map((d: any, i: number) => ({
                rank:  i + 1,
                name:  d.data().name  || 'Unknown',
                score: d.data().score || 0,
            }));
        } catch (e) {
            cc.error('[Firebase] getLeaderboard error:', e);
            return [];
        }
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private static loadScripts(): Promise<void[]> {
        const urls = [
            FB_CDN + 'firebase-app.js',
            FB_CDN + 'firebase-auth.js',
            FB_CDN + 'firebase-firestore.js',
        ];
        return Promise.all(urls.map(url => this.loadScript(url)));
    }

    private static loadScript(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
            const s   = document.createElement('script');
            s.src     = url;
            s.onload  = () => resolve();
            s.onerror = () => reject(new Error('Failed to load: ' + url));
            document.head.appendChild(s);
        });
    }

    private static friendlyError(code: string | undefined): string {
        if (!code) return '發生未知錯誤，請重試';
        const map: { [k: string]: string } = {
            'auth/email-already-in-use':  '此 Email 已被使用',
            'auth/invalid-email':         'Email 格式錯誤',
            'auth/weak-password':         '密碼至少需要 6 個字元',
            'auth/user-not-found':        'Email 不存在',
            'auth/wrong-password':        '密碼錯誤',
            'auth/invalid-credential':    'Email 或密碼錯誤',
            'auth/too-many-requests':     '嘗試次數過多，請稍後再試',
        };
        return map[code] || '發生錯誤：' + code;
    }
}
