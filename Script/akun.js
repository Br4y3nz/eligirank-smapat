import supabase from '../Supabase/client.js';

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
