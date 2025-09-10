import { Layout } from "@/components/Layout";
import CreditNoteForm from "@/components/forms/CreditNoteForm";

const CreditNote = () => {
  return (
    <Layout activeTab="" onTabChange={() => {}}>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Credit Note</h1>
        <CreditNoteForm />
      </div>
    </Layout>
  );
};

export default CreditNote;