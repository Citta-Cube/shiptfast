import { LoadingPage } from "@/components/ui/loading-spinner";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto py-2 px-4">
      <LoadingPage text="Loading profile..." bottomText="Please wait while we fetch your profile information" />
    </div>
  );
}