import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import marketplaceApi from '../api/marketplaceApi';
import { buildBudgetRange, formatCurrency, formatDate, formatDateTime, getBidStatusMeta, getProjectStatusMeta } from '../utils/formatters';

const initialProjectForm = {
  title: '',
  description: '',
  budgetMin: '',
  budgetMax: '',
  deadline: '',
};

const initialBidForm = {
  price: '',
  estimatedTime: '',
  message: '',
};

const ProjectsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [bidForm, setBidForm] = useState(initialBidForm);
  const [projects, setProjects] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectBids, setSelectedProjectBids] = useState([]);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [loadingProjectBids, setLoadingProjectBids] = useState(false);

  const isCustomer = user?.role === 'customer';

  const loadPageData = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    try {
      if (isCustomer) {
        const projectsResponse = await marketplaceApi.getMyProjects();
        setProjects(projectsResponse.data || []);
        setSelectedProjectBids([]);
      } else {
        const [projectsResponse, bidsResponse] = await Promise.all([
          marketplaceApi.getAllProjects(),
          marketplaceApi.getMyBids(),
        ]);
        setProjects(projectsResponse.data || []);
        setMyBids(bidsResponse.data || []);
      }
    } catch (error) {
      addToast(error?.message || 'Khong the tai trang du an.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, isCustomer, user]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const customerProjectSummary = useMemo(() => {
    return projects.reduce((accumulator, project) => {
      accumulator.total += 1;
      if (project.status === 'open') {
        accumulator.open += 1;
      }
      return accumulator;
    }, { total: 0, open: 0 });
  }, [projects]);

  const handleProjectFieldChange = (field) => (event) => {
    setProjectForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleBidFieldChange = (field) => (event) => {
    setBidForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setSubmittingProject(true);

    try {
      await marketplaceApi.createProject({
        title: projectForm.title,
        description: projectForm.description,
        budgetMin: Number(projectForm.budgetMin),
        budgetMax: Number(projectForm.budgetMax),
        deadline: projectForm.deadline ? new Date(projectForm.deadline).toISOString() : null,
      });
      addToast('Da tao project moi thanh cong.', 'success');
      setProjectForm(initialProjectForm);
      await loadPageData();
    } catch (error) {
      addToast(error?.message || 'Khong the tao project.', 'error');
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleLoadProjectBids = async (project) => {
    setSelectedProject(project);
    setLoadingProjectBids(true);

    try {
      const response = await marketplaceApi.getBidsByProject(project.id);
      setSelectedProjectBids(response.data || []);
    } catch (error) {
      addToast(error?.message || 'Khong the tai danh sach bid.', 'error');
    } finally {
      setLoadingProjectBids(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      await marketplaceApi.acceptBid(bidId);
      addToast('Da chap nhan bid va tao hop dong thanh cong.', 'success');
      await loadPageData();
      if (selectedProject) {
        await handleLoadProjectBids({
          ...selectedProject,
          status: 'in_progress',
        });
      }
    } catch (error) {
      addToast(error?.message || 'Khong the chap nhan bid.', 'error');
    }
  };

  const handleSubmitBid = async (event) => {
    event.preventDefault();
    if (!selectedProject) {
      addToast('Hay chon mot project truoc khi gui bid.', 'warning');
      return;
    }

    setSubmittingBid(true);
    try {
      await marketplaceApi.createBid({
        projectId: selectedProject.id,
        price: Number(bidForm.price),
        estimatedTime: bidForm.estimatedTime,
        message: bidForm.message,
        attachments: '',
      });
      addToast('Da gui bid thanh cong.', 'success');
      setBidForm(initialBidForm);
      await loadPageData();
    } catch (error) {
      addToast(error?.message || 'Khong the gui bid.', 'error');
    } finally {
      setSubmittingBid(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Projects
          </Caption>
          <H1 className="mt-3 text-4xl">
            {isCustomer ? 'Quan ly project va xu ly bid' : 'Duyet project va gui bao gia'}
          </H1>
          <Text className="mt-4 text-slate-600">
            Frontend nay dang goi truc tiep cac endpoint `projects` va `bids` hien co cua backend, khong con dung mock gallery flow.
          </Text>
        </Card>

        <Card className="border-2 border-secondary-900 bg-secondary-900 p-6 text-white">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-100">
            Business note
          </Caption>
          <H2 className="mt-3 text-2xl text-white">
            {isCustomer ? 'Tu post job den chon bid' : 'Tu marketplace den proposal'}
          </H2>
          <Text className="mt-4 text-sm text-slate-300">
            {isCustomer
              ? 'Customer co the dang project, xem bid theo tung project, va chap nhan bid da phu hop.'
              : 'Freelancer co the loc project dang mo, mo proposal composer, va quan ly lich su bid da gui.'}
          </Text>
        </Card>
      </section>

      {isCustomer ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 border-slate-200 bg-white p-5">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Tong so project
              </Caption>
              <div className="mt-4 text-4xl font-black text-secondary-900">
                {loading ? '...' : customerProjectSummary.total}
              </div>
            </Card>
            <Card className="border-2 border-slate-200 bg-white p-5">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Project dang mo
              </Caption>
              <div className="mt-4 text-4xl font-black text-secondary-900">
                {loading ? '...' : customerProjectSummary.open}
              </div>
            </Card>
            <Card className="border-2 border-slate-200 bg-white p-5">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Luong duoc bam sat
              </Caption>
              <Text className="mt-4 text-sm text-slate-600">
                Dang project, nhan bid, chap nhan bid, roi chuyen sang buoc hop dong.
              </Text>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Create project
              </Caption>
              <H2 className="mt-2 text-2xl">
                Dang project moi
              </H2>
              <form className="mt-5 flex flex-col gap-4" onSubmit={handleCreateProject}>
                <Input label="Tieu de" placeholder="VD: Xay dung landing page gioi thieu san pham" value={projectForm.title} onChange={handleProjectFieldChange('title')} />
                <Textarea label="Mo ta project" placeholder="Neu ro bai toan, deliverable, moc thoi gian va ky nang mong muon." value={projectForm.description} onChange={handleProjectFieldChange('description')} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Ngan sach tu" type="number" min="0" value={projectForm.budgetMin} onChange={handleProjectFieldChange('budgetMin')} />
                  <Input label="Den" type="number" min="0" value={projectForm.budgetMax} onChange={handleProjectFieldChange('budgetMax')} />
                </div>
                <Input label="Deadline" type="date" value={projectForm.deadline} onChange={handleProjectFieldChange('deadline')} />
                <Button type="submit" disabled={submittingProject}>
                  {submittingProject ? 'Dang tao project...' : 'Dang project'}
                </Button>
              </form>
            </Card>

            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Project list
              </Caption>
              <H2 className="mt-2 text-2xl">
                Project cua ban
              </H2>
              <div className="mt-5 flex flex-col gap-3">
                {projects.map((project) => {
                  const statusMeta = getProjectStatusMeta(project.status);
                  return (
                    <div key={project.id} className="border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-secondary-900">{project.title}</div>
                          <Caption className="text-xs text-slate-500">
                            Deadline: {formatDate(project.deadline)}
                          </Caption>
                        </div>
                        <Badge color={statusMeta.color}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <Text className="mt-3 text-sm text-slate-600">
                        {project.description || 'Chua co mo ta chi tiet cho project nay.'}
                      </Text>
                      <div className="mt-3 text-sm font-semibold text-slate-700">
                        Ngan sach: {buildBudgetRange(project)}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => handleLoadProjectBids(project)}>
                          Xem bid
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {!loading && projects.length === 0 && (
                  <Callout type="info" title="Chua co project">
                    Ban chua dang project nao. Hay bat dau tu form ben trai.
                  </Callout>
                )}
              </div>
            </Card>
          </section>

          {selectedProject && (
            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Project bids
              </Caption>
              <H2 className="mt-2 text-2xl">
                Bao gia cho: {selectedProject.title}
              </H2>
              <div className="mt-5 flex flex-col gap-3">
                {loadingProjectBids && (
                  <Text className="text-sm text-slate-500">
                    Dang tai danh sach bid...
                  </Text>
                )}

                {!loadingProjectBids && selectedProjectBids.map((bid) => {
                  const statusMeta = getBidStatusMeta(bid.status);
                  return (
                    <div key={bid.id} className="border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-secondary-900">
                            {bid.freelancer?.fullName || `Freelancer #${bid.freelancer?.id || bid.id}`}
                          </div>
                          <Caption className="text-xs text-slate-500">
                            De xuat luc: {formatDateTime(bid.createdAt)}
                          </Caption>
                        </div>
                        <Badge color={statusMeta.color}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <div className="mt-3 text-sm font-semibold text-slate-700">
                        Gia de xuat: {formatCurrency(bid.price)}
                      </div>
                      <Text className="mt-2 text-sm text-slate-600">
                        {bid.message || 'Freelancer chua dien message cho proposal nay.'}
                      </Text>
                      <Text className="mt-2 text-sm text-slate-500">
                        Thoi gian du kien: {bid.estimatedTime || 'Dang cap nhat'}
                      </Text>
                      {selectedProject.status === 'open' && bid.status === 'pending' && (
                        <div className="mt-4">
                          <Button onClick={() => handleAcceptBid(bid.id)}>
                            Chap nhan bid
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!loadingProjectBids && selectedProjectBids.length === 0 && (
                  <Callout type="info" title="Chua co bid">
                    Project nay chua nhan duoc proposal nao tu freelancer.
                  </Callout>
                )}
              </div>
            </Card>
          )}
        </>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-2 border-slate-200 bg-white p-6">
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
              Marketplace projects
            </Caption>
            <H2 className="mt-2 text-2xl">
              Project dang mo
            </H2>
            <div className="mt-5 flex flex-col gap-3">
              {projects.map((project) => {
                const statusMeta = getProjectStatusMeta(project.status);
                return (
                  <div key={project.id} className="border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-secondary-900">{project.title}</div>
                        <Caption className="text-xs text-slate-500">
                          Chu project: {project.user?.fullName || `Customer #${project.user?.id || '---'}`}
                        </Caption>
                      </div>
                      <Badge color={statusMeta.color}>
                        {statusMeta.label}
                      </Badge>
                    </div>
                    <Text className="mt-3 text-sm text-slate-600">
                      {project.description || 'Khach hang chua dien mo ta cho project nay.'}
                    </Text>
                    <div className="mt-3 text-sm font-semibold text-slate-700">
                      Ngan sach: {buildBudgetRange(project)}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Deadline: {formatDate(project.deadline)}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => setSelectedProject(project)}>
                        Chon project nay
                      </Button>
                    </div>
                  </div>
                );
              })}

              {!loading && projects.length === 0 && (
                <Callout type="info" title="Chua co project">
                  Hien tai chua co project dang mo de gui proposal.
                </Callout>
              )}
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Proposal composer
              </Caption>
              <H2 className="mt-2 text-2xl">
                {selectedProject ? `Gui bid cho: ${selectedProject.title}` : 'Chon mot project de gui bid'}
              </H2>
              {!selectedProject ? (
                <Callout type="info" title="Hay chon project">
                  Chon mot card project o cot ben trai, sau do dien gia, thoi gian va thong diep de gui proposal.
                </Callout>
              ) : (
                <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmitBid}>
                  <Input label="Gia de xuat" type="number" min="0" value={bidForm.price} onChange={handleBidFieldChange('price')} />
                  <Input label="Thoi gian du kien" placeholder="VD: 7 ngay lam viec" value={bidForm.estimatedTime} onChange={handleBidFieldChange('estimatedTime')} />
                  <Textarea label="Thong diep de xuat" placeholder="Tom tat cach ban se tiep can project nay." value={bidForm.message} onChange={handleBidFieldChange('message')} />
                  <Button type="submit" disabled={submittingBid}>
                    {submittingBid ? 'Dang gui bid...' : 'Gui bid'}
                  </Button>
                </form>
              )}
            </Card>

            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                My bids
              </Caption>
              <H2 className="mt-2 text-2xl">
                Bao gia da gui
              </H2>
              <div className="mt-5 flex flex-col gap-3">
                {myBids.map((bid) => {
                  const statusMeta = getBidStatusMeta(bid.status);
                  return (
                    <div key={bid.id} className="border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-secondary-900">
                            {bid.project?.title || `Project #${bid.project?.id || bid.id}`}
                          </div>
                          <Caption className="text-xs text-slate-500">
                            Gia de xuat: {formatCurrency(bid.price)}
                          </Caption>
                        </div>
                        <Badge color={statusMeta.color}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <Text className="mt-3 text-sm text-slate-600">
                        {bid.message || 'Chua co note cho bid nay.'}
                      </Text>
                    </div>
                  );
                })}

                {!loading && myBids.length === 0 && (
                  <Callout type="info" title="Chua gui bid">
                    Chon mot project dang mo va gui proposal de bat dau.
                  </Callout>
                )}
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProjectsPage;
