interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="start-screen">
      <div className="start-content">
        <h1 className="title">Flow Journal</h1>
        <p className="subtitle">思考の流れを途切れさせない</p>

        <p className="description">
          タイピングを止めると文字が霞む。<br />
          書き続けることで、思考は鮮明になる。
        </p>

        <button
          className="start-button"
          onClick={onStart}
        >
          はじめる
        </button>

        <div className="tips">
          <h3>書き方のヒント</h3>
          <ul>
            <li>正しさより流れ、浮かんだことをそのまま書く</li>
            <li>止まりそうになったら「えーと」でも書く</li>
            <li>変換しなくてOK、ひらがなやローマ字のままでいい</li>
            <li>タイポは気にしない</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
