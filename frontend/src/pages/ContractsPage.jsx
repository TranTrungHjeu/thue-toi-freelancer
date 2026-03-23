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
        addToast(error?.message || 'Không thể tải danh sách hợp đồng.', 'error');
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
      addToast(error?.message || 'Không thể tải milestone.', 'error');
    } finally {
      setLoadingMilestones(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Hợp đồng
          </Caption>
          <H1 className="mt-3 text-4xl">
            Theo dõi hợp đồng và các milestone liên quan.
          </H1>
          <Text className="mt-4 text-slate-600">
            Trang này hiển thị các hợp đồng backend trả về cho user hiện tại và cho phép mở milestone của từng hợp đồng.
          </Text>
        </Card>

        <Callout type="info" title="Trạng thái hiện tại">
          Backend contract hiện đang ở mức CRUD cơ bản, vì vậy frontend hiện ưu tiên hiển thị danh sách hợp đồng và milestone liên quan cho workflow quan sát.
        </Callout>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Danh sách hợp đồng
          </Caption>
          <H2 className="mt-2 text-2xl">
            Hợp đồng của bạn
          </H2>
          <div className="mt-5 flex flex-col gap-3">
            {contracts.map((contract) => {
              const statusMeta = getContractStatusMeta(contract.status);
              return (
                <div key={contract.id} className="border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-secondary-900">
                        Hợp đồng #{contract.id}
                      </div>
                      <Caption className="text-xs text-slate-500">
                        Dự án #{contract.projectId}
                      </Caption>
                    </div>
                    <Badge color={statusMeta.color}>
                      {statusMeta.label}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    Giá trị: {formatCurrency(contract.totalAmount)}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Bắt đầu: {formatDateTime(contract.startDate)}
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
              <Callout type="info" title="Chưa có hợp đồng">
                Khi có hợp đồng được tạo trên backend, danh sách sẽ xuất hiện tại đây.
              </Callout>
            )}
          </div>
        </Card>

        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            Các mốc tiến độ
          </Caption>
          <H2 className="mt-2 text-2xl">
            {selectedContract ? `Tiến độ cho hợp đồng #${selectedContract.id}` : 'Chọn một hợp đồng để xem milestone'}
          </H2>
          {!selectedContract ? (
            <Callout type="info" title="Chưa chọn hợp đồng">
              Chọn một hợp đồng bên trái để hiển thị milestone liên quan.
            </Callout>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {loadingMilestones && (
                <Text className="text-sm text-slate-500">
                  Đang tải milestone...
                </Text>
              )}

              {!loadingMilestones && milestones.map((milestone) => (
                <div key={milestone.id} className="border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-secondary-900">{milestone.title}</div>
                      <Caption className="text-xs text-slate-500">
                        Hạn: {formatDateTime(milestone.dueDate)}
                      </Caption>
                    </div>
                    <Badge color={milestone.status === 'completed' ? 'success' : 'warning'}>
                      {milestone.status || 'pending'}
                    </Badge>
                  </div>
                  <Text className="mt-3 text-sm text-slate-600">
                    {milestone.description || 'Milestone này chưa có mô tả chi tiết.'}
                  </Text>
                  <div className="mt-3 text-sm font-semibold text-slate-700">
                    Giá trị: {formatCurrency(milestone.amount)}
                  </div>
                </div>
              ))}

              {!loadingMilestones && milestones.length === 0 && (
                <Callout type="info" title="Chưa có milestone">
                  Hợp đồng này chưa có milestone được tạo.
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
