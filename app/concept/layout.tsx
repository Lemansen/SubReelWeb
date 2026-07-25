import { ConceptBackgroundControl } from "@/components/concept-background-control";

export default function ConceptLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ConceptBackgroundControl />
      {children}
    </>
  );
}
