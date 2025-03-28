// AddNote.jsx
import React from "react";

const AddNote = ({ title, setTitle, content, setContent, onAddNote }) => {
  const handleAddNote = (e) => {
    e.preventDefault();
    const newNote = {
      id: Date.now(),
      title,
      content,
      date: new Date().toLocaleDateString("en-GB"), // Format: DD/MM/YYYY
    };
    onAddNote(newNote);
    setTitle("");
    setContent("");
  };

  return (
    <form onSubmit={handleAddNote}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      ></textarea>
      <button type="submit">Add Note</button>
    </form>
  );
};

export default AddNote;
