/**
 * Enterprise Template Management page.
 * Composes: template list, create/edit modal, training, usage, support, API, roles, audit log.
 */
import "../../components/variables.css";
import "../../components/global.css";
import { useState, useEffect } from "react";
import Enavbar from "../../components/Enavbar";
import ETemplateList from "../../components/ETemplateList";
import ETemplateCreateModal from "../../components/ETemplateCreateModal";
import ETemplateTraining from "../../components/ETemplateTraining";
import EUnlimitedBadge from "../../components/EUnlimitedBadge";
import EUsageAnalytics from "../../components/EUsageAnalytics";
import ESupportSection from "../../components/ESupportSection";
import EApiIntegration from "../../components/EApiIntegration";
import ERolePermissions from "../../components/ERolePermissions";
import EAuditLog from "../../components/EAuditLog";
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  MOCK_TEMPLATES,
} from "../../services/enterpriseTemplatesApi";
import "./template.css";

function Template() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [trainingTemplate, setTrainingTemplate] = useState(null);
  const [apiTemplate, setApiTemplate] = useState(null);

  // Load templates on mount (mock API)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchTemplates();
        if (!cancelled) setTemplates(res.data || []);
      } catch (e) {
        if (!cancelled) setTemplates(MOCK_TEMPLATES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = () => {
    setEditingTemplate(null);
    setModalOpen(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setModalOpen(true);
  };

  const handleModalSubmit = async (payload) => {
    if (editingTemplate) {
      const res = await updateTemplate(editingTemplate.id, payload);
      // Merge so we keep templateId, status, etc. from existing row
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id ? { ...t, ...res.data, templateId: t.templateId, status: t.status } : t
        )
      );
    } else {
      const res = await createTemplate(payload);
      setTemplates((prev) => [...prev, res.data]);
    }
    setModalOpen(false);
    setEditingTemplate(null);
  };

  const handleTrain = (template) => {
    setTrainingTemplate(template);
  };

  const handleViewApi = (template) => {
    setApiTemplate(template);
  };

  return (
    <div className="enterprise-template enterprise-template-page">
      <Enavbar />

      <main className="enterprise-template-main">
        {/* Page header with Unlimited badge */}
        <header className="enterprise-template-header">
          <div>
            <h1 className="enterprise-template-title">Template Management</h1>
            <p className="enterprise-template-subtitle">
              Create and manage document templates. Upload samples, define fields, and train AI models.
            </p>
          </div>
          <EUnlimitedBadge />
        </header>

        {/* Template list with search, filter, sort, create */}
        <section className="enterprise-template-section enterprise-template-section--list">
          <ETemplateList
            templates={templates}
            loading={loading}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onTrain={handleTrain}
            onViewApi={handleViewApi}
          />
        </section>

        {/* Training panel - when a template is selected for training */}
        {trainingTemplate && (
          <section className="enterprise-template-section">
            <ETemplateTraining
              templateId={trainingTemplate.id}
              templateName={trainingTemplate.name}
              onRetrain={() => {}}
            />
          </section>
        )}

        {/* Usage analytics */}
        <section className="enterprise-template-section">
          <EUsageAnalytics />
        </section>

        {/* Three-column: Support | API Integration | Roles & Audit */}
        <div className="enterprise-template-grid">
          <section className="enterprise-template-section">
            <ESupportSection />
          </section>
          <section className="enterprise-template-section">
            <EApiIntegration templateId={apiTemplate?.templateId ?? "inv_std_001"} />
          </section>
          <section className="enterprise-template-section">
            <ERolePermissions currentRole="Admin" />
          </section>
        </div>

        <section className="enterprise-template-section">
          <EAuditLog />
        </section>
      </main>

      {/* Create / Edit template modal */}
      <ETemplateCreateModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTemplate(null);
        }}
        onSubmit={handleModalSubmit}
        template={editingTemplate}
      />
    </div>
  );
}

export default Template;
