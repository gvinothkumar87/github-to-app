import { Layout } from "@/components/Layout";
import DebitNoteForm from "@/components/forms/DebitNoteForm";

const DebitNote = () => {
  return (
    <Layout activeTab="" onTabChange={() => {}}>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Debit Note</h1>
        <DebitNoteForm />
      </div>
    </Layout>
  );
};

export default DebitNote;