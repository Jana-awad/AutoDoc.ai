import { useNavigate } from "react-router-dom";
import EnterpriseNav from "../../components/EnterpriseNav";
import DocumentProcessor from "../shared/DocumentProcessor";

function EnterpriseDocumentsNav() {
  const navigate = useNavigate();
  return (
    <EnterpriseNav
      userName="Enterprise Admin"
      userEmail="admin@autodoc.ai"
      onSettings={() => navigate("/enterprise/profile/settings")}
    />
  );
}

const EDocuments = () => (
  <DocumentProcessor NavComponent={EnterpriseDocumentsNav} theme="enterprise" brand="Enterprise" />
);

export default EDocuments;
