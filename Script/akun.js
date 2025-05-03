// Script to handle role selection and profile update on akun.html

document.addEventListener("DOMContentLoaded", () => {
  const roleSelect = document.createElement("select");
  roleSelect.id = "roleSelect";
  roleSelect.innerHTML = `
    <option value="" disabled selected>Select your role</option>
    <option value="student">Student</option>
    <option value="teacher">Teacher</option>
    <option value="admin">Admin</option>
  `;

  // Insert role select at the top of the profile details card or suitable place
  const profileDetailsCard = document.querySelector(".profile-details-card");
  if (profileDetailsCard) {
    const roleLabel = document.createElement("label");
    roleLabel.textContent = "Role:";
    roleLabel.setAttribute("for", "roleSelect");
    profileDetailsCard.insertBefore(roleLabel, profileDetailsCard.firstChild);
    profileDetailsCard.insertBefore(roleSelect, roleLabel.nextSibling);
  }

  // Create containers for role-specific fields
  const studentFields = document.createElement("div");
  studentFields.id = "studentFields";
  studentFields.style.display = "none";
  studentFields.innerHTML = `
    <div class="form-group">
      <label for="nisInput">NIS (Student ID):</label>
      <input type="text" id="nisInput" placeholder="Enter NIS" />
    </div>
    <div class="form-group">
      <label for="nisnInput">NISN (National Student Number):</label>
      <input type="text" id="nisnInput" placeholder="Enter NISN" />
    </div>
  `;

  const teacherFields = document.createElement("div");
  teacherFields.id = "teacherFields";
  teacherFields.style.display = "none";
  teacherFields.innerHTML = `
    <div class="form-group">
      <label for="nikInput">NIK (Teacher ID):</label>
      <input type="text" id="nikInput" placeholder="Enter NIK" />
    </div>
    <div class="form-group">
      <label for="nuptkInput">NUPTK (Teacher Registration Number):</label>
      <input type="text" id="nuptkInput" placeholder="Enter NUPTK" />
    </div>
  `;

  if (profileDetailsCard) {
    profileDetailsCard.insertBefore(studentFields, roleSelect.nextSibling);
    profileDetailsCard.insertBefore(teacherFields, studentFields.nextSibling);
  }

  // Admin UID constant (replace with actual admin UID)
  const ADMIN_UID = "632455ea-c4e1-42f7-9955-b361dffa8e6d";

  // Show/hide fields based on role selection
  roleSelect.addEventListener("change", () => {
    const selectedRole = roleSelect.value;
    studentFields.style.display = "none";
    teacherFields.style.display = "none";

    if (selectedRole === "student") {
      studentFields.style.display = "block";
    } else if (selectedRole === "teacher") {
      teacherFields.style.display = "block";
    } else if (selectedRole === "admin") {
      // For admin, no extra fields, but check UID
      checkAdminUID();
    }
  });

  // Function to check if logged-in user is admin
  async function checkAdminUID() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      alert("You must be logged in to select admin role.");
      roleSelect.value = "";
      return;
    }
    if (session.user.id !== ADMIN_UID) {
      alert("You are not authorized to select admin role.");
      roleSelect.value = "";
    }
  }

  // Add a save button to save role and related info
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save Role and Info";
  saveBtn.className = "btn btn-primary";
  if (profileDetailsCard) {
    profileDetailsCard.appendChild(saveBtn);
  }

  saveBtn.addEventListener("click", async () => {
    const selectedRole = roleSelect.value;
    if (!selectedRole) {
      alert("Please select a role.");
      return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      alert("You must be logged in to save profile info.");
      return;
    }

    const userId = session.user.id;

    // Prepare update object
    let updateData = { role: selectedRole };

    if (selectedRole === "student") {
      const nis = document.getElementById("nisInput").value.trim();
      const nisn = document.getElementById("nisnInput").value.trim();
      if (!nis || !nisn) {
        alert("Please fill in NIS and NISN for student role.");
        return;
      }
      updateData.nis = nis;
      updateData.nisn = nisn;
      // Clear teacher fields if any
      updateData.nik = null;
      updateData.nuptk = null;
    } else if (selectedRole === "teacher") {
      const nik = document.getElementById("nikInput").value.trim();
      const nuptk = document.getElementById("nuptkInput").value.trim();
      if (!nik || !nuptk) {
        alert("Please fill in NIK and NUPTK for teacher role.");
        return;
      }
      updateData.nik = nik;
      updateData.nuptk = nuptk;
      // Clear student fields if any
      updateData.nis = null;
      updateData.nisn = null;
    } else if (selectedRole === "admin") {
      // For admin, verify UID
      if (userId !== ADMIN_UID) {
        alert("You are not authorized to set admin role.");
        return;
      }
      // Clear student and teacher fields
      updateData.nis = null;
      updateData.nisn = null;
      updateData.nik = null;
      updateData.nuptk = null;
    }

    // Update profiles table in Supabase
    const { error } = await window.supabaseClient
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
      return;
    }

    alert("Profile updated successfully.");
    // Optionally reload or update UI
    window.location.reload();
  });

  // On page load, fetch current profile data and populate form
  async function loadProfileData() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const { data, error } = await window.supabaseClient
      .from("profiles")
      .select("role, nis, nisn, nik, nuptk")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile data:", error);
      return;
    }

    if (data) {
      roleSelect.value = data.role || "";
      if (data.role === "student") {
        studentFields.style.display = "block";
        document.getElementById("nisInput").value = data.nis || "";
        document.getElementById("nisnInput").value = data.nisn || "";
      } else if (data.role === "teacher") {
        teacherFields.style.display = "block";
        document.getElementById("nikInput").value = data.nik || "";
        document.getElementById("nuptkInput").value = data.nuptk || "";
      } else {
        studentFields.style.display = "none";
        teacherFields.style.display = "none";
      }
    }
  }

  loadProfileData();
});
