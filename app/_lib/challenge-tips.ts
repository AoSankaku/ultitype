export const preSessionTips = [
  "本番モードは開始後の入力だけを採点します。",
  "本番モードは仮レーティング A0 以上で解放されます。",
  "IMEあり本番では行を課題と一致させてから Enter で提出します。",
  "500点未満は NR、500点以上は G0、以降は90点ごとにランクが上がります。",
  "練習モードの仮レーティングは、本番モード解放の条件として使われます。",
  "次の課題プレビューは設定画面で表示方式と長さを変更できます。",
  "正確無比とIMEあり本番では、ミスをBackspaceで戻すまで先に進めません。",
  "自動リタイアは、設定から有効にできます。",
] as const;

export const postSessionTips = [
  "自分の「つまづきパターン」を理解するのが、成長に不可欠です。",
  "たいてい、他人より自分自身と競争するほうが良い結果が出ます。",
  "楽だからといって「エンジニア座り」をしていると、腰を壊すので気をつけましょう。",
  "最高のパフォーマンスを出したいときは、まず机から離れ、爪の長さを確認するといいかも。",
  "焦るより、遅くても正確にやるほうがすべてのモードでスコアが伸びます。",
  "1日に長時間練習しすぎないようにしましょう。腱鞘炎になります。",
  "英文はだいぶ日本語文と感覚が違います。分けて練習しましょう。",
  "一瞬一瞬のブーストよりも、安定してスラスラ打てるほうがスコアが伸びます。",
  "単語で反射神経を競わず、長文で実力を磨くのがオススメ。",
  "文字をうったら、すぐにホームポジションに戻しましょう。",
  "打鍵中、手元を絶対に見てはいけません。絶対です。",
  "できるだけ、毎日練習しましょう。それが最短ルートです。",
  "ずっと練習をするより、実用もするほうが伸びやすくなります。",
  "ミスしたキー単体よりも、ミスした組み合わせを見つける方が役に立つかも。",
  "常に先読みを意識してみよう。",
  "高速化とは、文字を速く打つことではなく、迷う時間を減らすこと。",
  "「ci」や「le」など、早く打てる別ルートも無理のない範囲で試してみよう。"
] as const;

export function getRandomPreSessionTip(random: () => number = Math.random) {
  return getRandomTip(preSessionTips, random);
}

export function getRandomPostSessionTip(random: () => number = Math.random) {
  return getRandomTip(postSessionTips, random);
}

function getRandomTip<T extends readonly string[]>(tips: T, random: () => number): T[number] {
  const index = Math.min(tips.length - 1, Math.floor(random() * tips.length));

  return tips[index];
}
