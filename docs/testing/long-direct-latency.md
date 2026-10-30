# 長文・IMEなしの入力遅延の再現と計測

2026-10-31、東ティモールの長文を使い、中央揃えで2個目以降が重くなる問題を再現した。前後の長文を毎回文字単位で描き直していたことに加え、現在位置の測定で transform を解除・復元してレイアウト計算を繰り返していた。

固定された前後の文章を文字列のまとまりで描画し、React要素を再利用する。長文本文も入力位置が変わる単位で更新する。中央位置は既存の移動量を差し引いて求め、測定中にスタイルを書き換えない。

再現スクリプトはBunでfixtureをメモリー上に構築し、Node経由でPlaywrightを操作する。開発サーバーは使わず、通信はローカルのroute fulfillmentで完結する。Playwrightがプロジェクト外にある場合は `ULTITYPE_PLAYWRIGHT_MODULE` にそのモジュールパスを指定する。必要なら `PLAYWRIGHT_BROWSERS_PATH` と `ULTITYPE_NODE_EXECUTABLE` も指定できる。

```powershell
bun scripts/verify-long-direct-performance.ts src/lib/challenge-data/themes/travel-tl-production.txt --baseline-ref=bd9f13e5
bun scripts/verify-long-direct-performance.ts src/lib/challenge-data/themes/travel-tl-production.txt
```

課題文は作成中のため、この修正のコミットには含めていない。入力ファイルは5課題以上を含む任意の既存の長文課題ファイルに差し替えられる。

同じChromium、1225×950のviewport、既定の文字サイズとOSのsans-serifで先頭3課題を各40サンプル計測した。計測した課題ファイルのSHA-256は `7847a20f98e17d6dc25c4855256ee8cf294a1932f21357f08ec70bc4d2bc389a`。

| 2個目の長文・中央揃え | bd9f13e5 | 修正後 |
| --- | ---: | ---: |
| 入力描画 p50 | 30.5 ms | 7.7 ms |
| 入力描画 p95 | 70.9 ms | 19.8 ms |
| 次の長文への切り替え | 97.9 ms | 32.6 ms |
| 切り替え中のDOM要素数 | 6,171 | 2,377 |

スクリプトは中央揃えと分割表示の両方で現在・次の課題、入力・かなマーカーの一意性を確認する。中央位置は通常表示に加え、設定プレビュー相当の0.6倍の縮小でも検証する。時間には環境差があるため、固定の速度閾値は設けていない。
