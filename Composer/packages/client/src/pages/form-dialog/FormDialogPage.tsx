// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import styled from '@emotion/styled';
import { navigate, RouteComponentProps } from '@reach/router';
import formatMessage from 'format-message';
import { Stack } from '@fluentui/react/lib/Stack';
import { Text } from '@fluentui/react/lib/Text';
import * as React from 'react';
import { useRecoilValue } from 'recoil';
import { OpenConfirmModal } from '@bfc/ui-shared';
import { Split, SplitMeasuredSizes } from '@geoffcox/react-splitter';

import {
  dispatcherState,
  formDialogErrorState,
  formDialogGenerationProgressingState,
  formDialogLibraryTemplatesState,
  formDialogSchemaIdsState,
} from '../../recoilModel';
import { createNotification } from '../../recoilModel/dispatchers/notification';
import { renderThinSplitter } from '../../components/Split/ThinSplitter';

import CreateFormDialogSchemaModal from './CreateFormDialogSchemaModal';
import { FormDialogSchemaList } from './FormDialogSchemaList';
import { VisualFormDialogSchemaEditor } from './VisualFormDialogSchemaEditor';

const EmptyView = styled(Stack)({
  width: '100%',
  opacity: 0.5,
});

type Props = RouteComponentProps<{ projectId: string; schemaId: string }>;

