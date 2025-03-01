document.addEventListener("DOMContentLoaded", function () {
    const noteTitleInput = document.getElementById("noteTitleInput");
    const noteInput = document.getElementById("noteInput");
    const saveNoteBtn = document.getElementById("saveNoteBtn");
    const colorPicker = document.getElementById("colorPicker");
    const archiveBtn = document.querySelector(".archive-btn");
    const deleteBtn = document.querySelector(".delete-btn");
    const notesGrid = document.querySelector(".fundoo-dash-notes-grid");
    const createNoteSection = document.querySelector(".fundoo-dash-create-note");
    const noteCreationBox = document.querySelector(".note-creation-box");
    const modal = new bootstrap.Modal(document.getElementById("noteModal"));
    const modalNoteTitle = document.getElementById("modalNoteTitle");
    const modalNoteContent = document.getElementById("modalNoteContent");
    const modalColorPicker = document.getElementById("modalColorPicker");
    const modalLabelInput = document.getElementById("modalLabelInput");
    const modalReminderInput = document.getElementById("modalReminderInput");
    const modalSaveNoteBtn = document.getElementById("modalSaveNoteBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const viewToggleBtn = document.getElementById("viewToggleBtn");
    const toggleThemeBtn = document.getElementById("toggleTheme");
    const sidebar = document.querySelector(".fundoo-dash-sidebar");
    const essentialMenu = document.querySelector(".essential-menu");
    const navTitle = document.getElementById("navTitle");
    const apiUrl = "http://localhost:3000/api/v1/notes";
    const authToken = localStorage.getItem("jwtToken");
    let currentView = "notes";
    let allNotes = [];
    let searchQuery = "";
    let currentNoteId = null;
    let isGridView = true;

    if (!authToken) {
        alert("You are not logged in!");
        window.location.href = "fundooLogin.html";
        return;
    }

    // Sidebar Toggle
    essentialMenu.addEventListener("click", () => {
        sidebar.classList.toggle("expanded");
    });

    // Tab Switching with Title Update
    document.getElementById("notesTab").addEventListener("click", () => switchView("notes"));
    document.getElementById("archiveTab").addEventListener("click", () => switchView("archive"));
    document.getElementById("trashTab").addEventListener("click", () => switchView("trash"));

    // Search Input
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            searchQuery = searchInput.value.trim().toLowerCase();
            renderNotes();
        });
    }

    // View Toggle
    viewToggleBtn.addEventListener("click", () => {
        isGridView = !isGridView;
        notesGrid.classList.toggle("grid-view", isGridView);
        notesGrid.classList.toggle("horizontal-view", !isGridView);
        viewToggleBtn.innerHTML = isGridView ? '<i class="fas fa-th"></i>' : '<i class="fas fa-list"></i>';
        viewToggleBtn.title = isGridView ? "Switch to Horizontal View" : "Switch to Grid View";
    });

    // Theme Toggle
    toggleThemeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");
    });

    // Refresh
    refreshBtn.addEventListener("click", () => {
        fetchNotes();
    });

    // Note Creation Expansion
    noteInput.addEventListener("focus", () => {
        noteCreationBox.classList.add("expanded");
        noteTitleInput.style.display = "block";
        document.querySelector(".note-actions").style.display = "flex";
    });

    noteInput.addEventListener("input", () => {
        document.querySelector(".note-actions").style.display = noteInput.value.trim() || noteTitleInput.value.trim() ? "flex" : "none";
    });

    noteTitleInput.addEventListener("input", () => {
        document.querySelector(".note-actions").style.display = noteInput.value.trim() || noteTitleInput.value.trim() ? "flex" : "none";
    });

    // Save Note
    saveNoteBtn.addEventListener("click", createNote);

    // Archive/Delete from Creation
    archiveBtn.addEventListener("click", () => createNote(true));
    deleteBtn.addEventListener("click", () => {
        noteTitleInput.value = "";
        noteInput.value = "";
        resetNoteCreation();
    });

    // Modal Save
    modalSaveNoteBtn.addEventListener("click", saveModalNote);

    fetchNotes();

    function switchView(view) {
        currentView = view;
        renderNotes();
        createNoteSection.style.display = view === "notes" ? "block" : "none";
        document.querySelectorAll(".sidebar-nav li").forEach(tab => tab.classList.remove("active"));
        document.getElementById(`${view}Tab`).classList.add("active");
        navTitle.textContent = view === "notes" ? "Fundoo" : view.charAt(0).toUpperCase() + view.slice(1);
    }

    async function fetchNotes() {
        try {
            const response = await fetch(`${apiUrl}/getnote`, {
                method: "GET",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch notes. Status: ${response.status}`);
            const result = await response.json();
            allNotes = result.notes || [];
            renderNotes();
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    }

    function renderNotes() {
        notesGrid.innerHTML = "";
        const filteredNotes = allNotes.filter(note => {
            let inView = false;
            if (currentView === "notes") inView = !note.is_deleted && !note.is_archived;
            else if (currentView === "archive") inView = note.is_archived;
            else if (currentView === "trash") inView = note.is_deleted;
            if (!inView) return false;

            if (searchQuery) {
                const title = (note.title || "").toLowerCase();
                const content = (note.content || "").toLowerCase();
                const label = (note.label || "").toLowerCase();
                return title.includes(searchQuery) || content.includes(searchQuery) || label.includes(searchQuery);
            }
            return true;
        });

        if (filteredNotes.length === 0) {
            notesGrid.innerHTML = "<p>No notes found</p>";
        } else {
            filteredNotes.forEach(addNoteToGrid);
        }
    }

    async function createNote(archive = false) {
        const title = noteTitleInput.value.trim();
        const content = noteInput.value.trim();
        if (!title && !content) return;

        try {
            const response = await fetch(`${apiUrl}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify({
                    note: {
                        title: title || "Untitled",
                        content,
                        color: colorPicker.value,
                        is_pinned: false,
                        label: "",
                        reminder: null,
                        is_archived: archive
                    }
                })
            });
            if (!response.ok) throw new Error("Failed to create note");
            const newNote = await response.json();
            allNotes.push(newNote);
            resetNoteCreation();
            renderNotes();
        } catch (error) {
            console.error("Error creating note:", error);
        }
    }

    function resetNoteCreation() {
        noteTitleInput.value = "";
        noteInput.value = "";
        noteCreationBox.classList.remove("expanded");
        noteTitleInput.style.display = "none";
        document.querySelector(".note-actions").style.display = "none";
    }

    function addNoteToGrid(note) {
        const noteElement = document.createElement("div");
        noteElement.classList.add("fundoo-dash-note");
        noteElement.style.backgroundColor = note.color || "white";
        noteElement.dataset.id = note.id;
        noteElement.innerHTML = `
            <h5 class="note-title">${note.title || "Untitled"}</h5>
            <p class="note-content">${note.content || ""}</p>
            ${note.label ? `<span class="note-label">${note.label}</span>` : ""}
            ${note.reminder ? `<small class="note-reminder">Reminder: ${new Date(note.reminder).toLocaleString()}</small>` : ""}
            <div class="note-icons">
                ${currentView === "notes" || currentView === "archive" ? `
                    <i class="fas fa-thumbtack pin-icon ${note.is_pinned ? "pinned" : ""}" data-id="${note.id}" title="${note.is_pinned ? "Unpin" : "Pin"}"></i>
                    <i class="fas fa-palette color-icon" data-id="${note.id}" title="Change Color"></i>
                    <i class="fas fa-box-archive archive-icon" data-id="${note.id}" title="${currentView === "notes" ? "Archive" : "Unarchive"}"></i>
                    <i class="fas fa-trash-can delete-icon" data-id="${note.id}" title="Move to Trash"></i>
                ` : ""}
                ${currentView === "trash" ? `
                    <i class="fas fa-undo restore-icon" data-id="${note.id}" title="Restore"></i>
                    <i class="fas fa-trash-alt delete-permanent-icon" data-id="${note.id}" title="Delete Permanently"></i>
                ` : ""}
            </div>
        `;
        if (note.is_pinned && currentView === "notes") noteElement.classList.add("pinned");
        notesGrid.prepend(noteElement);
    }

    notesGrid.addEventListener("click", async function (event) {
        const target = event.target;
        const noteId = target.dataset.id;
        if (!noteId) return;

        if (target.classList.contains("pin-icon")) togglePin(noteId, !target.classList.contains("pinned"));
        else if (target.classList.contains("color-icon")) openColorModal(noteId);
        else if (target.classList.contains("archive-icon")) toggleArchive(noteId, currentView === "notes");
        else if (target.classList.contains("delete-icon")) toggleTrash(noteId, true);
        else if (target.classList.contains("restore-icon")) toggleTrash(noteId, false);
        else if (target.classList.contains("delete-permanent-icon")) deleteNote(noteId);
        else if (!target.classList.contains("note-icons") && !target.parentElement.classList.contains("note-icons")) {
            openEditModal(noteId);
        }
    });

    async function togglePin(id, pin) {
        try {
            await fetch(`${apiUrl}/update/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify({ note: { is_pinned: pin } })
            });
            updateNoteLocally(id, { is_pinned: pin });
        } catch (error) {
            console.error("Error toggling pin:", error);
        }
    }

    async function toggleArchive(id, archive) {
        try {
            await fetch(`${apiUrl}/archive/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify({ note: { is_archived: archive } })
            });
            updateNoteLocally(id, { is_archived: archive });
        } catch (error) {
            console.error("Error toggling archive:", error);
        }
    }

    async function toggleTrash(id, trash) {
        try {
            await fetch(`${apiUrl}/trash/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify({ note: { is_deleted: trash } })
            });
            updateNoteLocally(id, { is_deleted: trash });
        } catch (error) {
            console.error("Error toggling trash:", error);
        }
    }

    async function deleteNote(id) {
        try {
            const response = await fetch(`${apiUrl}/delete/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error(`Failed to delete note. Status: ${response.status}`);
            allNotes = allNotes.filter(note => note.id !== parseInt(id));
            renderNotes();
        } catch (error) {
            console.error("Error deleting note permanently:", error);
        }
    }

    function openColorModal(id) {
        openEditModal(id);
    }

    function openEditModal(id) {
        const note = allNotes.find(n => n.id == id);
        if (!note) return;
        currentNoteId = id;
        modalNoteTitle.value = note.title || "";
        modalNoteContent.value = note.content || "";
        modalColorPicker.value = note.color || "white";
        modalLabelInput.value = note.label || "";
        modalReminderInput.value = note.reminder ? new Date(note.reminder).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
        document.querySelector('[data-action="pin"]').classList.toggle("pinned", note.is_pinned);
        modal.show();
    }

    async function saveModalNote() {
        const updatedNote = {
            title: modalNoteTitle.value.trim() || "Untitled",
            content: modalNoteContent.value.trim(),
            color: modalColorPicker.value,
            label: modalLabelInput.value.trim(),
            reminder: modalReminderInput.value ? new Date(modalReminderInput.value).toISOString() : null,
            is_pinned: document.querySelector('[data-action="pin"]').classList.contains("pinned")
        };

        try {
            await fetch(`${apiUrl}/update/${currentNoteId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify({ note: updatedNote })
            });
            updateNoteLocally(currentNoteId, updatedNote);
            modal.hide();
        } catch (error) {
            console.error("Error saving note:", error);
        }
    }

    function updateNoteLocally(id, updatedData) {
        allNotes = allNotes.map(note => (note.id == id ? { ...note, ...updatedData } : note));
        renderNotes();
    }

    document.getElementById("logoutBtn").addEventListener("click", function () {
        localStorage.removeItem("jwtToken");
        window.location.href = "fundooLogin.html";
    });
});