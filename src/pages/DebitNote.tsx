import { PageLayout } from "@/components/PageLayout";
import DebitNoteForm from "@/components/forms/DebitNoteForm";

const DebitNote = () => {
  return (
    <PageLayout title="Debit Note">
      <div className="container mx-auto p-6">
        <DebitNoteForm />
      </div>
    </PageLayout>
  );
};

export default DebitNote;