const FormDialogPage: React.FC<Props> = React.memo((props: Props) => {
  const { projectId = '', schemaId = '' } = props;

  const [generatingSchemaId, setGeneratingSchemaId] = React.useState(schemaId || '');
  React.useEffect(() => setGeneratingSchemaId(schemaId), [schemaId]);

  const formDialogSchemaIds = useRecoilValue(formDialogSchemaIdsState(projectId));
  const formDialogError = useRecoilValue(formDialogErrorState);
  const formDialogLibraryTemplates = useRecoilValue(formDialogLibraryTemplatesState);
  const formDialogGenerationProgressing = useRecoilValue(formDialogGenerationProgressingState);
  const {
    removeFormDialogSchema,
    generateFormDialog,
    createFormDialogSchema,
    updateFormDialogSchema,
    navigateToGeneratedDialog,
    loadFormDialogSchemaTemplates,
    addNotification,
    deleteNotification,
  } = useRecoilValue(dispatcherState);

  const { setPageElementState } = useRecoilValue(dispatcherState);

  const generationStartedRef = React.useRef(false);
  const generationPendingNotificationIdRef = React.useRef<string | undefined>();
  const { 0: createSchemaDialogOpen, 1: setCreateSchemaDialogOpen } = React.useState(false);

  React.useEffect(() => {
    loadFormDialogSchemaTemplates();
  }, []);

  const availableTemplates = React.useMemo(() => formDialogLibraryTemplates.filter((t) => !t.$global), [
    formDialogLibraryTemplates,
  ]);

  const validSchemaId = React.useMemo(() => formDialogSchemaIds.includes(schemaId), [formDialogSchemaIds, schemaId]);

  const createItemStart = React.useCallback(() => setCreateSchemaDialogOpen(true), [setCreateSchemaDialogOpen]);

  const selectItem = React.useCallback((id: string) => {
    navigate(`/bot/${projectId}/forms/${id}`);
  }, []);

  const deleteItem = React.useCallback(
    async (id: string) => {
      const res = await OpenConfirmModal(
        formatMessage('Delete form dialog schema?'),
        formatMessage('Are you sure you want to remove form dialog schema "{id}"?', { id })
      );
      if (res) {
        removeFormDialogSchema({ id, projectId });
        if (schemaId === id) {
          selectItem('');
        }
      }
    },
    [selectItem, removeFormDialogSchema, schemaId]
  );

  const generateDialog = React.useCallback(
    (schemaId: string) => {
      if (schemaId) {
        setGeneratingSchemaId(schemaId);
        generationStartedRef.current = true;

        const notification = createNotification({
          title: formatMessage('Generating dialog for "{schemaId}"', { schemaId }),
          description: formatMessage('Generating your dialog using "{schemaId}" schema, please wait...', { schemaId }),
          type: 'pending',
        });
        generationPendingNotificationIdRef.current = notification.id;
        addNotification(notification);

        generateFormDialog({ projectId, schemaId });
      }
    },
    [generateFormDialog, projectId]
  );

  const viewDialog = React.useCallback(
    (schemaId: string) => {
      if (schemaId) {
        navigateToGeneratedDialog({ projectId, schemaId });
      }
    },
    [navigateToGeneratedDialog, projectId]
  );

  React.useEffect(() => {
    // Check to see if generation was in progress.
    if (generationStartedRef.current && !formDialogGenerationProgressing) {
      generationStartedRef.current = false;

      if (generationPendingNotificationIdRef.current) {
        deleteNotification(generationPendingNotificationIdRef.current);
      }

      // If the generation was started and now it's over check for errors.
      if (!formDialogError) {
        // No error, show success message.
        addNotification(
          createNotification({
            type: 'success',
            title: formatMessage('Dialog generation was successful.'),
            description: formatMessage('Your dialog for "{schemaId}" was generated successfully.', {
              schemaId: generatingSchemaId,
            }),
            link: {
              label: formatMessage('View dialog'),
              onClick: () => generatingSchemaId && viewDialog(generatingSchemaId),
            },
          })
        );
      } else {
        // error, show failed message with error.
        addNotification(
          createNotification({
            type: 'error',
            title: formatMessage('Dialog generation has failed.'),
            description: formDialogError.message,
          })
        );
      }
    } else {
      // There is an error but it's not about generation.
      // Show failed message with error.
      if (formDialogError) {
        addNotification(
          createNotification({
            type: 'error',
            title: formatMessage('Form dialog error'),
            description: formDialogError.message,
          })
        );
      }
    }
  }, [formDialogError, formDialogGenerationProgressing]);

  const updateItem = React.useCallback(
    (id: string, content: string) => {
      if (id === schemaId) {
        updateFormDialogSchema({ id, content, projectId });
      }
    },
    [updateFormDialogSchema, schemaId]
  );

  const createItem = React.useCallback(
    (formDialogName: string) => {
      createFormDialogSchema({ id: formDialogName, projectId });
      setCreateSchemaDialogOpen(false);
    },
    [createFormDialogSchema, setCreateSchemaDialogOpen]
  );

  const onMeasuredSizesChanged = (sizes: SplitMeasuredSizes) => {
    setPageElementState('forms', { leftSplitWidth: sizes.primary });
  };

  return (
    <>
      <Stack horizontal verticalFill>
        <Split
          resetOnDoubleClick
          initialPrimarySize="320px"
          minPrimarySize="320px"
          minSecondarySize="800px"
          renderSplitter={renderThinSplitter}
          onMeasuredSizesChanged={onMeasuredSizesChanged}
        >
          <FormDialogSchemaList
            items={formDialogSchemaIds}
            loading={formDialogGenerationProgressing}
            projectId={projectId}
            selectedId={schemaId}
            onCreateItem={createItemStart}
            onDeleteItem={deleteItem}
            onGenerate={generateDialog}
            onSelectItem={selectItem}
            onViewDialog={viewDialog}
          />
          {validSchemaId ? (
            <VisualFormDialogSchemaEditor
              generationInProgress={formDialogGenerationProgressing}
              projectId={projectId}
              schemaId={schemaId}
              templates={availableTemplates}
              onChange={updateItem}
              onGenerate={generateDialog}
            />
          ) : (
            <EmptyView verticalFill horizontalAlign="center" verticalAlign="center">
              <Text variant="large">
                {schemaId
                  ? formatMessage(`{schemaId} doesn't exist; select a schema to edit or create a new one`, {
                      schemaId,
                    })
                  : formatMessage('Select an schema to edit or create a new one')}
              </Text>
            </EmptyView>
          )}
        </Split>
      </Stack>
      {createSchemaDialogOpen ? (
        <CreateFormDialogSchemaModal
          isOpen={createSchemaDialogOpen}
          projectId={projectId}
          onDismiss={() => setCreateSchemaDialogOpen(false)}
          onSubmit={createItem}
        />
      ) : null}
    </>
  );
});

export default FormDialogPage;
