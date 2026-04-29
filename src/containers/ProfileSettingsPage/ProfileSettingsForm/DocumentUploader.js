import React, { useRef, useState } from 'react';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { generatePresignedUrl } from '../../../util/api';

import { Button, IconSpinner } from '../../../components';

import css from './DocumentUploader.module.css';

const ACCEPT_DOCS_AND_IMAGES = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';

/**
 * Uploads a file to R2 using a presigned URL.
 * @param {File} file
 * @param {string} storagePath
 * @returns {Promise<string>} public URL
 */
const uploadToR2 = async (file, storagePath) => {
  const response = await generatePresignedUrl({
    storagePath,
    files: [{ name: file.name, type: file.type }],
  });

  if (!response?.success || !response.data?.[0]) {
    throw new Error('Failed to get presigned URL');
  }

  const { url, publicUrl } = response.data[0];

  const putResponse = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  if (!putResponse.ok) {
    throw new Error('Failed to upload file to storage');
  }

  return publicUrl;
};

/**
 * Returns a short display name for a URL (last path segment or the URL itself).
 * @param {string} url
 * @returns {string}
 */
const getDisplayName = url => {
  try {
    const parts = new URL(url).pathname.split('/');
    const segment = parts[parts.length - 1];
    // UUIDs are prefixed — show just the original name portion after the first hyphen groups
    // e.g. "abc123-uuid-originalname.pdf" → "originalname.pdf"
    const dashIndex = segment.indexOf('-', segment.indexOf('-') + 1);
    return dashIndex !== -1 ? segment.slice(dashIndex + 1) : segment;
  } catch {
    return url;
  }
};

/**
 * DocumentUploader
 *
 * A field-connected uploader for documents and images targeting Cloudflare R2.
 * Renders a file input, upload progress, and 'remove' button once a file is uploaded.
 *
 * @component
 * @param {Object} props
 * @param {string} props.fieldName - The React Final Form field name (e.g. 'verificationDocumentUrl')
 * @param {Function} props.onChange - Called with the new public URL (or null on remove)
 * @param {string|null} props.value - Current public URL value from form state
 * @param {string} [props.storagePath] - Storage path prefix for the R2 bucket
 */
const DocumentUploader = props => {
  const { fieldName, onChange, value, storagePath = 'verification-documents', disabled = false } = props;
  const intl = useIntl();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const publicUrl = await uploadToR2(file, storagePath);
      onChange(publicUrl);
    } catch (err) {
      console.error('Document upload error:', err.message);
      setUploadError(intl.formatMessage({ id: 'DocumentUploader.uploadFailed' }));
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-selected after removal
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    setUploadError(null);
  };

  const handleBrowseClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const hasFile = !!value;

  return (
    <div className={css.root}>
      <input
        ref={inputRef}
        id={fieldName}
        name={fieldName}
        type="file"
        accept={ACCEPT_DOCS_AND_IMAGES}
        className={css.hiddenInput}
        onChange={handleFileChange}
        disabled={uploading || disabled}
      />

      {hasFile ? (
        <div className={css.fileRow}>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className={css.fileLink}
            title={value}
          >
            {getDisplayName(value)}
          </a>
          <button
            type="button"
            className={css.removeButton}
            onClick={handleRemove}
            disabled={disabled}
            aria-label={intl.formatMessage({ id: 'DocumentUploader.removeAriaLabel' })}
          >
            &times;
          </button>
        </div>
      ) : (
        <Button
          type="button"
          className={css.uploadButton}
          onClick={handleBrowseClick}
          inProgress={uploading}
          disabled={uploading || disabled}
        >
          {uploading ? (
            <IconSpinner className={css.spinner} />
          ) : (
            <FormattedMessage id="DocumentUploader.uploadButton" />
          )}
        </Button>
      )}

      {uploadError && <p className={css.errorText}>{uploadError}</p>}
    </div>
  );
};

export default DocumentUploader;
