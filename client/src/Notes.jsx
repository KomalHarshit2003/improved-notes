import React, { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, Edit2, Eye, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import "./Notes.css";
import { useNavigate } from "react-router-dom";

function Notes() {
    const [user, setUser] = useState(null);
    const [activeView, setActiveView] = useState(null);
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [expandedNoteId, setExpandedNoteId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch user email from local storage or session
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            setUser(userEmail);
            setActiveView('add');
        } else {
            navigate("/");
        }
    }, [navigate]);
    
    useEffect(() => {
        if (user) {
            fetchNotes();
        }
    }, [user]); 

    const fetchNotes = () => {
        if (!user) return;

        axios
            .get(`http://localhost:5001/api/notes?userEmail=${user}`) 
            .then((response) => {
                setNotes(response.data);
            })
            .catch((error) => console.error("Error fetching notes:", error));
    };

    const handleAddNote = () => {
        if (!title.trim() || !content.trim()) {
            alert("Title and content are required!");
            return;
        }
        
        const currentDate = new Date().toLocaleDateString("en-GB"); 
        axios
            .post("http://localhost:5001/api/notes", { 
                title, 
                content, 
                date: currentDate,
                userEmail: user 
            })
            .then((response) => {
                setNotes([...notes, response.data]);
                setTitle("");
                setContent("");
                fetchNotes(); // Refresh notes
            })
            .catch((error) => console.error("Error adding note:", error));
    };

    const handleEditNote = (id, updatedTitle, updatedContent) => {
        if (!updatedTitle || !updatedContent) {
            alert("Title and content are required!");
            return;
        }
        
        const currentNote = notes.find(note => note._id === id);
        if (!currentNote) {
            console.error("Note not found");
            return;
        }
        
        axios
            .put(`http://localhost:5001/api/notes/${id}`, {
                title: updatedTitle,
                content: updatedContent,
                date: currentNote.date,
                userEmail: user
            })
            .then((response) => {
                const updatedNotes = notes.map((note) =>
                    note._id === id ? response.data : note
                );
                setNotes(updatedNotes);
                fetchNotes(); // Refresh notes
            })
            .catch((error) => console.error("Error updating note:", error));
    };

    const handleDeleteNote = (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this note?");
        if (!confirmDelete) return;
        
        axios
            .delete(`http://localhost:5001/api/notes/${id}?userEmail=${user}`)
            .then(() => {
                const updatedNotes = notes.filter((note) => note._id !== id);
                setNotes(updatedNotes);
                fetchNotes(); // Refresh notes
            })
            .catch((error) => console.error("Error deleting note:", error));
    };

    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        navigate("/");
    };

    const toggleNoteExpansion = (noteId) => {
        setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
    };

    const renderAddNotes = () => (
        <div className="notes-section">
            <h2>Add New Note</h2>
            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="note-input"
            />
            <textarea
                placeholder="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="note-textarea"
            ></textarea>
            <button className="button1" onClick={handleAddNote}>
                <Plus size={20} style={{ marginRight: '10px' }} /> Add Note
            </button>
        </div>
    );

    const renderViewNotes = () => (
        <div className="notes-section">
            <h2>Your Notes</h2>
            {notes.length === 0 ? (
                <p>No notes found. Start by adding a new note!</p>
            ) : (
                <div className="notes-accordion">
                    {notes.map((note) => (
                        <div key={note._id} className="note-item">
                            <div 
                                className="note-header" 
                                onClick={() => toggleNoteExpansion(note._id)}
                            >
                                <div className="note-title-section">
                                    <strong>{note.title}</strong>
                                    <span className="note-date">{note.date || 'No date'}</span>
                                </div>
                                {expandedNoteId === note._id ? 
                                    <ChevronUp size={18} /> : 
                                    <ChevronDown size={18} />
                                }
                            </div>
                            <div className={`note-content ${expandedNoteId === note._id ? 'expanded' : 'collapsed'}`}>
                                <p>{note.content}</p>
                                <div className="note-actions">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditNote(
                                                note._id, 
                                                prompt("Enter updated title:", note.title),
                                                prompt("Enter updated content:", note.content)
                                            );
                                        }}
                                        className="edit-btn"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteNote(note._id);
                                        }}
                                        className="delete-btn"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="app-container">
            <div className="header-container">
                <h1>Note Hub</h1>
                <div className="header-info">
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
            
            {user && (
                <div className="welcome-section">
                    <h2>Welcome, {user}!</h2>
                    <div className="action-buttons">
                        <button 
                            className={`action-btn ${activeView === 'add' ? 'active' : ''}`} 
                            onClick={() => setActiveView('add')}
                        >
                            <Plus size={20} /> Add Notes
                        </button>
                        <button 
                            className={`action-btn ${activeView === 'view' ? 'active' : ''}`} 
                            onClick={() => setActiveView('view')}
                        >
                            <Eye size={20} /> View Notes
                        </button>
                    </div>
                </div>
            )}
    
            {activeView === 'add' && renderAddNotes()}
            {activeView === 'view' && renderViewNotes()}
        </div>
    );
}

export default Notes;