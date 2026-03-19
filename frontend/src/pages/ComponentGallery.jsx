"use client";

import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import StatCard from '../components/common/StatCard';
import Skeleton from '../components/common/Skeleton';
import Stepper from '../components/common/Stepper';
import SearchInput from '../components/common/SearchInput';
import Tag from '../components/common/Tag';
import ProjectCard from '../components/features/ProjectCard';
import FreelancerCard from '../components/features/FreelancerCard';
import ChatBubble from '../components/features/ChatBubble';
import FileUpload from '../components/common/FileUpload';
import FilterGroup from '../components/common/FilterGroup';
import EmptyState from '../components/common/EmptyState';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ActivityTimeline from '../components/features/ActivityTimeline';
import AdvancedTable from '../components/common/AdvancedTable';
import ProgressCircle from '../components/common/ProgressCircle';
import Tooltip from '../components/common/Tooltip';
import KanbanBoard from '../components/features/KanbanBoard';
import CommandPalette from '../components/common/CommandPalette';
import ActivityCharts from '../components/features/ActivityCharts';
import AvatarGroup from '../components/common/AvatarGroup';
import Callout from '../components/common/Callout';
import MilestoneTracker from '../components/features/MilestoneTracker';
import SkillRadar from '../components/features/SkillRadar';
import ContractPreview from '../components/features/ContractPreview';
import SuccessAnimation from '../components/common/SuccessAnimation';
import ScrollTop from '../components/common/ScrollTop';
import LoadingOverlay from '../components/common/LoadingOverlay';
import TagInput from '../components/common/TagInput';
import DateRangePicker from '../components/common/DateRangePicker';
import ToggleGroup from '../components/common/ToggleGroup';
import InteractiveRating from '../components/common/InteractiveRating';
import DataList from '../components/common/DataList';
import ActionSheet from '../components/common/ActionSheet';
import FloatingActionButton from '../components/common/FloatingActionButton';
import PullToRefresh from '../components/common/PullToRefresh';
import ResponsiveTable from '../components/common/ResponsiveTable';
import SegmentedControl from '../components/common/SegmentedControl';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useToast } from '../components/common/Toast';
import { 
  Wallet, 
  StatsUpSquare, 
  Suitcase,
  User, 
  MultiBubble, 
  Settings, 
  Bell, 
  Cloud, 
  Database,
  InfoCircle,
  Flash,
  Calendar,
  MoreHoriz,
  MoreVert,
  CheckCircle,
  WarningTriangle,
  LogOut,
  EditPencil,
  Trash
} from 'iconoir-react';

