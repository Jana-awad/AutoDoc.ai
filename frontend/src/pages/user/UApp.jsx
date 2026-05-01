import Unavbar from "../../components/Unavbar";
import DocumentProcessor from "../shared/DocumentProcessor";

/**
 * Tenant *user* (role=user) home. Created by an enterprise/business admin via
 * the Manage Users panel; lands here after login.
 *
 * They reuse the same `DocumentProcessor` component as the admin tenants —
 * the backend already scopes `/templates` and `/documents` to the user's
 * `client_id`, so the UI doesn't need to do anything special.
 */
const UApp = () => (
  <DocumentProcessor NavComponent={Unavbar} theme="user" brand="Workspace" />
);

export default UApp;
