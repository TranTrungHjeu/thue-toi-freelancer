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
import TagInput from '../components/common/TagInput';
import DateRangePicker from '../components/common/DateRangePicker';
import ToggleGroup from '../components/common/ToggleGroup';
import InteractiveRating from '../components/common/InteractiveRating';
import DataList from '../components/common/DataList';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useI18n } from '../hooks/useI18n';
import { useToast } from '../hooks/useToast';
import {
  Wallet,
  StatsUpSquare,
  Suitcase,
  MultiBubble,
  Settings,
  Bell,
  InfoCircle,
  Flash,
  Calendar,
} from 'iconoir-react';

const commandActionIcons = {
  jobs: Suitcase,
  account: Settings,
  reports: StatsUpSquare,
  support: InfoCircle,
};

const sharedIcons = {
  wallet: Wallet,
  calendar: Calendar,
  flash: Flash,
  jobs: Suitcase,
  bell: Bell,
  reviews: MultiBubble,
  reports: StatsUpSquare,
};

const ComponentGallery = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchValue, setSearchValue] = useState("");
  const [selectedFilters, setSelectedFilters] = useState(["design"]);

  const { addToast } = useToast();
  const { t } = useI18n();
  const copy = t('componentGallery');
  const sections = copy.sections;

  const toggleFilter = (val) => {
    setSelectedFilters((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val],
    );
  };

  const commandActions = copy.commandPalette.actions.map((action) => {
    const Icon = commandActionIcons[action.iconKey] || InfoCircle;

    return {
      label: action.label,
      description: action.description,
      icon: <Icon className="w-5 h-5" />,
    };
  });

  const summaryItems = sections.advancedInput.summaryItems.map((item) => ({
    ...item,
    icon: sharedIcons[item.iconKey],
  }));

  const statCards = sections.dataDisplay.statCards.map((item) => ({
    ...item,
    icon: sharedIcons[item.iconKey],
  }));

  const advancedTableHeaders = [
    { key: 'id', label: sections.dashboard.tableHeaders.id, sortable: true },
    { key: 'name', label: sections.dashboard.tableHeaders.name, sortable: true },
    { key: 'budget', label: sections.dashboard.tableHeaders.budget, sortable: true },
    {
      key: 'status',
      label: sections.dashboard.tableHeaders.status,
      render: (value) => (
        <Badge color={value === 'completed' ? 'primary' : 'info'}>
          {sections.dashboard.statusLabels[value]}
        </Badge>
      ),
    },
  ];

  const demoUser = {
    name: "Trần Trung Hiếu",
    email: "hieu.tran@example.com",
    avatar: "https://i.pravatar.cc/150?u=hieu",
  };

  return (
    <MainLayout user={demoUser}>
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        actions={commandActions}
      />

      <div className="flex flex-col gap-12 pb-20">
        <section>
          <div className="flex items-center justify-between mb-2">
            <H1 className="text-5xl !mb-0">{copy.hero.title}</H1>
            <Button variant="outline" onClick={() => setIsPaletteOpen(true)} className="flex items-center gap-2">
              <Flash className="w-4 h-4 text-amber-500" />
              {copy.hero.quickSearch}
            </Button>
          </div>
          <Text className="text-slate-500">{copy.hero.description}</Text>
        </section>

        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">{sections.advancedInput.title}</H2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col gap-8">
              <TagInput
                label={sections.advancedInput.tagInputLabel}
                initialTags={sections.advancedInput.tagInputTags}
              />
              <DateRangePicker label={sections.advancedInput.dateRangeLabel} />
              <div className="flex flex-col gap-3">
                <Caption className="font-bold">{sections.advancedInput.viewModeCaption}</Caption>
                <ToggleGroup
                  options={sections.advancedInput.viewModeOptions}
                  value={viewMode}
                  onChange={setViewMode}
                />
              </div>
            </div>
            <div className="bg-slate-50 p-8 border border-slate-200">
              <InteractiveRating label={sections.advancedInput.ratingLabel} initialRating={4} />
              <div className="mt-8">
                <Caption className="mb-4 block">{sections.advancedInput.summaryCaption}</Caption>
                <DataList items={summaryItems} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">{sections.enterprise.title}</H2>
          </div>

          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <Caption className="font-bold">{sections.enterprise.kanbanCaption}</Caption>
              <KanbanBoard columns={sections.enterprise.kanbanColumns} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <Caption className="font-bold">{sections.enterprise.calloutCaption}</Caption>
                <div className="flex flex-col gap-4">
                  <Callout type="warning" title={sections.enterprise.callouts.warning.title}>
                    {sections.enterprise.callouts.warning.description}
                  </Callout>
                  <Callout type="success" title={sections.enterprise.callouts.success.title}>
                    {sections.enterprise.callouts.success.description}
                  </Callout>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <Caption className="font-bold">{sections.enterprise.analyticsCaption}</Caption>
                <ActivityCharts />
                <div className="flex items-center gap-4 mt-2">
                  <Caption className="font-bold">{sections.enterprise.activeTeamCaption}</Caption>
                  <AvatarGroup users={sections.enterprise.activeUsers} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">{sections.dashboard.title}</H2>
          </div>

          <div className="flex flex-col gap-10">
            <div>
              <Caption className="mb-4 block">{sections.dashboard.breadcrumbsCaption}</Caption>
              <Breadcrumbs items={sections.dashboard.breadcrumbs} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="flex flex-col gap-6">
                <Caption className="font-bold">{sections.dashboard.timelineCaption}</Caption>
                <ActivityTimeline activities={sections.dashboard.activities} />
              </div>

              <div className="flex flex-col gap-10">
                <div className="flex gap-12">
                  <ProgressCircle value={85} label={sections.dashboard.profileCompletion} />
                  <ProgressCircle value={42} label={sections.dashboard.currentProjects} size={80} strokeWidth={8} />
                </div>

                <div>
                  <Caption className="mb-4 block">{sections.dashboard.tooltipCaption}</Caption>
                  <div className="flex gap-4">
                    <Tooltip text={sections.dashboard.accountTooltip}>
                      <div className="p-2 border border-slate-200 bg-white">
                        <InfoCircle className="w-5 h-5 text-slate-400" />
                      </div>
                    </Tooltip>
                    <Tooltip text={sections.dashboard.revenueTooltip} position="bottom">
                      <Button variant="outline">{sections.dashboard.revenueButton}</Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Caption className="mb-4 block">{sections.dashboard.tableCaption}</Caption>
              <AdvancedTable
                headers={advancedTableHeaders}
                data={sections.dashboard.tableRows}
                pageSize={4}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">{sections.interaction.title}</H2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col gap-8">
              <Caption className="font-bold">{sections.interaction.searchCaption}</Caption>
              <SearchInput
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={sections.interaction.searchPlaceholder}
              />

              <Caption className="font-bold">{sections.interaction.chatCaption}</Caption>
              <div className="bg-slate-50 p-6 border border-slate-200 flex flex-col gap-4">
                {sections.interaction.chatMessages.map((message) => (
                  <ChatBubble
                    key={`${message.time}-${message.message}`}
                    message={message.message}
                    time={message.time}
                    isSender={message.isSender}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <FileUpload label={sections.interaction.uploadLabel} />
            </div>
          </div>
        </section>

        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">{sections.content.title}</H2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="flex flex-col gap-4">
              <Caption className="font-bold">{sections.content.freelancerCaption}</Caption>
              <FreelancerCard {...sections.content.freelancerCard} />
            </div>
            <div className="flex flex-col gap-4">
              <Caption className="font-bold">{sections.content.projectCaption}</Caption>
              <ProjectCard {...sections.content.projectCard} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-6">
              <FilterGroup
                title={sections.content.filterTitle}
                options={sections.content.filterOptions}
                selectedValues={selectedFilters}
                onChange={toggleFilter}
              />
            </div>
            <div className="lg:col-span-2">
              <Caption className="mb-4 block">{sections.content.emptyCaption}</Caption>
              <EmptyState
                title={sections.content.emptyState.title}
                description={sections.content.emptyState.description}
                actionLabel={sections.content.emptyState.actionLabel}
                onAction={() => setSelectedFilters([])}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">{sections.foundations.title}</H2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <Caption className="font-bold">{sections.foundations.typographyCaption}</Caption>
              <H1>{sections.foundations.heading1}</H1>
              <H2>{sections.foundations.heading2}</H2>
              <Text>{sections.foundations.bodyText}</Text>
              <Caption>{sections.foundations.captionText}</Caption>
            </div>
            <div className="flex flex-col gap-4">
              <Caption className="font-bold">{sections.foundations.paletteCaption}</Caption>
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-primary-500 border border-primary-600" title={sections.foundations.colorTitles.primary} />
                <div className="w-16 h-16 bg-secondary-900 border border-slate-900" title={sections.foundations.colorTitles.secondary} />
                <div className="w-16 h-16 bg-blue-500 border border-blue-600" title={sections.foundations.colorTitles.accent} />
                <div className="w-16 h-16 bg-red-500 border border-red-600" title={sections.foundations.colorTitles.error} />
                <div className="w-16 h-16 bg-amber-500 border border-amber-600" title={sections.foundations.colorTitles.warning} />
                <div className="w-16 h-16 bg-green-500 border border-green-600" title={sections.foundations.colorTitles.success} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">{sections.forms.title}</H2>
          </div>
          <Card className="flex flex-col gap-8">
            <div className="flex flex-wrap gap-4">
              <Button>{sections.forms.primaryAction}</Button>
              <Button variant="outline">{sections.forms.outlineAction}</Button>
              <Button variant="ghost">{sections.forms.ghostAction}</Button>
              <Button disabled>{sections.forms.disabledAction}</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label={sections.forms.standardInputLabel} placeholder={sections.forms.standardInputPlaceholder} />
              <Input label={sections.forms.passwordInputLabel} type="password" placeholder="••••••••" />
              <Input label={sections.forms.disabledInputLabel} disabled placeholder={sections.forms.disabledInputPlaceholder} />
              <div className="flex flex-col gap-2">
                <Caption className="mb-1">{sections.forms.statusCaption}</Caption>
                <div className="flex gap-2">
                  <Badge color="primary">{sections.forms.badges.active}</Badge>
                  <Badge color="secondary">{sections.forms.badges.pending}</Badge>
                  <Badge color="info">{sections.forms.badges.processing}</Badge>
                  <Badge color="error">{sections.forms.badges.rejected}</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">{sections.dataDisplay.title}</H2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statCards.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                icon={item.icon}
                trend={item.trend}
                trendValue={item.trendValue}
                animation={item.animation}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <Caption className="mb-4 block">{sections.dataDisplay.avatarCaption}</Caption>
              <div className="flex gap-4 items-end">
                <Avatar size="sm" src="https://i.pravatar.cc/150?u=1" />
                <Avatar size="md" src="https://i.pravatar.cc/150?u=2" />
                <Avatar size="lg" src="https://i.pravatar.cc/150?u=3" />
                <Avatar size="xl" src="https://i.pravatar.cc/150?u=4" />
              </div>
            </Card>
            <Card>
              <Caption className="mb-4 block">{sections.dataDisplay.processCaption}</Caption>
              <Stepper steps={sections.dataDisplay.processSteps} currentStep={2} />
            </Card>
          </div>
        </section>

        <section>
          <div className="border-b border-slate-200 mb-8 pb-2">
            <H2 className="text-xl uppercase tracking-widest text-primary-600">{sections.feedback.title}</H2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <Caption className="mb-4 block">{sections.feedback.loadingCaption}</Caption>
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
                <Button onClick={() => addToast(sections.feedback.successToast, "success")}>{sections.feedback.successButton}</Button>
                <Button variant="outline" onClick={() => addToast(sections.feedback.errorToast, "error")}>{sections.feedback.errorButton}</Button>
              </div>
              <Button variant="ghost" onClick={() => setIsModalOpen(true)}>{sections.feedback.modalButton}</Button>
            </Card>
          </div>
        </section>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={copy.modal.title}>
        <Text className="mb-6">{copy.modal.description}</Text>
        <Table
          headers={copy.modal.tableHeaders}
          data={copy.modal.tableRows}
        />
        <div className="mt-8 flex justify-end">
          <Button onClick={() => setIsModalOpen(false)}>{copy.modal.close}</Button>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default ComponentGallery;
