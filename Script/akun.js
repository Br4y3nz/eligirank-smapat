import supabase from '../Supabase/client.js';

async function loadUserProfile() {
  const { data: { session } } = await supabase.auth.getSession();

  const profileContent = document.getElementById("akun-content");
  const notLoggedIn = document.getElementById("akun-logged-out");
  const tipsCard = document.getElementById("tips-card");

  if (!session) {
    if (profileContent) profileContent.style.display = "none";
    if (notLoggedIn) notLoggedIn.style.display = "flex";
    if (tipsCard) tipsCard.style.display = "none";
    return;
  }

  if (profileContent) profileContent.style.display = "block";
  if (notLoggedIn) notLoggedIn.style.display = "none";
  if (tipsCard) tipsCard.style.display = "block";

  const userId = session?.user?.id;
  if (!userId) return;

  // Users
  const email = session.user.email;
  document.getElementById("email").value = email;

  // Profiles
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (profile) {
    document.getElementById("fullname").value = profile.fullname || "";
    document.getElementById("phone").value = profile.phone || "";
    document.getElementById("profile-avatar").src = profile.avatar_url || "https://via.placeholder.com/100";
    document.getElementById("profile-username").textContent = profile.username || "User";
  }

  // Roles
  const { data: roles, error } = await supabase
    .from("roles")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching roles:", error);
  }

  if (roles && roles.length > 0) {
    // Use the first role or handle multiple roles as needed
    const role = roles[0];
    const roleLabel = role.role.charAt(0).toUpperCase() + role.role.slice(1);
    document.getElementById("profile-role").textContent = roleLabel;

    if (role.role === "student") {
      document.getElementById("student-section").style.display = "block";
      document.getElementById("kelas").value = role.kelas || "";
      document.getElementById("rapor").value = role.rapor || "";
    }
    if (role.role === "teacher") {
      document.getElementById("teacher-section").style.display = "block";
      document.getElementById("subject").value = role.subject || "";
      document.getElementById("homeroom").value = role.homeroom || "";
    }
  }
}
document.addEventListener("DOMContentLoaded", loadUserProfile);

document.addEventListener('DOMContentLoaded', () => {
  let cropper = null;
  const uploadInput = document.getElementById("avatar-upload");
  const imagePreview = document.getElementById("image-preview");
  const modal = document.getElementById("cropper-modal");
  const cropBtn = document.getElementById("crop-avatar");

  if (uploadInput) {
    uploadInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        imagePreview.src = reader.result;
        modal.style.display = "block";

        cropper = new Cropper(imagePreview, {
          aspectRatio: 1,
          viewMode: 1,
          autoCropArea: 1,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  if (cropBtn) {
    cropBtn.addEventListener("click", async () => {
      const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("You must be logged in to upload an avatar.");
        return;
      }
      const userId = session.user.id;
      const filePath = `avatars/${userId}_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        alert("Upload gagal.");
        console.error(uploadError);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (updateError) {
        alert("Gagal menyimpan foto profil.");
        console.error(updateError);
        return;
      }

      const profileAvatar = document.getElementById("profile-avatar");
      if (profileAvatar) profileAvatar.src = avatarUrl;

      const sidebarImg = document.getElementById("profile-img");
      if (sidebarImg) sidebarImg.src = avatarUrl;

      alert("Foto profil berhasil diperbarui!");
      modal.style.display = "none";
    });
  }

  // Change password form logic
  const changePasswordForm = document.getElementById("change-password-form");
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newPassword = document.getElementById("new-password").value.trim();

      if (!newPassword || newPassword.length < 6) {
        alert("Password minimal 6 karakter.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        alert("Gagal mengubah password.");
        console.error(error);
      } else {
        alert("Password berhasil diubah.");
        document.getElementById("new-password").value = '';
      }
    });
  }
});
