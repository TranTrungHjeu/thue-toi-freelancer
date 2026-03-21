import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import marketplaceApi from '../api/marketplaceApi';
import { formatCurrency, formatDateTime, getContractStatusMeta } from '../utils/formatters';

const filterContractsByOwner = (contracts, userId) => {
  return (contracts || []).filter(
    (contract) => contract.clientId === userId || contract.freelancerId === userId,
  );
};

const ContractsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  useEffect(() => {
    const loadContracts = async () => {
      if (!user?.id) {
        return;
      }

      setLoading(true);
      try {
        const response = await marketplaceApi.getContractsByUser(user.id);
        const filteredContracts = filterContractsByOwner(response.data || [], user.id);
        setContracts(filteredContracts);
      } catch (error) {
        addToast(error?.message || 'Khong the tai danh sach hop dong.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadContracts();
  }, [addToast, user]);

  const handleSelectContract = async (contract) => {
    setSelectedContract(contract);
    setLoadingMilestones(true);

    try {
      const response = await marketplaceApi.getMilestonesByContract(contract.id);
      setMilestones((response.data || []).filter((milestone) => milestone.contractId === contract.id));
    } catch (error) {
      addToast(error?.message || 'Khong the tai milestone.', 'error');
    } finally {
      setLoadingMilestones(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Contracts
          </Caption>
          <H1 className="mt-3 text-4xl">
            Theo doi hop dong va cac milestone lien quan.
          </H1>
          <Text className="mt-4 text-slate-600">
            Trang nay hien thi cac hop dong backend tra ve cho user hien tai va cho phep mo milestone cua tung hop dong.
          </Text>
        </Card>

        <Callout type="info" title="Trang thai hien tai">
          Backend contract hien dang o muc CRUD co ban, vi vay frontend hien uu tien hien thi danh sach hop dong va milestone lien quan cho workflow quan sat.
        </Callout>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Contract list
          </Caption>
          <H2 className="mt-2 text-2xl">
            Hop dong cua ban
          </H2>
          <div className="mt-5 flex flex-col gap-3">
            {contracts.map((contract) => {
              const statusMeta = getContractStatusMeta(contract.status);
              return (
                <div key={contract.id} className="border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-secondary-900">
                        Contract #{contract.id}
                      </div>
                      <Caption className="text-xs text-slate-500">
                        Project #{contract.projectId}
                      </Caption>
                    </div>
                    <Badge color={statusMeta.color}>
                      {statusMeta.label}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    Gia tri: {formatCurrency(contract.totalAmount)}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Bat dau: {formatDateTime(contract.startDate)}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => handleSelectContract(contract)}>
                      Xem milestone
                    </Button>
                  </div>
                </div>
              );
            })}

            {!loading && contracts.length === 0 && (
              <Callout type="info" title="Chua co hop dong">
                Khi co hop dong duoc tao tren backend, danh sach se xuat hien tai day.
              </Callout>
            )}
          </div>
        </Card>

        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Milestones
          </Caption>
          <H2 className="mt-2 text-2xl">
            {selectedContract ? `Tien do cho contract #${selectedContract.id}` : 'Chon mot hop dong de xem milestone'}
          </H2>
          {!selectedContract ? (
            <Callout type="info" title="Chua chon hop dong">
              Chon mot hop dong ben trai de hien milestone lien quan.
            </Callout>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {loadingMilestones && (
                <Text className="text-sm text-slate-500">
                  Dang tai milestone...
                </Text>
              )}

              {!loadingMilestones && milestones.map((milestone) => (
                <div key={milestone.id} className="border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-secondary-900">{milestone.title}</div>
                      <Caption className="text-xs text-slate-500">
                        Due: {formatDateTime(milestone.dueDate)}
                      </Caption>
                    </div>
                    <Badge color={milestone.status === 'completed' ? 'success' : 'warning'}>
                      {milestone.status || 'pending'}
                    </Badge>
                  </div>
                  <Text className="mt-3 text-sm text-slate-600">
                    {milestone.description || 'Milestone nay chua co mo ta chi tiet.'}
                  </Text>
                  <div className="mt-3 text-sm font-semibold text-slate-700">
                    Gia tri: {formatCurrency(milestone.amount)}
                  </div>
                </div>
              ))}

              {!loadingMilestones && milestones.length === 0 && (
                <Callout type="info" title="Chua co milestone">
                  Hop dong nay chua co milestone duoc tao.
                </Callout>
              )}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default ContractsPage;
