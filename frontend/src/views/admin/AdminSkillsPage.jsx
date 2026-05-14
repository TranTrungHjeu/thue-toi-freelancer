"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Database, 
  Search, 
  Plus, 
  EditPencil, 
  Trash,
} from 'iconoir-react';
import { H1, Text, Caption } from '../../components/common/Typography';
import AdvancedTable from '../../components/common/AdvancedTable';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import adminApi from '../../api/adminApi';
import marketplaceApi from '../../api/marketplaceApi';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import Spinner from '../../components/common/Spinner';

const AdminSkillsPage = () => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State for Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillForm, setSkillForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // State cho hộp thoại xác nhận xóa — thay thế window.confirm để nhất quán với UI hệ thống
  const [deleteDialog, setDeleteDialog] = useState({ open: false, skillId: null });

  const fetchSkills = useCallback(async () => {
    try {
      const response = await marketplaceApi.getSkillCatalog();
      if (response.success) {
        setSkills(response.data);
      }
    } catch {
      addToast(t('toasts.dashboard.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleOpenModal = (skill = null) => {
    if (skill) {
      setEditingSkill(skill);
      setSkillForm({ name: skill.name, description: skill.description || '' });
    } else {
      setEditingSkill(null);
      setSkillForm({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveSkill = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSkill) {
        await adminApi.updateSkill(editingSkill.id, skillForm);
      } else {
        await adminApi.createSkill(skillForm);
      }
      addToast(t('toasts.admin.saveSkillSuccess'), 'success');
      setIsModalOpen(false);
      fetchSkills();
    } catch (error) {
      addToast(error?.message || t('toasts.dashboard.updateError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async () => {
    const id = deleteDialog.skillId;
    if (!id) return;
    setDeleteDialog({ open: false, skillId: null });
    try {
      await adminApi.deleteSkill(id);
      addToast(t('toasts.admin.deleteSkillSuccess'), 'success');
      fetchSkills();
    } catch (error) {
      addToast(error?.message || t('toasts.dashboard.loadError'), 'error');
    }
  };

  const filteredSkills = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return skills.filter(skill =>
      skill.name.toLowerCase().includes(term) ||
      (skill.description && skill.description.toLowerCase().includes(term))
    );
  }, [searchTerm, skills]);

  const headers = [
    {
      key: 'name',
      label: t('adminPages.skills.tableHeaderName'),
      sortable: true,
      render: (name) => <span className="font-bold text-slate-900 line-clamp-1">{name}</span>
    },
    {
      key: 'description',
      label: t('adminPages.skills.tableHeaderDesc'),
      render: (desc) => <span className="text-sm text-slate-500 line-clamp-2">{desc || t('values.notAvailable')}</span>
    },
    {
      key: 'actions',
      label: t('adminPages.skills.tableHeaderActions'),
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(row)}>
            <EditPencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteDialog({ open: true, skillId: row.id })}>
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center p-2.5 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
              <Database className="w-5 h-5 text-white" />
            </div>
            <Caption className="text-slate-500 font-bold uppercase tracking-[0.2em]">{t('adminPages.skills.caption')}</Caption>
          </div>
          <H1 className="text-4xl font-bold tracking-tighter text-slate-900">
            {t('adminPages.skills.title')}
          </H1>
          <Text className="mt-1 max-w-2xl text-slate-500 text-base">
            {t('adminPages.skills.desc')}
          </Text>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Input
            placeholder={t('adminPages.skills.searchPlaceholder')}
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 shadow-premium"
          />
          <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto shadow-premium">
            <Plus className="w-4 h-4 mr-2" /> {t('adminPages.skills.addBtn')}
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white shadow-premium">
          <Spinner size="md" />
          <Text className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">{t('adminPages.dashboard.updating')}</Text>
        </div>
      ) : (
        <div className="bg-white shadow-premium overflow-hidden border border-slate-100">
          <AdvancedTable
            headers={headers}
            data={filteredSkills}
            pageSize={15}
            className="[&_table]:border-0"
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editingSkill ? t('adminPages.skills.modalTitleEdit') : t('adminPages.skills.modalTitleCreate')}
      >
        <form onSubmit={handleSaveSkill} className="flex flex-col gap-6">
          <Input
            label={t('adminPages.skills.tableHeaderName')}
            placeholder={t('adminPages.skills.namePlaceholder')}
            value={skillForm.name}
            onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
            required
            disabled={submitting}
          />

          <Textarea
            label={t('adminPages.skills.tableHeaderDesc')}
            placeholder={t('adminPages.skills.descPlaceholder')}
            value={skillForm.description}
            onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
            rows={4}
            disabled={submitting}
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              {t('adminPages.skills.cancelBtn')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting}
            >
              {submitting
                ? <Spinner size="sm" tone="current" inline />
                : editingSkill
                  ? t('adminPages.skills.confirmEditBtn')
                  : t('adminPages.skills.confirmCreateBtn')
              }
            </Button>
          </div>
        </form>
      </Modal>

      {/* Hộp thoại xác nhận xóa kỹ năng */}
      <Modal
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, skillId: null })}
        title={t('adminPages.skills.deleteConfirmTitle')}
        size="sm"
      >
        <div className="flex flex-col gap-6">
          <Text className="text-slate-600">
            {t('adminPages.skills.deleteConfirm')}
          </Text>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteDialog({ open: false, skillId: null })}
            >
              {t('adminPages.skills.cancelBtn')}
            </Button>
            <Button
              variant="error"
              className="flex-1"
              onClick={handleDeleteSkill}
            >
              {t('adminPages.skills.deleteConfirmBtn')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSkillsPage;
