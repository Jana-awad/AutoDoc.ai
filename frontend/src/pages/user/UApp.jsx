import DocumentProcessor from "../shared/DocumentProcessor";

/**
 * Tenant *user* (role=user) document workspace. Mounted at `/user/documents`
 * inside `UserAppShell`, which already supplies the Sidebar + Header chrome,
 * so this page only needs to render the processor body.
 *
 * Backend already scopes `/templates` and `/documents` to the user's
 * `client_id`, so the UI doesn't need to do anything special.
 */
const UApp = () => (
  <DocumentProcessor theme="user" brand="Workspace" />
);

export default UApp;
