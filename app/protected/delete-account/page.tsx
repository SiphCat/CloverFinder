import { DeleteAccountButton } from "@/app/components/DeleteAccountButton";

export default function DeleteAccountPage() {
  return (
    <>
      <h1 className="profile-panel-title">Delete profile</h1>
      <p className="profile-panel-muted">
        Permanently remove your Cloverfinder account. Your email and username become available for a
        new sign-up afterward.
      </p>
      <DeleteAccountButton />
    </>
  );
}
