import React from 'react';

const DiaryEntry = ({entry}) => {
  return (
    <div className="diary-entry">
      <p>{entry.text}</p>
      <small>{entry.date}</small>
    </div>
  );
};

export default DiaryEntry;