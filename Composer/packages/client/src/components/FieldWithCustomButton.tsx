// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx, css } from '@emotion/react';
import React, { useState, useRef, Fragment, useEffect } from 'react';
import { IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { FluentTheme, SharedColors } from '@fluentui/theme';
import { Icon } from '@fluentui/react/lib/Icon';
import { ActionButton } from '@fluentui/react/lib/Button';
import { FontWeights, mergeStyleSets } from '@fluentui/react/lib/Styling';
import { NeutralColors } from '@fluentui/theme';
import { TextField, DropdownField } from '@bfc/ui-shared';

import { customFieldLabel } from '../styles';

const disabledTextFieldStyle = mergeStyleSets(customFieldLabel, {
  root: {
    selectors: {
      '.ms-TextField-field': {
        background: '#ddf3db',
      },
      '.ms-Dropdown-title': {
        background: '#ddf3db',
      },
      'p > span': {
        width: '100%',
      },
    },
  },
  subComponentStyles: {
    label: {
      root: {
        color: FluentTheme.palette.neutralPrimary,
      },
    },
  },
});

const actionButtonStyle = {
  root: {
    fontSize: '12px',
    fontWeight: FontWeights.regular,
    color: SharedColors.cyanBlue10,
    marginLeft: 0,
    marginTop: -12,
    paddingLeft: 0,
  },
};

const errorContainer = css`
  display: flex;
  width: 100%;
  height: 48px;
  line-height: 48px;
  background: #fed9cc;
  color: ${NeutralColors.black};
`;

const errorIcon = {
  root: {
    color: '#A80000',
    marginRight: 8,
    paddingLeft: 12,
    fontSize: '12px',
  },
};

const errorTextStyle = css`
  margin-bottom: 5px;
`;

type Props = {
  label: string;
  ariaLabel?: string;
  buttonText: string;
  errorMessage?;
  placeholder: string;
  placeholderOnDisable: string;
  value: string;
  onBlur?: (value) => void;
  onChange?: (e, value) => void;
  required?: boolean;
  id?: string;
  options?: IDropdownOption[];
  fieldDataTestId?: string;
  buttonDataTestId?: string;
  tooltip?: string;
};

const errorElement = (errorText: string) => {
  if (!errorText) return '';
  return (
    <span css={errorContainer}>
      <Icon iconName="ErrorBadge" styles={errorIcon} />
      <span css={errorTextStyle}>{errorText}</span>
    </span>
  );
};

export const FieldWithCustomButton: React.FC<Props> = (props) => {
  const {
    label,
    placeholder,
    placeholderOnDisable,
    onChange,
    required = false,
    ariaLabel,
    value,
    buttonText,
    onBlur,
    errorMessage,
    id = '',
    options,
    fieldDataTestId = '',
    buttonDataTestId = '',
    tooltip,
  } = props;
  const [isDisabled, setDisabled] = useState<boolean>(!value);
  const fieldComponentRef = useRef<any>(null);
  const [autoFocusOnTextField, setAutoFocusOnTextField] = useState<boolean>();
  const [localValue, setLocalValue] = useState<string>(value);
  useEffect(() => {
    if (autoFocusOnTextField) {
      fieldComponentRef.current?.focus();
    }
  }, [autoFocusOnTextField]);

  useEffect(() => {
    setLocalValue(value);
    setDisabled(!value);
  }, [value]);

  const commonProps = {
    id,
    label,
    required,
    ariaLabel,
    tooltip,
    styles: customFieldLabel,
  };
  const commonDisabledProps = {
    disabled: true,
    componentRef: fieldComponentRef,
    placeholder: placeholderOnDisable,
    styles: disabledTextFieldStyle,
  };
  const commonEnabledProps = {
    disabled: false,
    placeholder,
    onBlur: () => {
      if (!localValue) {
        setDisabled(true);
      }
      onBlur?.(localValue);
    },
  };

  const disabledField =
    options == null ? (
      <TextField
        {...commonProps}
        {...commonDisabledProps}
        data-testid={fieldDataTestId}
        errorMessage={required ? errorElement(errorMessage) : ''}
      />
    ) : (
      <DropdownField
        {...commonProps}
        {...commonDisabledProps}
        data-testid={fieldDataTestId}
        errorMessage={required ? errorMessage : ''}
        options={options}
      />
    );

  const enabledField =
    options == null ? (
      <TextField
        {...commonProps}
        {...commonEnabledProps}
        data-testid={fieldDataTestId}
        value={localValue}
        onChange={(e, value) => {
          setLocalValue(value ?? '');
          onChange?.(e, value);
        }}
      />
    ) : (
      <DropdownField
        {...commonProps}
        {...commonEnabledProps}
        data-testid={fieldDataTestId}
        options={options}
        selectedKey={localValue}
        onChange={(e, option: IDropdownOption | undefined) => {
          setLocalValue((option?.key as string) ?? '');
          onChange?.(e, option?.key);
        }}
      />
    );

  return (
    <Fragment>
      {isDisabled ? disabledField : enabledField}
      <ActionButton
        data-testid={buttonDataTestId}
        styles={actionButtonStyle}
        onClick={() => {
          setDisabled(false);
          setAutoFocusOnTextField(true);
        }}
      >
        {buttonText}
      </ActionButton>
    </Fragment>
  );
};
