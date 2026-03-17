import { useState, useRef } from 'react';

export default function TagListBuilder({ value, onChange, placeholder }) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  function add() {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setInputVal('');
    inputRef.current?.focus();
  }

  function remove(index) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="tag-list-wrap">
      <div className="tag-list-items">
        {value.map((tag, i) => (
          <span className="tag-list-item" key={i}>
            {tag}
            <button onClick={() => remove(i)} title="Remove">
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="tag-add-row">
        <input
          ref={inputRef}
          className="tag-add-input"
          type="text"
          placeholder={placeholder}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button className="tag-add-btn" onClick={add}>
          + Add
        </button>
      </div>
    </div>
  );
}
