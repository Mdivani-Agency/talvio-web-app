'use client';
import { useCallback, useState } from 'react';
import { Project } from '@lib/types';
import { OrderedList } from './ordered-list';
import { ConfirmModal } from '@components/modals';
import { Label } from '@components/ui';
import { ProjectForm } from './forms/project.form';
import { FormList } from './form-list';
import type { AppForm } from '@lib/forms/use-form';
import { useFormArray } from '@lib/forms/use-form-array';

type ProjectsViewProps = {
  className?: string;
  form: AppForm;
};

export const ProjectsView = ({ className, form }: ProjectsViewProps) => {
  const [removeItemIndex, setRemoveItemIndex] = useState<number | null>(null);
  const { fields, append, remove, update } = useFormArray<Project>(form, 'projects');

  const handleAddProject = useCallback(
    (project: Project) => {
      append(project);
    },
    [append],
  );

  const handleUpdateProject = useCallback(
    (index: number, project: Project) => {
      update(index, project);
    },
    [update],
  );

  const handleRemoveProject = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove],
  );

  return (
    <section className={className}>
      <Label size="lg" className="mb-6">
        Projects
      </Label>
      <ProjectForm action="add" onSubmit={handleAddProject} />
      <OrderedList fields={fields} label="Projects">
        {({ items, onReorder }) => (
          <FormList
            items={items}
            labelKey="name"
            renderForm={(item, onSubmit) => <ProjectForm action="edit" onSubmit={onSubmit} defaultValues={item} />}
            onReorder={(nextItems) => {
              form.setFieldValue('projects', nextItems);
              onReorder(nextItems);
            }}
            handleUpdateForm={handleUpdateProject}
            handleRemoveForm={setRemoveItemIndex}
          />
        )}
      </OrderedList>
      <ConfirmModal
        isOpen={typeof removeItemIndex === 'number'}
        title="Remove Project"
        description="Please confirm you want to remove this item."
        icon={'TrashBin'}
        className="text-error"
        onClose={() => setRemoveItemIndex(null)}
        onConfirm={() => typeof removeItemIndex === 'number' && handleRemoveProject(removeItemIndex)}
      />
    </section>
  );
};
