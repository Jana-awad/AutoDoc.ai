import { useNavigate } from "react-router-dom";
import Enavbar from "../../components/Enavbar";
import DocumentProcessor from "../shared/DocumentProcessor";

function EnterpriseDocumentsNav() {
  return <Enavbar />;
}

const EDocuments = () => (
  <DocumentProcessor NavComponent={EnterpriseDocumentsNav} theme="enterprise" brand="Enterprise" />
);

export default EDocuments;
