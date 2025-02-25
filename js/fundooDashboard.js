document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
        alert("You are not logged in. Redirecting to login page...");
        window.location.href = "../pages/fundooLogin.html";
        return;
    }

    const createNoteBtn = document.getElementById("create-note-btn");
    const createNoteForm = document.getElementById("create-note-form");
    const cancelNoteBtn = document.getElementById("cancel-note-btn");
    const noteForm = document.getElementById("note-form");
    const notesGrid = document.getElementById("notes-grid");

    createNoteBtn.addEventListener("click", () => {
        createNoteForm.style.display = "block";
    });

    cancelNoteBtn.addEventListener("click", () => {
        createNoteForm.style.display = "none";
    });

    // Handle Note Submission
    noteForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("note-title").value;
        const content = document.getElementById("note-content").value;
        const color = document.getElementById("note-color").value;

        try {
            const response = await fetch("http://localhost:3000/api/v1/notes/create", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ note: { title, content, color } })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Note created successfully!");
                noteForm.reset();
                createNoteForm.style.display = "none";
                fetchNotes(); // Fetch updated notes
            } else {
                console.error("Error response:", result);
                alert("Failed to create note: " + (result.error || JSON.stringify(result)));
            }
        } catch (error) {
            console.error("Error creating note:", error);
            alert("Something went wrong. Please try again.");
        }
    });

    // Fetch Notes from Backend
    async function fetchNotes() {
        try {
            const response = await fetch("http://localhost:3000/api/v1/notes/getnote", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();
            
            console.log("Fetched notes:", result); // Debugging

            if (response.ok) {
                displayNotes(result.notes);
            } else {
                console.error("Error response:", result);
                alert("Failed to fetch notes.");
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
            // alert("Something went wrong. Please try again.");
        }
    }

    // Display Notes
    function displayNotes(notes) {
        notesGrid.innerHTML = ""; // Clear previous notes

        if (!notes || notes.length === 0) {
            notesGrid.innerHTML = "<p>No notes found.</p>";
            return;
        }

        notes.forEach(note => {
            const noteCard = document.createElement("div");
            noteCard.className = "fundoo-note-card";
            noteCard.style.backgroundColor = note.color || "#ffffff";
            noteCard.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content}</p>
                <div class="note-actions">
                    <span class="edit-icon" data-id="${note.id}">✏️</span>
                    <span class="archive-icon" data-id="${note.id}">📥</span>
                    <span class="delete-icon" data-id="${note.id}">🗑️</span>
                </div>
            `;
            notesGrid.appendChild(noteCard);
        });

        addIconEventListeners();
    }

    // Add Event Listeners to Icons
    function addIconEventListeners() {
        document.querySelectorAll(".edit-icon").forEach(icon =>
            icon.addEventListener("click", () => editNote(icon.dataset.id))
        );

        document.querySelectorAll(".archive-icon").forEach(icon =>
            icon.addEventListener("click", () => archiveNote(icon.dataset.id))
        );

        document.querySelectorAll(".delete-icon").forEach(icon =>
            icon.addEventListener("click", () => deleteNote(icon.dataset.id))
        );
    }

    // Edit Note
    async function editNote(noteId) {
        const newTitle = prompt("Enter new title:");
        const newContent = prompt("Enter new content:");

        if (newTitle === null || newContent === null) {
            return; // User canceled the prompt
        }

        try {
            const response = await fetch(`http://localhost:3000/api/v1/notes/update/${noteId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ note: { title: newTitle, content: newContent } })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Note updated successfully!");
                fetchNotes(); // Refresh the notes list
            } else {
                console.error("Error response:", result);
                alert("Failed to update note: " + (result.error || JSON.stringify(result)));
            }
        } catch (error) {
            console.error("Error updating note:", error);
            alert("Something went wrong. Please try again.");
        }
    }

    // Archive Note
    async function archiveNote(noteId) {
        const confirmArchive = confirm("Are you sure you want to archive this note?");

        if (!confirmArchive) {
            return; // User canceled the action
        }

        try {
            const response = await fetch(`http://localhost:3000/api/v1/notes/archive/${noteId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (response.ok) {
                alert("Note archived successfully!");
                fetchNotes(); // Refresh the notes list
            } else {
                console.error("Error response:", result);
                alert("Failed to archive note: " + (result.error || JSON.stringify(result)));
            }
        } catch (error) {
            console.error("Error archiving note:", error);
            alert("Something went wrong. Please try again.");
        }
    }

    // Delete Note
    async function deleteNote(noteId) {
        const confirmDelete = confirm("Are you sure you want to delete this note?");

        if (!confirmDelete) {
            return; // User canceled the action
        }

        try {
            const response = await fetch(`http://localhost:3000/api/v1/notes/delete/${noteId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (response.ok) {
                alert("Note deleted successfully!");
                fetchNotes(); // Refresh the notes list
            } else {
                console.error("Error response:", result);
                alert("Failed to delete note: " + (result.error || JSON.stringify(result)));
            }
        } catch (error) {
            console.error("Error deleting note:", error);
            alert("Something went wrong. Please try again.");
        }
    }

    fetchNotes(); // Fetch notes on page load
});