const ComponentGallery = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchValue, setSearchValue] = useState("");
  const [selectedFilters, setSelectedFilters] = useState(["design"]);
  const { addToast } = useToast();

  const toggleFilter = (val) => {
    setSelectedFilters(prev => 
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };
  
  // ... rest of demo user ...
  const demoUser = {
    name: "Trần Trung Hiếu",
    email: "hieu.tran@example.com",
    avatar: "https://i.pravatar.cc/150?u=hieu"
  };

  return (
    <MainLayout user={demoUser}>
      <CommandPalette 
        isOpen={isPaletteOpen} 
        onClose={() => setIsPaletteOpen(false)}
        actions={[
          { label: "Tìm việc làm", description: "Khám phá danh sách các dự án mới nhất", icon: <Suitcase className="w-5 h-5" /> },
          { label: "Cài đặt tài khoản", description: "Quản lý thông tin cá nhân và mật khẩu", icon: <Settings className="w-5 h-5" /> },
          { label: "Xem báo cáo", description: "Thống kê doanh thu và hoạt động", icon: <StatsUpSquare className="w-5 h-5" /> },
          { label: "Trợ giúp & hỗ trợ", description: "Liên hệ với đội ngũ CSKH", icon: <InfoCircle className="w-5 h-5" /> },
        ]}
      />

      <div className="flex flex-col gap-12 pb-20">
        {/* Header */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <H1 className="text-5xl !mb-0">UI Component Gallery</H1>
            <Button variant="outline" onClick={() => setIsPaletteOpen(true)} className="flex items-center gap-2">
              <Flash className="w-4 h-4 text-amber-500" />
              Quick Search (Ctrl+K)
            </Button>
          </div>
          <Text className="text-slate-500">Hệ thống thành phần chuẩn "Strict Sharpness" dành cho doanh nghiệp.</Text>
        </section>

        {/* 01. Advanced Input & Data Presentation */}
        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">01. Advanced Input & Data</H2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col gap-8">
              <TagInput 
                label="Kỹ năng yêu cầu" 
                initialTags={["React", "Node.jsJS", "Tailwind"]} 
              />
              <DateRangePicker label="Thời gian thực hiện dự kiến" />
              <div className="flex flex-col gap-3">
                <Caption className="font-bold">Chế độ hiển thị</Caption>
                <ToggleGroup 
                  options={[
                    { label: "Lưới", value: "grid" },
                    { label: "Bảng", value: "table" },
                    { label: "Lịch", value: "calendar" }
                  ]}
                  value={viewMode}
                  onChange={setViewMode}
                />
              </div>
            </div>
            <div className="bg-slate-50 p-8 border border-slate-200">
              <InteractiveRating label="Đánh giá nhanh freelancer" initialRating={4} />
              <div className="mt-8">
                <Caption className="mb-4 block">Thông tin tóm tắt</Caption>
                <DataList 
                  items={[
                    { label: "Ngân sách", value: "$3,500", icon: Wallet },
                    { label: "Deadline", value: "15/05/2024", icon: Calendar },
                    { label: "Loại hình", value: "Cố định", icon: Flash },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 02. Enterprise Polish */}
        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">02. Enterprise Polish</H2>
          </div>
          
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <Caption className="font-bold">Project Kanban Board</Caption>
              <KanbanBoard 
                columns={[
                  { 
                    title: "Sắp tới (Todo)", 
                    tasks: [
                      { id: "T-102", title: "Thiết kế Landing Page", date: "20/03", priority: "High", assignee: "H" },
                      { id: "T-105", title: "Nghiên cứu thị trường", date: "22/03", priority: "Low", assignee: "T" }
                    ] 
                  },
                  { 
                    title: "Đang làm (Doing)", 
                    tasks: [
                      { id: "T-101", title: "Phát triển API Mockup", date: "18/03", priority: "Medium", assignee: "A" }
                    ] 
                  },
                  { 
                    title: "Hoàn thiện (Done)", 
                    tasks: [
                      { id: "T-99", title: "Thiết lập môi trường Dev", date: "15/03", priority: "Low", assignee: "K" }
                    ] 
                  }
                ]} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <Caption className="font-bold">Enterprise Callouts</Caption>
                <div className="flex flex-col gap-4">
                  <Callout type="warning" title="Cập nhật hệ thống">
                    Hệ thống sẽ bảo trì vào lúc 02:00 sáng ngày mai. Vui lòng lưu lại công việc của bạn.
                  </Callout>
                  <Callout type="success" title="Xác minh thành công">
                    Tài khoản của bạn đã được xác minh chính chủ.
                  </Callout>
                </div>
              </div>
              
              <div className="flex flex-col gap-6">
                <Caption className="font-bold">Data Visualization & Teams</Caption>
                <ActivityCharts />
                <div className="flex items-center gap-4 mt-2">
                  <Caption className="font-bold">Active Team:</Caption>
                  <AvatarGroup users={[
                    { name: 'User 1', avatar: 'https://i.pravatar.cc/150?u=1' },
                    { name: 'User 2', avatar: 'https://i.pravatar.cc/150?u=2' },
                    { name: 'User 3', avatar: 'https://i.pravatar.cc/150?u=3' },
                    { name: 'User 4', avatar: 'https://i.pravatar.cc/150?u=4' },
                    { name: 'User 5', avatar: 'https://i.pravatar.cc/150?u=5' },
                  ]} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 03. Dashboard Dynamics */}
        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">03. Dashboard Dynamics</H2>
          </div>
          
          <div className="flex flex-col gap-10">
            <div>
              <Caption className="mb-4 block">Breadcrumbs</Caption>
              <Breadcrumbs items={[
                { label: 'Dự án', path: '#projects' },
                { label: 'Chi tiết dự án', path: '#' },
              ]} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="flex flex-col gap-6">
                <Caption className="font-bold">Activity Timeline</Caption>
                <ActivityTimeline activities={[
                  { title: "Báo giá được gửi", time: "10:30 AM", status: "success", description: "Bạn đã gửi báo giá cho dự án Food Delivery App." },
                  { title: "Phỏng vấn mời", time: "Hôm qua", status: "info", description: "Client Phúc Long mời bạn tham gia phỏng vấn trực tuyến." },
                  { title: "Thanh toán thất bại", time: "2 ngày trước", status: "warning", description: "Giao dịch rút tiền $500 không thành công. Hãy kiểm tra lại ngân hàng." },
                ]} />
              </div>
              
              <div className="flex flex-col gap-10">
                <div className="flex gap-12">
                  <ProgressCircle value={85} label="Hồ sơ hoàn tất" />
                  <ProgressCircle value={42} label="Dự án hiện tại" size={80} strokeWidth={8} />
                </div>
                
                <div>
                  <Caption className="mb-4 block">Interactive Tooltips (Hover Me)</Caption>
                  <div className="flex gap-4">
                    <Tooltip text="Thông tin chi tiết tài khoản">
                      <div className="p-2 border border-slate-200 bg-white">
                        <InfoCircle className="w-5 h-5 text-slate-400" />
                      </div>
                    </Tooltip>
                    <Tooltip text="Báo cáo doanh thu tháng" position="bottom">
                      <Button variant="outline">Xem báo cáo</Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Caption className="mb-4 block">Advanced Table (Sorting & Pagination)</Caption>
              <AdvancedTable 
                headers={[
                  { key: 'id', label: 'ID', sortable: true },
                  { key: 'name', label: 'Tên dự án', sortable: true },
                  { key: 'budget', label: 'Ngân sách', sortable: true },
                  { key: 'status', label: 'Trạng thái', render: (val) => <Badge color={val === 'Done' ? 'primary' : 'info'}>{val}</Badge> }
                ]}
                data={[
                  { id: 'PJ001', name: 'Website Landing Page', budget: 1200, status: 'Done' },
                  { id: 'PJ002', name: 'Mobile App Design', budget: 2500, status: 'Pending' },
                  { id: 'PJ003', name: 'API Development', budget: 1800, status: 'Done' },
                  { id: 'PJ004', name: 'Email Template', budget: 400, status: 'Done' },
                  { id: 'PJ005', name: 'SEO Optimization', budget: 900, status: 'Pending' },
                  { id: 'PJ006', name: 'Banner Ads', budget: 300, status: 'Done' },
                ]}
                pageSize={4}
              />
            </div>
          </div>
        </section>

        {/* 04. Interaction & Communication */}
        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">04. Interaction & Communication</H2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col gap-8">
              <Caption className="font-bold">Search & Filtering</Caption>
              <SearchInput 
                value={searchValue} 
                onChange={(e) => setSearchValue(e.target.value)} 
                placeholder="Thử tìm kiếm freelancer..."
              />
              
              <Caption className="font-bold">Chat System</Caption>
              <div className="bg-slate-50 p-6 border border-slate-200 flex flex-col gap-4">
                <ChatBubble 
                  message="Chào bạn, mình đã xem qua yêu cầu thiết kế của bạn. Rất mong được hợp tác!" 
                  time="09:15 AM" 
                />
                <ChatBubble 
                  message="Chào Hiếu! Cảm ơn bạn đã quan tâm. Bạn có thể gửi giúp mình Portfolio link không?" 
                  time="09:20 AM" 
                  isSender 
                />
                <ChatBubble 
                  message="Tất nhiên rồi, mình gửi đính kèm phía dưới nhé." 
                  time="09:22 AM" 
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-8">
              <FileUpload label="Tải lên tài liệu dự án (Tối đa 5 tệp)" />
            </div>
          </div>
        </section>

        {/* 05. Advanced Content */}
        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">05. Advanced Content</H2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="flex flex-col gap-4">
              <Caption className="font-bold">Freelancer Profiles</Caption>
              <FreelancerCard 
                name="Trần Trung Hiếu"
                title="Senior UI/UX Designer"
                rating={4.9}
                reviews={128}
                rate="$35/hr"
                skills={["Figma", "UI/UX", "ReactJS", "Motion"]}
                avatar="https://i.pravatar.cc/150?u=hieu"
                isVerified
              />
            </div>
            <div className="flex flex-col gap-4">
              <Caption className="font-bold">Project Cards</Caption>
              <ProjectCard 
                title="Thiết kế UI/UX App Mobile (Food Delivery)"
                client="Phúc Long Coffee"
                budget="$1,200"
                tags={["Figma", "UI/UX", "Mobile"]}
                postedAt="2 giờ trước"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-6">
              <FilterGroup 
                title="Lĩnh vực chuyên môn"
                options={[
                  { label: "Thiết kế đồ họa", value: "design", count: 42 },
                  { label: "Lập trình Web", value: "web", count: 156 },
                  { label: "Viết lách & Dịch thuật", value: "content", count: 89 },
                ]}
                selectedValues={selectedFilters}
                onChange={toggleFilter}
              />
            </div>
            <div className="lg:col-span-2">
              <Caption className="mb-4 block">No Result State</Caption>
              <EmptyState 
                title="Không tìm thấy freelancer nào" 
                description="Hãy thử bỏ bớt các tiêu chí lọc để thấy nhiều kết quả hơn."
                actionLabel="Xóa toàn bộ bộ lọc"
                onAction={() => setSelectedFilters([])}
              />
            </div>
          </div>
        </section>

        {/* 03. Business Elements (moved and merged) */}
        {/* 06. Foundations */}
        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">06. Foundations</H2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <Caption className="font-bold">Typography Hierarchy</Caption>
              <H1>Heading 1 (Lora)</H1>
              <H2>Heading 2 (Lora)</H2>
              <Text>Body Text (Manrope) - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
              <Caption>Caption Text - Small, subtle details.</Caption>
            </div>
            <div className="flex flex-col gap-4">
              <Caption className="font-bold">Color Tokens</Caption>
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-primary-500 border border-primary-600" title="Primary" />
                <div className="w-16 h-16 bg-secondary-900 border border-slate-900" title="Secondary" />
                <div className="w-16 h-16 bg-blue-500 border border-blue-600" title="Accent" />
                <div className="w-16 h-16 bg-red-500 border border-red-600" title="Error" />
                <div className="w-16 h-16 bg-amber-500 border border-amber-600" title="Warning" />
                <div className="w-16 h-16 bg-green-500 border border-green-600" title="Success" />
              </div>
            </div>
          </div>
        </section>

        {/* 07. Buttons & Form Elements */}
        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">07. Buttons & Form Elements</H2>
          </div>
          <Card className="flex flex-col gap-8">
            <div className="flex flex-wrap gap-4">
              <Button>Primary Action</Button>
              <Button variant="outline">Outline Action</Button>
              <Button variant="ghost">Ghost Action</Button>
              <Button disabled>Disabled Action</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Standard Input" placeholder="Type something..." />
              <Input label="Password Input" type="password" placeholder="••••••••" />
              <Input label="Disabled Input" disabled placeholder="Read only" />
              <div className="flex flex-col gap-2">
                <Caption className="mb-1">Badges</Caption>
                <div className="flex gap-2">
                  <Badge color="primary">Active</Badge>
                  <Badge color="secondary">Pending</Badge>
                  <Badge color="info">Processing</Badge>
                  <Badge color="error">Rejected</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 08. Advanced Data Display */}
        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">08. Advanced Data Display</H2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard label="Dự án đang làm" value="12" icon={Suitcase} trend="up" trendValue="+2" />
            <StatCard label="Thu nhập tháng" value="$3,500" icon={Wallet} trend="up" trendValue="+15%" />
            <StatCard label="Yêu cầu mới" value="5" icon={Bell} animation="swing" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <Caption className="mb-4 block">Avatar Variants (Square Only)</Caption>
              <div className="flex gap-4 items-end">
                <Avatar size="sm" src="https://i.pravatar.cc/150?u=1" />
                <Avatar size="md" src="https://i.pravatar.cc/150?u=2" />
                <Avatar size="lg" src="https://i.pravatar.cc/150?u=3" />
                <Avatar size="xl" src="https://i.pravatar.cc/150?u=4" />
              </div>
            </Card>
            <Card>
              <Caption className="mb-4 block">Stepper Workflow</Caption>
              <Stepper steps={["Brief", "Design", "Dev", "Launch"]} currentStep={2} />
            </Card>
          </div>
        </section>

        {/* 09. Feedback & Interactivity */}
        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">09. Feedback & Interactivity</H2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <Caption className="mb-4 block">Loading Indicators</Caption>
              <div className="flex flex-col gap-6">
                <Spinner />
                <div className="flex flex-col gap-2">
                  <Skeleton height="h-32" />
                  <div className="flex gap-2">
                    <Skeleton width="w-1/2" />
                    <Skeleton width="w-1/2" />
                  </div>
                </div>
              </div>
            </Card>
            <Card className="flex flex-col gap-6 justify-center">
              <div className="flex flex-col gap-3">
                <Button onClick={() => addToast("Thông báo thành công!", "success")}>Trigger Success Toast</Button>
                <Button variant="outline" onClick={() => addToast("Có lỗi xảy ra", "error")}>Trigger Error Toast</Button>
              </div>
              <Button variant="ghost" onClick={() => setIsModalOpen(true)}>Open Sharp Modal</Button>
            </Card>
          </div>
        </section>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Sharp Components Modal">
        <Text className="mb-6">Đây là ví dụ về Modal tuân thủ triết lý Strict Sharpness. Mọi chi tiết đều vuông vức và sắc nét.</Text>
        <Table 
          headers={["ID", "Component", "Status"]}
          data={[
            { id: "01", name: "Button", status: "Verified" },
            { id: "02", name: "Input", status: "Verified" },
            { id: "03", name: "StatCard", status: "In Test" },
          ]}
        />
        <div className="mt-8 flex justify-end">
          <Button onClick={() => setIsModalOpen(false)}>Close Modal</Button>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default ComponentGallery;
