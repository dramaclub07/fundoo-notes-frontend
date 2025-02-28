document.addEventListener("DOMContentLoaded", function () {
  const noteInput = document.getElementById("noteInput");
  const notesGrid = document.querySelector(".fundoo-dash-notes-grid");
  const createNoteSection = document.querySelector(".fundoo-dash-create-note");
  const apiUrl = "http://localhost:3000/api/v1/notes";
  const authToken = localStorage.getItem("jwtToken");
  let currentView = "notes";
  let allNotes = [];
  let searchQuery = ""; // Store the search query

  if (!authToken) {
      alert("You are not logged in!");
      return;
  }
  

  document.getElementById("notesTab").addEventListener("click", () => switchView("notes"));
  document.getElementById("archiveTab").addEventListener("click", () => switchView("archive"));
  document.getElementById("trashTab").addEventListener("click", () => switchView("trash"));

  // Get the search input element
  const searchInput = document.getElementById("searchInput");
  
  // Add event listener for search input
  if (searchInput) {
      searchInput.addEventListener("input", function () {
          searchQuery = searchInput.value.trim().toLowerCase(); // Update searchQuery
          renderNotes(); // Re-render notes based on search
      });
  }

  fetchNotes();

  function switchView(view) {
      currentView = view;
      renderNotes();
      createNoteSection.style.display = view === "notes" ? "block" : "none";

      document.querySelectorAll(".fundoo-dash-sidebar li").forEach(tab => tab.classList.remove("active"));
      document.getElementById(`${view}Tab`).classList.add("active");
  }

  // Fetch Notes from Backend
  async function fetchNotes() {
      try {
          const response = await fetch(`${apiUrl}/getnote`, {
              method: "GET",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` }
          });
          if (!response.ok) throw new Error(`Failed to fetch notes. Status: ${response.status}`);
          const result = await response.json();
          allNotes = result.notes; // Assuming the response has a `notes` key
          renderNotes();
      } catch (error) {
          console.error("Error fetching notes:", error);
      }
  }

  // Render Notes Based on Current View and Search Query
  function renderNotes() {
      notesGrid.innerHTML = "";
      const filteredNotes = allNotes.filter(note => {
          let inView = false;
          if (currentView === "notes") {
              inView = !note.is_deleted && !note.is_archived;
          } else if (currentView === "archive") {
              inView = note.is_archived;
          } else if (currentView === "trash") {
              inView = note.is_deleted;
          }
          if (!inView) return false;

          // Filter notes based on search query
          if (searchQuery) {
              const title = note.title ? note.title.toLowerCase() : "";
              const content = note.content ? note.content.toLowerCase() : "";
              return title.includes(searchQuery) || content.includes(searchQuery);
          }

          return true;
      });

      if (filteredNotes.length === 0) {
          notesGrid.innerHTML = "<p>No notes found</p>";
      } else {
          filteredNotes.forEach(addNoteToGrid);
      }
      console.log("Rendering Notes for View:", currentView, filteredNotes);
  }

  // Create a New Note
  noteInput.addEventListener("blur", async function () {
      const content = noteInput.value.trim();
      if (!content) return;
      try {
          const response = await fetch(`${apiUrl}/create`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
              body: JSON.stringify({ note: { title: "Untitled", content, color: "white" } })
          });
          const newNote = await response.json();
          allNotes.push(newNote);
          noteInput.value = "";
          renderNotes();
      } catch (error) {
          console.error("Error creating note:", error);
      }
  });

  // Add Note to Grid
  function addNoteToGrid(note) {
      const noteElement = document.createElement("div");
      noteElement.classList.add("fundoo-dash-note");
      noteElement.style.backgroundColor = note.color || "#fff";
      noteElement.dataset.id = note.id;
      let title = note.title && note.title.trim() ? note.title : note.content.split(" ").slice(0, 5).join(" ") || "Untitled";
      noteElement.innerHTML = `
          <h4>${title}</h4>
          <p>${note.content}</p>
          <div class="note-icons">
              ${currentView === "notes" ? `
                  <i class="fas fa-palette color-icon" data-id="${note.id}" title="Change Color"></i>
                  <i class="fas fa-box-archive archive-icon" data-id="${note.id}" title="Archive"></i>
                  <i class="fas fa-trash delete-icon" data-id="${note.id}" title="Move to Trash"></i>
              ` : ""}
              ${currentView === "archive" ? `
                  <i class="fas fa-folder-open unarchive-icon" data-id="${note.id}" title="Unarchive"></i>
                  <i class="fas fa-trash delete-icon" data-id="${note.id}" title="Move to Trash"></i>
              ` : ""}
              ${currentView === "trash" ? `
                  <i class="fas fa-undo restore-icon" data-id="${note.id}" title="Restore"></i>
                  <i class="fas fa-trash-alt delete-permanent-icon" data-id="${note.id}" title="Delete Permanently"></i>
              ` : ""}
          </div>
      `;
      notesGrid.prepend(noteElement);
  }

  // Handle Icon Clicks
  notesGrid.addEventListener("click", async function (event) {
      const target = event.target;
      const noteId = target.dataset.id;
      if (!noteId) return;

      if (target.classList.contains("archive-icon")) toggleArchive(noteId, true);
      else if (target.classList.contains("unarchive-icon")) toggleArchive(noteId, false);
      else if (target.classList.contains("delete-icon")) toggleTrash(noteId, true);
      else if (target.classList.contains("restore-icon")) toggleTrash(noteId, false);
      else if (target.classList.contains("delete-permanent-icon")) deleteNote(noteId);
      else if (target.classList.contains("color-icon")) changeColor(noteId);
  });

  // Toggle Archive Status
  async function toggleArchive(id, archive) {
      try {
          await fetch(`${apiUrl}/archive/${id}`, {
              method: "PUT",
              headers: { "Authorization": `Bearer ${authToken}` },
              body: JSON.stringify({ note: { is_archived: archive } })
          });
          updateNoteLocally(id, { is_archived: archive });
      } catch (error) { console.error("Error toggling archive:", error); }
  }

  // Toggle Trash Status
  async function toggleTrash(id, trash) {
      try {
          await fetch(`${apiUrl}/trash/${id}`, {
              method: "PUT",
              headers: { "Authorization": `Bearer ${authToken}` },
              body: JSON.stringify({ note: { is_deleted: trash } })
          });
          updateNoteLocally(id, { is_deleted: trash });
      } catch (error) { console.error("Error toggling trash:", error); }
  }

  // Delete Note Permanently
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
  
  // Change Note Color
  async function changeColor(id) {
      const newColor = prompt("Enter new color (e.g., #ff5733):");
      if (!newColor) return;
      try {
          await fetch(`${apiUrl}/update_color/${id}/${newColor}`, {
              method: "PUT",
              headers: { "Authorization": `Bearer ${authToken}` }
          });
          updateNoteLocally(id, { color: newColor });
      } catch (error) { console.error("Error changing color:", error); }
  }

  // Update Note Locally
  function updateNoteLocally(id, updatedData) {
      allNotes = allNotes.map(note => (note.id == id ? { ...note, ...updatedData } : note));
      renderNotes();
  }

  // Logout Functionality
  const logoutButton = document.getElementById("Logout");
  if (logoutButton) {
      logoutButton.addEventListener("click", function () {
          localStorage.removeItem("jwtToken"); // Remove authentication token
          window.location.href = "fundooLogin.html"; // Redirect to login page
      });
  }
});