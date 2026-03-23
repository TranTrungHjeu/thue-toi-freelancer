import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
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
      addToast(error?.message || 'Không thể tải trang dự án.', 'error');
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
      addToast('Đã tạo project mới thành công.', 'success');
      setProjectForm(initialProjectForm);
      await loadPageData();
    } catch (error) {
      addToast(error?.message || 'Không thể tạo project.', 'error');
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
      addToast(error?.message || 'Không thể tải danh sách bid.', 'error');
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
      addToast(error?.message || 'Không thể chấp nhận bid.', 'error');
    }
  };

  const handleSubmitBid = async (event) => {
    event.preventDefault();
    if (!selectedProject) {
      addToast('Hãy chọn một project trước khi gửi bid.', 'warning');
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
      addToast('Đã gửi bid thành công.', 'success');
      setBidForm(initialBidForm);
      await loadPageData();
    } catch (error) {
      addToast(error?.message || 'Không thể gửi bid.', 'error');
    } finally {
      setSubmittingBid(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Dự án
          </Caption>
          <H1 className="mt-3 text-4xl">
            {isCustomer ? 'Quản lý project và xử lý bid' : 'Duyệt project và gửi báo giá'}
          </H1>
          <Text className="mt-4 text-slate-600">
            Frontend này đang gọi trực tiếp các endpoint <code>projects</code> và <code>bids</code> hiện có của backend, không còn dùng mock gallery flow.
          </Text>
        </Card>

        <Card className="border-2 border-secondary-900 bg-secondary-900 p-6 text-white">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-100">
            Ghi chú nghiệp vụ
          </Caption>
          <H2 className="mt-3 text-2xl text-white">
            {isCustomer ? 'Từ đăng job đến chọn bid' : 'Từ marketplace đến proposal'}
          </H2>
          <Text className="mt-4 text-sm text-slate-300">
            {isCustomer
              ? 'Khách hàng có thể đăng project, xem bid theo từng project, và chấp nhận bid đã phù hợp.'
              : 'Freelancer có thể lọc project đang mở, mở proposal composer, và quản lý lịch sử bid đã gửi.'}
          </Text>
        </Card>
      </section>

      {isCustomer ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 border-slate-200 bg-white p-5">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Tổng số project
              </Caption>
              <div className="mt-4 text-4xl font-black text-secondary-900">
                {loading ? '...' : customerProjectSummary.total}
              </div>
            </Card>
            <Card className="border-2 border-slate-200 bg-white p-5">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Project đang mở
              </Caption>
              <div className="mt-4 text-4xl font-black text-secondary-900">
                {loading ? '...' : customerProjectSummary.open}
              </div>
            </Card>
            <Card className="border-2 border-slate-200 bg-white p-5">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Luồng được bám sát
              </Caption>
              <Text className="mt-4 text-sm text-slate-600">
                Đăng project, nhận bid, chấp nhận bid, rồi chuyển sang bước hợp đồng.
              </Text>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Tạo project
              </Caption>
              <H2 className="mt-2 text-2xl">
                Đăng project mới
              </H2>
              <form className="mt-5 flex flex-col gap-4" onSubmit={handleCreateProject}>
                <Input label="Tiêu đề" placeholder="VD: Xây dựng landing page giới thiệu sản phẩm" value={projectForm.title} onChange={handleProjectFieldChange('title')} />
                <Textarea label="Mô tả project" placeholder="Nêu rõ bài toán, deliverable, mốc thời gian và kỹ năng mong muốn." value={projectForm.description} onChange={handleProjectFieldChange('description')} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Ngân sách từ" type="number" min="0" value={projectForm.budgetMin} onChange={handleProjectFieldChange('budgetMin')} />
                  <Input label="Đến" type="number" min="0" value={projectForm.budgetMax} onChange={handleProjectFieldChange('budgetMax')} />
                </div>
                <Input label="Deadline" type="date" value={projectForm.deadline} onChange={handleProjectFieldChange('deadline')} />
                <Button type="submit" disabled={submittingProject}>
                  {submittingProject ? 'Đang tạo project...' : 'Đăng project'}
                </Button>
              </form>
            </Card>

            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Danh sách project
              </Caption>
              <H2 className="mt-2 text-2xl">
                Project của bạn
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
                            Hạn: {formatDate(project.deadline)}
                          </Caption>
                        </div>
                        <Badge color={statusMeta.color}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <Text className="mt-3 text-sm text-slate-600">
                        {project.description || 'Chưa có mô tả chi tiết cho project này.'}
                      </Text>
                      <div className="mt-3 text-sm font-semibold text-slate-700">
                        Ngân sách: {buildBudgetRange(project)}
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
                  <Callout type="info" title="Chưa có project">
                    Bạn chưa đăng project nào. Hãy bắt đầu từ form bên trái.
                  </Callout>
                )}
              </div>
            </Card>
          </section>

          {selectedProject && (
            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Báo giá cho project
              </Caption>
              <H2 className="mt-2 text-2xl">
                Báo giá cho: {selectedProject.title}
              </H2>
              <div className="mt-5 flex flex-col gap-3">
                {loadingProjectBids && (
                  <Text className="text-sm text-slate-500">
                    Đang tải danh sách bid...
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
                            Đề xuất lúc: {formatDateTime(bid.createdAt)}
                          </Caption>
                        </div>
                        <Badge color={statusMeta.color}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <div className="mt-3 text-sm font-semibold text-slate-700">
                        Giá đề xuất: {formatCurrency(bid.price)}
                      </div>
                      <Text className="mt-2 text-sm text-slate-600">
                        {bid.message || 'Freelancer chưa điền message cho proposal này.'}
                      </Text>
                      <Text className="mt-2 text-sm text-slate-500">
                        Thời gian dự kiến: {bid.estimatedTime || 'Đang cập nhật'}
                      </Text>
                      {selectedProject.status === 'open' && bid.status === 'pending' && (
                        <div className="mt-4">
                          <Button onClick={() => handleAcceptBid(bid.id)}>
                            Chấp nhận bid
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!loadingProjectBids && selectedProjectBids.length === 0 && (
                  <Callout type="info" title="Chưa có bid">
                    Project này chưa nhận được proposal nào từ freelancer.
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
              Dự án marketplace
            </Caption>
            <H2 className="mt-2 text-2xl">
              Project đang mở
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
                          Chủ project: {project.user?.fullName || `Khách hàng #${project.user?.id || '---'}`}
                        </Caption>
                      </div>
                      <Badge color={statusMeta.color}>
                        {statusMeta.label}
                      </Badge>
                    </div>
                    <Text className="mt-3 text-sm text-slate-600">
                      {project.description || 'Khách hàng chưa điền mô tả cho project này.'}
                    </Text>
                    <div className="mt-3 text-sm font-semibold text-slate-700">
                      Ngân sách: {buildBudgetRange(project)}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Hạn: {formatDate(project.deadline)}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => setSelectedProject(project)}>
                        Chọn project này
                      </Button>
                    </div>
                  </div>
                );
              })}

              {!loading && projects.length === 0 && (
                <Callout type="info" title="Chưa có project">
                  Hiện tại chưa có project đang mở để gửi proposal.
                </Callout>
              )}
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Soạn đề xuất
              </Caption>
              <H2 className="mt-2 text-2xl">
                {selectedProject ? `Gửi bid cho: ${selectedProject.title}` : 'Chọn một project để gửi bid'}
              </H2>
              {!selectedProject ? (
                <Callout type="info" title="Hãy chọn project">
                  Chọn một card project ở cột bên trái, sau đó điền giá, thời gian và thông điệp để gửi proposal.
                </Callout>
              ) : (
                <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmitBid}>
                  <Input label="Giá đề xuất" type="number" min="0" value={bidForm.price} onChange={handleBidFieldChange('price')} />
                  <Input label="Thời gian dự kiến" placeholder="VD: 7 ngày làm việc" value={bidForm.estimatedTime} onChange={handleBidFieldChange('estimatedTime')} />
                  <Textarea label="Thông điệp đề xuất" placeholder="Tóm tắt cách bạn sẽ tiếp cận project này." value={bidForm.message} onChange={handleBidFieldChange('message')} />
                  <Button type="submit" disabled={submittingBid}>
                    {submittingBid ? 'Đang gửi bid...' : 'Gửi bid'}
                  </Button>
                </form>
              )}
            </Card>

            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                Báo giá của tôi
              </Caption>
              <H2 className="mt-2 text-2xl">
                Báo giá đã gửi
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
                            Giá đề xuất: {formatCurrency(bid.price)}
                          </Caption>
                        </div>
                        <Badge color={statusMeta.color}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <Text className="mt-3 text-sm text-slate-600">
                        {bid.message || 'Chưa có note cho bid này.'}
                      </Text>
                    </div>
                  );
                })}

                {!loading && myBids.length === 0 && (
                  <Callout type="info" title="Chưa gửi bid">
                    Chọn một project đang mở và gửi proposal để bắt đầu.
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
