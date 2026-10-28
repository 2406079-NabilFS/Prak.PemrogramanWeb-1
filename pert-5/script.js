document.addEventListener("DOMContentLoaded", () => {
    // ---- 1. Elemen DOM ----
    const todoForm   = document.querySelector("#todoForm");
    const taskInput  = document.querySelector("#taskInput");
    const inputError = document.querySelector("#inputError");
    const todoList   = document.querySelector("#todoList");
    const taskCounter       = document.querySelector("#taskCounter");
    const clearCompletedBtn = document.querySelector("#clearCompletedBtn");
    const MAX_TASKS = 5; // batas maksimal tugas

    // ---- 2. LocalStorage ----
    const getTasks  = () => JSON.parse(localStorage.getItem("todo_tasks")) || [];
    const saveTasks = (tasks) =>
        localStorage.setItem("todo_tasks", JSON.stringify(tasks));

    // ---- 3. Render ----
    const renderTasks = () => {
        const tasks = getTasks();
        todoList.innerHTML = "";

        if (tasks.length === 0) {
            todoList.innerHTML =
                "<p style='text-align:center; color:#64748b; font-size:13px; padding:10px;'>Belum ada tugas tersimpan.</p>";
        } else {
            const fragment = document.createDocumentFragment();
            tasks.forEach((task, index) => {
                const li = document.createElement("li");
                li.className = `todo-item ${task.completed ? "completed" : ""}`;
                li.innerHTML = `
                    <span class="todo-text">${escapeHTML(task.text)}</span>
                    <div class="todo-actions">
                        <button class="action-btn complete-btn" data-index="${index}">
                            ${task.completed ? "Batal" : "Selesai"}
                        </button>
                        <button class="action-btn delete-btn" data-index="${index}">
                            Hapus
                        </button>
                    </div>
                `;
                fragment.appendChild(li);
            });
            todoList.appendChild(fragment);
        }
        // info placeholder 
        const penuh = tasks.length >= MAX_TASKS;
        taskInput.placeholder = penuh
            ? `Maksimal ${MAX_TASKS} tugas. Hapus salah satu dulu.`
            : "Sok ketik tugasna atuh bos!";

        // Fitur 1: perbarui penghitung tugas
        const total    = tasks.length;
        const selesai  = tasks.filter((t) => t.completed).length;
        const belum    = total - selesai;
        taskCounter.textContent =
            `Total: ${total} Tugas | Selesai: ${selesai} | Belum Selesai: ${belum}`;

        // Fitur 2: tombol nonaktif kalau belum ada tugas selesai
        clearCompletedBtn.disabled = selesai === 0;
    };

    // ---- 4. Submit form ----
    todoForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const taskText = taskInput.value.trim();
        const tasks    = getTasks();

        // validasi min. 3 karakter
        if (taskText.length < 3) {
            taskInput.classList.add("error");
            inputError.textContent = "Tugas tidak boleh kosong atau kurang dari 3 karakter!";
            inputError.style.display = "block";
            return;
        }

        // validasi maksimal 5 tugas
        if (tasks.length >= MAX_TASKS) {
            taskInput.classList.add("error");
            inputError.textContent = `Maksimal ${MAX_TASKS} tugas! Hapus salah satu dulu.`;
            inputError.style.display = "block";
            return;
        }

        // valid → bersihkan error
        taskInput.classList.remove("error");
        inputError.style.display = "none";

        tasks.push({ text: taskText, completed: false });
        saveTasks(tasks);

        taskInput.value = "";
        taskInput.focus();
        renderTasks();
    });

    // ---- 5. Hapus error saat user mulai ngetik lagi ----
    taskInput.addEventListener("input", () => {
        taskInput.classList.remove("error");
        inputError.style.display = "none";
    });

    // ---- 6. Event delegation: toggle & hapus ----
    todoList.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const index = Number(btn.dataset.index);
        if (Number.isNaN(index)) return;

        const tasks = getTasks();

        if (btn.classList.contains("complete-btn")) {
            tasks[index].completed = !tasks[index].completed;
            saveTasks(tasks);
            renderTasks();
        } else if (btn.classList.contains("delete-btn")) {
            // Fitur 3: konfirmasi sebelum menghapus
            if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;
            tasks.splice(index, 1);
            saveTasks(tasks);
            renderTasks();
        }
    });

    // ---- 6b. Fitur 2: hapus semua tugas yang sudah selesai ----
    clearCompletedBtn.addEventListener("click", () => {
        // konfirmasi dulu sebelum membersihkan tugas selesai
        if (!confirm("Apakah Anda yakin ingin membersihkan semua tugas yang sudah selesai?")) return;

        const tasks = getTasks().filter((task) => !task.completed);
        saveTasks(tasks);
        renderTasks();
    });

    // ---- 7. Util ----
    function escapeHTML(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- 8. Init ----
    renderTasks();
});