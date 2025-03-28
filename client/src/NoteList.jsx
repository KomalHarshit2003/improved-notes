// NoteList.jsx

import React from "react";

const NoteList = ({ notes, onEditNote, onDeleteNote }) => {
  return (
    <div className="note-list">
      {notes.map((note) => (
        <div key={note.id} className="note-item">
          <h3>{note.title}</h3>
          <p>{note.content}</p>
          <span className="note-date">Created on: {note.date}</span>
          <div className="note-actions">
            <button onClick={() => onEditNote(note)}>Edit</button>
            <button onClick={() => onDeleteNote(note.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NoteList;
