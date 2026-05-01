import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Legacy nav entry: "Templates manager" used to be a separate placeholder
 * page. The Templates overview now covers list + create + edit + duplicate +
 * delete + import end-to-end, so we just redirect there.
 */
function TemplatesManager() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/super/templates-ai", { replace: true });
  }, [navigate]);
  return null;
}

export default TemplatesManager;
