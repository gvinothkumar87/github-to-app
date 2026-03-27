import { PageLayout } from "@/components/PageLayout";
import CreditNoteForm from "@/components/forms/CreditNoteForm";

const CreditNote = () => {
  return (
    <PageLayout title="Credit Note">
      <div className="container mx-auto p-6">
        <CreditNoteForm />
      </div>
    </PageLayout>
  );
};

export default CreditNote;
