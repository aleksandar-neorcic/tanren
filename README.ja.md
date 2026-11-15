<p align="center"><img src="docs/design/brand/logo-512.png" alt="Tanren logo" width="160"></p>

# Tanren（鍛錬）

[![Pipeline](https://github.com/aleksandar-neorcic/tanren/actions/workflows/pipeline.yml/badge.svg)](https://github.com/aleksandar-neorcic/tanren/actions/workflows/pipeline.yml)

English version → [README.md](README.md)

**ジムで実際に使うために作ったトレーニング記録アプリです。** セットの合間にスマートフォンで
1 種目ずつ記録し、履歴・テンプレート・種目ライブラリは PC で確認します。レスポンシブな React
アプリ 1 つと、NestJS + Prisma の API で構成しています。

Tanren（鍛錬）は、反復によって鍛えることを意味します。

<p align="center">
  <img src="docs/demo/session.gif" width="31%" alt="スマートフォンでのセット記録。重量とレップ数の大きなステッパーに、前回の数値があらかじめ入っている">
  <img src="docs/demo/templates.gif" width="31%" alt="ワークアウトのテンプレート作成。項目ごとの目標値とバリデーション">
  <img src="docs/demo/exercises.gif" width="31%" alt="種目ライブラリ。検索、部位フィルター、新規作成とアーカイブ">
</p>

<p align="center">
  <img src="docs/demo/desktop-tour.gif" width="92%" alt="同じアプリの PC 表示。サイドバーレイアウト">
</p>

<p align="center"><a href="docs/demo/tanren-full-tour.mp4">▶ 90 秒のフルツアー（MP4）</a></p>

## できること

1. **種目**と**ワークアウトのテンプレート**を作成する
2. テンプレートから**セッションを開始する** — 各セットに前回挙げた重量とレップ数が入力済み
3. 1 種目ずつ**セットを記録する**（重量 × レップ数）。親指で押しやすいステッパーを使用
4. **履歴を振り返る** — 新しい順に、セット数と総ボリュームつきで表示

## このプロジェクトの進め方

Tanren は React と NestJS を学ぶために作っています。ありがちなデモ用のアプリではなく、自分が実際に
使うものを作りたかったので、自分で使う予定のジムアプリを選びました。今後も開発を続けていきます。

私は Angular 出身で、React と NestJS はどちらも今回が初めてです。学習を早めるため、最初の
ベースラインは Claude Code に生成してもらいました。ドキュメントだけを頼りに始めるのではなく、
React と Nest では一般的にどう書くのかを示す動く実例を手元に置きたかったからです。これは数年前に
Angular を学んだときと同じやり方です。当時はあるプロジェクトのバックエンドを担当していましたが、
フロントエンドの担当者が退職したため、そのプロジェクトに既にあったフロントエンドのコードから
Angular を学びました。

その後は、実務と同じ進め方をしました。自分で機能を実装して Claude にレビューしてもらうか、
Claude とペアプログラミングをしながら、そのコードを確認し、理解できない点は納得できるまで質問
しました。重点は React と Nest を身につけることに置いていたため、コミットメッセージの作成は Claude に任せ、
この README も Claude に手伝ってもらいました。

## 注目してほしい設計判断

いずれも、素直に実装すると間違えやすい箇所です。

- **現在の種目は保持せず、常に導出します。** サーバー側が持つフラグに対して
  `findIndex((e) => !e.done)` を実行します。`useState` に複製を持たせると信頼できる情報源が
  2 つになり、互いに食い違う可能性があります。
  [`useSessionScreen.ts`](apps/web/src/pages/Session/hooks/useSessionScreen.ts)
- **状態のリセットは `key` で行います。** `useState(initial)` は初回レンダリング時しか引数を
  読まないため、props を変更してもステッパーはリセットされませんが、`key` を変えればリセット
  されます。画面はセッションの ID、ステッパーはセットの ID を `key` にしています。
- **セットの削除は、種目を終えたことを意味しません。**「Done set」をタップするのは「終わった」
  という意思表示であり、未記録のセットを削除するのは単なる調整です。この 2 つを同一視すると、
  終えたつもりのない種目から次へ進んでしまい、誤タップだった場合に戻る手段がなくなります。
- **± の値は、確定するまで画面内に保持します。** 82.5 kg にするまでに 3 タップかかります。
  まだ確定していない数値のために PATCH を 3 回送ることは、ジムの不安定な Wi-Fi で失敗する機会を
  3 回つくることと同じです。
- **対象データへ向かう遷移では遷移の前に、対象から離れる遷移では遷移の後にキャッシュを無効化
  します。** 削除時は `exact: true` を指定します。前方一致での無効化では、サーバーが削除した
  ばかりの行を再取得してしまうためです。
- **種目はアーカイブ、テンプレートは削除です。** `Exercise` を参照する外部キーはいずれも
  cascade 指定のため、種目を削除すると紐づく `SetLog`、つまり記録済みのワークアウトまで消えて
  しまいます。`WorkoutSession.template` は `onDelete: SetNull` なので、テンプレートを削除しても
  履歴はそのまま残ります。
  [`schema.prisma`](apps/api/prisma/schema.prisma)

検討して採用しなかった案を含む、より詳しい記録はこちらです： [`CLAUDE.md`](CLAUDE.md) ·
[`docs/conventions.md`](docs/conventions.md) · [`docs/decisions.md`](docs/decisions.md)

## 技術スタック

- `apps/web` — React 19、TypeScript 6、Vite 8、Tailwind v4、TanStack Query 5、
  react-hook-form 7 + Zod 4、react-router 8
- `apps/api` — NestJS 12、Prisma 6、SQLite、class-validator
- Node 22（`.nvmrc` を参照）、npm、ワークスペース管理ツールを意図的に使わないモノレポ構成

## 動かし方

```bash
git clone git@github.com:aleksandar-neorcic/tanren.git
cd tanren
nvm use   # Node 22

# API
cd apps/api
cp .env.example .env
npm install --legacy-peer-deps
npx prisma migrate dev
npm run seed        # 初期データ：種目、Push/Pull/Legs のテンプレート、過去 12 セッション
npm run start:dev

# Web（別のターミナルで）
cd apps/web
npm install
npm run dev
```

- Web: http://localhost:5173 （LAN にも公開しているため、スマートフォンからも開けます）
- API: http://localhost:3000

シードの実行をおすすめします。もっともらしい 5 週間分の履歴が入るため、アプリを開いた時点で
見るものがある状態になります。`Math.random()` は一切使っていないので、同じコマンドを 2 回実行
すれば同じデータベースになります。

### テスト

```bash
cd apps/api
npm run test:e2e
```

supertest で実際の HTTP API を呼び出す E2E テストが 8 件あり、この README が述べている挙動を
検証します。`activeSessionId` を含む `409`、`finish` が冪等であること、直近の完了セッションから
の自動入力とテンプレートの目標値へのフォールバック、`setCount` と `volume` が `done` のセット
だけを数えること、そして `DELETE /exercises/:id` が記録済みのセットを巻き込まずに種目をアーカイブ
することです。

テストは専用の SQLite ファイル（`prisma/test.db`）を使い、実行開始時にスキーマから作成するため、
開発用のデータに触れることはありません。各テストの前にテーブルを空にするので、実行順序が結果を
変えることもありません。

## 画面

| ルート | ナビゲーション | 内容 |
| --- | --- | --- |
| `/` | タブ / サイドバー | スタート：実施中セッションのバナー（経過時間つき）、テンプレートのカード、最終実施日 |
| `/session/:id` | **なし** | 記録画面。1 種目ずつ表示し、トレーニング中に誤タップするタブバーを置かない |
| `/history` | タブ / サイドバー | セッションを新しい順に表示。直近 7 日間の集計つきで、実施中の行もそのまま残す |
| `/templates` `/templates/:id` | タブ / サイドバー | テンプレートの一覧と編集画面（ネストした配列、フィールド単位のバリデーション） |
| `/exercises` | タブ / サイドバー | 種目ライブラリ。クライアント側の検索、部位フィルター、アーカイブと復元 |

- ネットワーク呼び出しはすべて [`src/api/client.ts`](apps/web/src/api/client.ts) を経由します。
  [`src/api/endpoints.ts`](apps/web/src/api/endpoints.ts) には、後述の API 表の 1 行につき
  1 つの関数があります。
- 読み取りは **TanStack Query** で行い、クエリキーを階層化しているため、
  `invalidateQueries(['sessions'])` 1 回でセッション関連のすべての画面に効きます。
- `/session/:id` はレイアウトルートの子ではなく**兄弟**です。どの画面にナビゲーションを表示する
  かは、レイアウト内の条件分岐ではなくルート定義が決めます。
- 各画面は機能ごとのフォルダ（`pages/<Feature>/index.tsx` + `components/` + `hooks/`）に
  まとめています。Session も同様で、以前は 590 行の 1 ファイルでしたが、状態を
  `useSessionScreen` に移し、各ブロックをコンポーネントに切り出しました。
- Session だけは Query のフックではなく、当初の React Router の loader で読み込んでいます。
  ワークアウトの完了時と破棄時に `['sessions']` を無効化するブリッジを置いています。これは
  意図的な判断です。現状で問題なく動いており、移行の完了を公開後に回すことは、見落としではなく
  判断だからです。

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | liveness |
| GET/POST | `/exercises` | list (`?includeArchived=true`) / create |
| GET/PATCH/DELETE | `/exercises/:id` | read / update / archive |
| GET/POST | `/templates` | list with exercises / create |
| GET/PUT/DELETE | `/templates/:id` | read / replace / delete |
| GET | `/sessions?limit=50` | history, newest first, with set count + volume |
| GET | `/sessions/active` | the unfinished session or `null` |
| POST | `/sessions` | start `{ templateId?, name? }` — sets prefilled from last time |
| GET/PATCH/DELETE | `/sessions/:id` | read / rename+notes / delete |
| POST | `/sessions/:id/finish` | mark finished |
| POST | `/sessions/:id/exercises` | add `{ exerciseId }` mid-session |
| PATCH/DELETE | `/session-exercises/:id` | `{ done }` / remove |
| POST | `/session-exercises/:id/sets` | append a set (copies the previous one) |
| PATCH/DELETE | `/sets/:id` | `{ weight, reps, done }` / remove |

セッションに対する更新系のリクエストは、更新後のセッション全体を返します。そのため、スマート
フォン側で差分をローカルの状態にマージする必要がありません。

- 未完了のセッションは同時に 1 つだけです。2 つ目を開始しようとすると `activeSessionId` を含む
  `409` が返るため、クライアントは実施中のセッションへそのまま遷移できます。
- `POST /sessions/:id/finish` は冪等です。ジムの電波が悪く再送された場合でも、`finishedAt` を
  上書きせず、そのままのセッションを返します。
- 開始時の自動入力：セット数はテンプレートの `targetSets` から、重量とレップ数はその種目を最後に
  実施した完了済みセッションから取得します。履歴がない場合はテンプレートの目標値を使います。
- 履歴一覧の `setCount` と `volume` は、`done` が付いたセットだけを数えます。

```bash
curl -X POST localhost:3000/sessions -H "Content-Type: application/json" -d '{"templateId":"..."}'
curl -X PATCH localhost:3000/sets/SET_ID -H "Content-Type: application/json" -d '{"weight":80,"reps":8,"done":true}'
```

## デザイン

[`docs/design/`](docs/design) がデザイン仕様です。黒とグレーを基調に、アクセントカラーはライム
1 色。Session v1 の記録画面、スマートフォンではフローティングのピル型タブバー、PC では
サイドバーという構成です。モックアップとの差異はいずれも意図的なもので、暗黙のうちに変えるので
はなく `CLAUDE.md` に記録しています。

## 補足

- `.env` と `*.db` は決してコミットしません
